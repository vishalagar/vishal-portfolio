import { clamp, type Rng } from "../rng";
import { CFG } from "./config";
import { dist } from "./setup";
import type { Ball, Intent, Player } from "./types";

function flip<T extends { x: number; y: number; vx: number; vy: number }>(
  o: T,
): T {
  const f = o as T & { fx?: number; fy?: number };
  return {
    ...o,
    x: 100 - o.x,
    y: 50 - o.y,
    vx: -o.vx,
    vy: -o.vy,
    fx: -(f.fx ?? 0),
    fy: -(f.fy ?? 0),
  };
}

export function keeperIntent(i: number, ball: Ball, hold: number): Intent {
  return {
    mx: 0,
    my: 0,
    sprint: false,
    shoot: null,
    pass: ball.owner === i && hold > CFG.keeperHold,
    arrive: false,
  };
}

/**
 * The AI thinks in a frame where its own team always attacks to the right,
 * so both teams make exactly mirrored decisions. This fixed a 60/40 CPU bias.
 */
export function aiIntent(
  i: number,
  players: Player[],
  ball: Ball,
  rng: Rng,
): Intent {
  const p = players[i];
  if (p.team === "A") return aiThink(i, players, ball, rng);
  const it = aiThink(i, players.map(flip), flip(ball), rng);
  return {
    ...it,
    mx: -it.mx,
    my: -it.my,
    aimY: it.aimY === undefined ? undefined : 50 - it.aimY,
  };
}

function aiThink(i: number, players: Player[], ball: Ball, rng: Rng): Intent {
  const p = players[i];
  const ownX = 0;
  const outs = players
    .map((q, j) => ({ q, j }))
    .filter(({ q }) => q.role === "out");
  const mate = outs.find(({ q, j }) => q.team === p.team && j !== i);
  const foes = outs.filter(({ q }) => q.team !== p.team).map(({ q }) => q);
  const go = (x: number, y: number, sprint = false): Intent => ({
    mx: x - p.x,
    my: y - p.y,
    sprint,
    shoot: null,
    pass: false,
    arrive: true,
  });
  const owner = ball.owner === null ? null : players[ball.owner];
  const nearFoe = Math.min(...foes.map((f) => dist(f, p)));

  if (ball.owner === i)
    return carrierIntent(p, players, foes, mate?.q, nearFoe, go, rng);

  if (owner && owner.team === p.team) {
    // supporting run ahead, on the opposite side
    return go(clamp(owner.x + 15, 8, 92), owner.y < 25 ? 35 : 15);
  }
  const team = outs.filter(({ q }) => q.team === p.team);
  const chaser = team.reduce((a, b) =>
    dist(a.q, ball) <= dist(b.q, ball) ? a : b,
  );
  if (chaser.j === i) return { ...go(ball.x, ball.y, true), arrive: false };
  const others = foes.filter((f) => f !== owner);
  if (others.length) {
    const mark = others.reduce((a, b) =>
      Math.abs(a.x - ownX) <= Math.abs(b.x - ownX) ? a : b,
    );
    return go(mark.x - 4, mark.y);
  }
  return go((ball.x + ownX) / 2, (ball.y + 25) / 2);
}

function carrierIntent(
  p: Player,
  players: Player[],
  foes: Player[],
  mate: Player | undefined,
  nearFoe: number,
  go: (x: number, y: number, sprint?: boolean) => Intent,
  rng: Rng,
): Intent {
  const goalX = 100;
  const toGoal = Math.hypot(goalX - p.x, 25 - p.y);
  const inRange = Math.abs(goalX - p.x) < 26;
  if (inRange && (nearFoe < 6 || toGoal < 15)) {
    const keeper = players.find((q) => q.role === "gk" && q.team !== p.team);
    const aimY = keeper && keeper.y >= 25 ? CFG.top + 1 : CFG.bottom - 1;
    return { ...go(goalX, 25), arrive: false, shoot: 0.55 + rng() * 0.4, aimY };
  }
  if (mate) {
    const mateAhead = mate.x - p.x > 3;
    const mateSpace = Math.min(...foes.map((f) => dist(f, mate)));
    if (
      nearFoe < 4 &&
      mateSpace > 7 &&
      (mateAhead || nearFoe < 2.5) &&
      rng() < 0.18
    ) {
      return { ...go(mate.x, mate.y), pass: true };
    }
  }
  const f = foes.reduce((a, b) => (dist(a, p) <= dist(b, p) ? a : b));
  const dodge = nearFoe < 9 ? (f.y > p.y ? -9 : 9) : 0;
  return {
    ...go(goalX - 6, clamp(25 + (p.y - 25) * 0.6 + dodge, 5, 45), nearFoe > 8),
    arrive: false,
  };
}
