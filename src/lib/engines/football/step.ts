import { clamp, type Rng } from "../rng";
import { aiIntent, keeperIntent } from "./ai";
import { CFG } from "./config";
import { applyPending, decay, dist, freshBall } from "./setup";
import type {
  Ball,
  Flash,
  HumanInput,
  Intent,
  MatchEvent,
  MatchState,
  Pending,
  Player,
  StepResult,
  Team,
} from "./types";

/** Advance the match by one tick (1/30 s). Pure apart from the injected rng. */
export function step(g: MatchState, input: HumanInput | null, rng: Rng): StepResult {
  if (g.over) return { g, events: [], simulated: false };
  if (g.freeze > 0) {
    const left = g.freeze - 1;
    if (left === 0 && g.pending) return { g: applyPending(g), events: [], simulated: false };
    return { g: { ...g, freeze: left, flash: decay(g.flash) }, events: [], simulated: false };
  }
  return { ...simulate(g, input, rng), simulated: true };
}

function shot(o: Player, power: number, rng: Rng, aimY?: number): Ball {
  const goalX = o.team === "A" ? 100 : 0;
  const dir = o.team === "A" ? 1 : -1;
  const d = Math.max(1, Math.abs(goalX - o.x));
  let target = aimY;
  if (target === undefined) {
    const facingGoal = o.fx * dir > 0.2;
    const faceY = facingGoal ? o.y + (o.fy / Math.abs(o.fx)) * d : 25 + o.fy * 6;
    target = 25 + (clamp(faceY, CFG.top - 5, CFG.bottom + 5) - 25) * 0.85;
  }
  const spread = 3.2 * (0.35 + power * power) * (0.6 + d / 40);
  const y = target + (rng() - 0.5) * spread;
  const speed = CFG.shotMin + (CFG.shotMax - CFG.shotMin) * power;
  const dx = goalX - o.x;
  const dy = y - o.y;
  const l = Math.hypot(dx, dy) || 1;
  const b = freshBall(o.x + dir * 1.2, o.y, null, o.team);
  return { ...b, vx: (dx / l) * speed, vy: (dy / l) * speed, speed, shotBy: o.team };
}

function passTo(o: Player, t: Player, j: number): Ball {
  const tx = clamp(t.x + t.vx * 10, 3, 97);
  const ty = clamp(t.y + t.vy * 10, 3, 47);
  const dx = tx - o.x;
  const dy = ty - o.y;
  const l = Math.hypot(dx, dy) || 1;
  const speed = Math.min(CFG.pass * (0.7 + l / 45), CFG.pass * 1.4);
  const b = freshBall(o.x + (dx / l) * 1.5, o.y + (dy / l) * 1.5, null, o.team);
  return { ...b, vx: (dx / l) * speed, vy: (dy / l) * speed, speed, intended: j };
}

function humanIntent(input: HumanInput | null): Intent {
  const it = input ?? { mx: 0, my: 0, sprint: false, shoot: null, pass: false, tackle: false };
  return { mx: it.mx, my: it.my, sprint: it.sprint, shoot: it.shoot, pass: it.pass, arrive: false };
}

/** Keepers re-read the play every 4 ticks: a small reaction delay. */
function keeperTargets(g: MatchState, ball: Ball, tick: number): [number, number] {
  if (tick % 4 !== 0) return g.kTarget;
  const [a, b] = [3.5, 96.5].map((kx, side) => {
    const toward = side === 0 ? ball.vx < -0.2 : ball.vx > 0.2;
    let y = 25 + (ball.y - 25) * 0.45;
    if (ball.owner === null && toward) y = ball.y + ball.vy * ((kx - ball.x) / ball.vx);
    return clamp(y, CFG.keeperY[0], CFG.keeperY[1]);
  });
  return [a, b];
}

/** The human controls whichever of #4 / #9 has the ball or is clearly nearer to it. */
function chooseActive(g: MatchState, players: Player[], ball: Ball, tick: number): number {
  const o = ball.owner === null ? null : players[ball.owner];
  if (o && o.team === "A" && o.role === "out" && ball.owner !== null) return ball.owner;
  if (tick % 12 !== 0) return g.active;
  const near = dist(players[0], ball) <= dist(players[1], ball) ? 0 : 1;
  const gap = dist(players[g.active], ball) - dist(players[near], ball);
  return near !== g.active && gap > 3 ? near : g.active;
}

function move(p: Player, it: Intent, human: boolean, kTarget: [number, number], ball: Ball): Player {
  if (p.role === "gk") {
    const target = kTarget[p.team === "A" ? 0 : 1];
    const sp = CFG.keeperSpeed * (ball.owner === null && Math.abs(ball.vx) > 1.5 ? 1.5 : 1);
    const dy = clamp(target - p.y, -sp, sp);
    return { ...p, y: p.y + dy, vy: dy, vx: 0, fx: p.team === "A" ? 1 : -1, fy: 0 };
  }
  const len = Math.hypot(it.mx, it.my);
  const moving = len > 0.3;
  const sprinting = it.sprint && p.stamina > 0.05 && moving;
  const max = (sprinting ? CFG.sprint : CFG.walk) * (human && p.team === "B" ? CFG.cpuSpeedEase : 1);
  const sp = moving ? (it.arrive ? Math.min(max, len * 0.12) : max) : 0;
  const vx = p.vx + ((moving ? (it.mx / len) * sp : 0) - p.vx) * CFG.accel;
  const vy = p.vy + ((moving ? (it.my / len) * sp : 0) - p.vy) * CFG.accel;
  return {
    ...p,
    vx,
    vy,
    x: clamp(p.x + vx, 2, 98),
    y: clamp(p.y + vy, 2, 48),
    fx: moving ? it.mx / len : p.fx,
    fy: moving ? it.my / len : p.fy,
    stamina: clamp(p.stamina + (sprinting ? -0.011 : 0.004), 0, 1),
    sprinting,
  };
}

interface Frame {
  players: Player[];
  ball: Ball;
  flash: Flash | null;
  events: MatchEvent[];
}

function setCool(players: Player[], i: number, cool: number): Player[] {
  return players.map((q, j) => (j === i ? { ...q, cool } : q));
}

/** The player on the ball shoots, passes or carries it; a loose ball rolls. */
function playBall(f: Frame, intents: Intent[], rng: Rng): Frame {
  const { players, ball } = f;
  if (ball.owner === null) {
    const vx = ball.vx * CFG.fric;
    const vy = ball.vy * CFG.fric;
    return { ...f, ball: { ...ball, x: ball.x + ball.vx, y: ball.y + ball.vy, vx, vy, speed: Math.hypot(vx, vy) } };
  }
  const i = ball.owner;
  const o = players[i];
  const it = intents[i];
  if (o.role === "out" && it.shoot !== null) {
    return { ...f, ball: shot(o, it.shoot, rng, it.aimY), players: setCool(players, i, 10), events: [...f.events, "kick"] };
  }
  if (it.pass) {
    const mates = players.map((q, j) => ({ q, j })).filter(({ q, j }) => q.team === o.team && q.role === "out" && j !== i);
    const space = (m: { q: Player }) =>
      Math.min(...players.filter((x) => x.team !== o.team && x.role === "out").map((x) => dist(x, m.q)));
    const target = mates.length ? mates.reduce((a, b) => (space(a) >= space(b) ? a : b)) : null;
    if (!target) return f;
    return { ...f, ball: passTo(o, target.q, target.j), players: setCool(players, i, 10), events: [...f.events, "pass"] };
  }
  if (o.role === "gk") return { ...f, ball: { ...ball, x: o.x + o.fx * 1.5, y: o.y, vx: 0, vy: 0 } };
  const reach = CFG.carry * (o.sprinting ? 1.3 : 1);
  return { ...f, ball: { ...ball, x: o.x + o.fx * reach, y: o.y + o.fy * reach, vx: 0, vy: 0 } };
}

function tackles(f: Frame, human: boolean, active: number, forcedTackle: boolean, rng: Rng): Frame {
  const ball = f.ball.settle > 0 ? { ...f.ball, settle: f.ball.settle - 1 } : f.ball;
  const base = { ...f, ball };
  if (ball.owner === null || f.players[ball.owner].role !== "out" || ball.settle) return base;
  const oi = ball.owner;
  const o = f.players[oi];
  const tacklers = f.players
    .map((q, j) => ({ q, j }))
    .filter(({ q }) => q.team !== o.team && q.role === "out" && q.cool === 0 && dist(q, ball) < CFG.tackleR);
  for (const { q, j } of tacklers) {
    const forced = human && j === active && forcedTackle;
    const ease = human && q.team === "B" ? CFG.cpuTackleEase : 1;
    const chance = forced ? 0.5 : CFG.tackleP * (o.sprinting ? 1.4 : 1) * ease;
    if (rng() < chance) {
      const won = rng() < 0.55;
      const loose = { ...freshBall(ball.x, ball.y, null, q.team), speed: 1 };
      const next: Ball = won
        ? freshBall(ball.x, ball.y, j, q.team)
        : { ...loose, vx: (q.x < o.x ? 1 : -1) * (0.6 + rng() * 0.6), vy: (rng() - 0.5) * 1.2 };
      return {
        players: setCool(f.players, oi, 16),
        ball: next,
        flash: { text: "Tackled", t: 22 },
        events: [...f.events, "tackle"],
      };
    }
  }
  return base;
}

/** Loose ball: first touch or interception by the nearest player who controls it. */
function firstTouch(f: Frame, rng: Rng): Frame {
  const { ball, players } = f;
  if (ball.owner !== null) return f;
  let best: { i: number; d: number } | null = null;
  players.forEach((p, i) => {
    if (p.role !== "out" || p.cool > 0) return;
    if (ball.shotBy && p.team === ball.shotBy && ball.speed > 1.4) return;
    const d = dist(p, ball);
    if (d > CFG.pickR) return;
    const ctrl = ball.speed < 1.4 ? 1 : ball.intended === i ? 0.85 : 0.3;
    if (rng() < ctrl && (!best || d < best.d)) best = { i, d };
  });
  const got = best as { i: number; d: number } | null;
  if (!got) return f;
  return { ...f, ball: freshBall(ball.x, ball.y, got.i, players[got.i].team) };
}

/** Keepers get one save attempt per shot. */
function saves(f: Frame, rng: Rng): Frame {
  let { ball, flash } = f;
  const events = [...f.events];
  f.players.forEach((k, i) => {
    if (ball.owner !== null || k.role !== "gk" || ball.tried.includes(i)) return;
    const towards = k.team === "A" ? ball.vx < 0 : ball.vx > 0;
    if (!towards || dist(k, ball) > CFG.saveR) return;
    const chance = clamp(1.3 - ball.speed * 0.22 - Math.abs(ball.y - k.y) * 0.1, 0.3, 0.94);
    ball = { ...ball, tried: [...ball.tried, i] };
    if (rng() < chance) {
      ball =
        ball.speed < 2.3
          ? freshBall(k.x, k.y, i, k.team)
          : { ...ball, vx: -ball.vx * 0.4, vy: ball.vy + (rng() - 0.5) * 1.6, shotBy: null, last: k.team };
      flash = { text: "Saved", t: 22 };
      events.push("save");
    }
  });
  return { ...f, ball, flash, events };
}

interface Outcome {
  score: Record<Team, number>;
  pending: Pending | null;
  freeze: number;
  flash: Flash | null;
  events: MatchEvent[];
}

/** Goals and the ball going out of play. */
function outOfPlay(f: Frame, score: Record<Team, number>): Outcome {
  const { ball } = f;
  const none: Outcome = { score, pending: null, freeze: 0, flash: f.flash, events: f.events };
  if (ball.owner !== null) return none;
  const inMouth = ball.y > CFG.top && ball.y < CFG.bottom;
  const endB = ball.x >= 99.4;
  if (ball.x <= 0.6 || endB) {
    const scorer: Team = endB ? "A" : "B";
    const defender: Team = endB ? "B" : "A";
    if (inMouth) {
      return {
        score: { ...score, [scorer]: score[scorer] + 1 },
        flash: { text: "Goal", t: 50 },
        events: [...f.events, "goal"],
        pending: { type: "kickoff", team: defender },
        freeze: 50,
      };
    }
    if (ball.last === defender) {
      const pending: Pending = { type: "set", team: scorer, x: endB ? 92 : 8, y: ball.y < 25 ? 3 : 47 };
      return { score, flash: { text: "Corner", t: 26 }, events: [...f.events, "whistle"], pending, freeze: 26 };
    }
    const pending: Pending = { type: "set", team: defender, keeper: true };
    return { score, flash: { text: "Goal kick", t: 26 }, events: [...f.events, "whistle"], pending, freeze: 26 };
  }
  if (ball.y <= 0.6 || ball.y >= 49.4) {
    const team: Team = ball.last === "A" ? "B" : "A";
    const pending: Pending = { type: "set", team, x: clamp(ball.x, 4, 96), y: ball.y < 25 ? 2.5 : 47.5 };
    return { score, flash: { text: "Throw-in", t: 24 }, events: [...f.events, "whistle"], pending, freeze: 24 };
  }
  return none;
}

/** 90-second match: one real second per minute. */
function clock(g: MatchState, o: Outcome, tick: number): Outcome & { halfDone: boolean } {
  const minute = Math.floor(tick / CFG.ticksPerMinute);
  if (!o.pending && minute >= 45 && !g.halfDone) {
    return {
      ...o,
      halfDone: true,
      flash: { text: "Half-time", t: 45 },
      events: [...o.events, "end"],
      pending: { type: "kickoff", team: "B" },
      freeze: 45,
    };
  }
  if (!o.pending && minute >= 90) {
    const freeze = g.mode === "human" ? 2 : 90;
    return { ...o, halfDone: g.halfDone, flash: { text: "Full time", t: 90 }, events: [...o.events, "end"], pending: { type: "end" }, freeze };
  }
  return { ...o, halfDone: g.halfDone };
}

function simulate(g: MatchState, input: HumanInput | null, rng: Rng): { g: MatchState; events: MatchEvent[] } {
  const human = g.mode === "human";
  const cooled = g.players.map((p) => ({ ...p, cool: Math.max(0, p.cool - 1) }));
  const ball0 = g.ball;
  const hold = ball0.owner !== null && cooled[ball0.owner].role === "gk" ? g.hold + 1 : 0;
  const tick = g.tick + 1;
  const kTarget = keeperTargets(g, ball0, tick);
  const active = human ? chooseActive(g, cooled, ball0, tick) : g.active;

  const intents = cooled.map((p, i) => {
    if (human && i === active) return humanIntent(input);
    if (p.role === "gk") return keeperIntent(i, ball0, hold);
    return aiIntent(i, cooled, ball0, rng);
  });
  const moved = cooled.map((p, i) => move(p, intents[i], human, kTarget, ball0));

  let f: Frame = { players: moved, ball: ball0, flash: decay(g.flash), events: [] };
  f = playBall(f, intents, rng);
  f = tackles(f, human, active, !!input?.tackle, rng);
  f = firstTouch(f, rng);
  f = saves(f, rng);
  const o = clock(g, outOfPlay(f, g.score), tick);

  return {
    g: {
      ...g,
      players: f.players,
      ball: f.ball,
      flash: o.flash,
      active,
      hold,
      kTarget,
      tick,
      score: o.score,
      pending: o.pending,
      freeze: o.freeze,
      halfDone: o.halfDone,
    },
    events: o.events,
  };
}
