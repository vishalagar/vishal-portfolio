import { clamp } from "../rng";
import { CFG } from "./config";
import type {
  Ball,
  Flash,
  MatchState,
  Mode,
  Player,
  Point,
  Role,
  Team,
} from "./types";

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function decay(f: Flash | null): Flash | null {
  return f && f.t > 1 ? { ...f, t: f.t - 1 } : null;
}

export function freshBall(
  x: number,
  y: number,
  owner: number | null,
  last: Team,
): Ball {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    owner,
    last,
    shotBy: null,
    speed: 0,
    intended: null,
    tried: [],
    settle: owner === null ? 0 : CFG.settle,
  };
}

function player(
  x: number,
  y: number,
  team: Team,
  role: Role,
  num: number,
): Player {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    fx: team === "A" ? 1 : -1,
    fy: 0,
    team,
    role,
    num,
    cool: 0,
    stamina: 1,
    sprinting: false,
  };
}

/** VA (#4, #9) vs CPU (#3, #5), plus keepers. Index order matters: 0–1 team A, 2–3 team B, 4–5 keepers. */
export function lineup(kickTeam: Team): Player[] {
  return [
    player(kickTeam === "A" ? 47 : 40, 25, "A", "out", 4),
    player(36, 14, "A", "out", 9),
    player(kickTeam === "B" ? 53 : 60, 25, "B", "out", 3),
    player(64, 36, "B", "out", 5),
    player(3.5, 25, "A", "gk", 1),
    player(96.5, 25, "B", "gk", 1),
  ];
}

export function restart(g: MatchState, kickTeam: Team): MatchState {
  const players = lineup(kickTeam);
  const owner = kickTeam === "A" ? 0 : 2;
  const o = players[owner];
  return {
    ...g,
    players,
    ball: freshBall(o.x + o.fx * 2, o.y, owner, kickTeam),
    active: 0,
    freeze: 20,
    pending: null,
    hold: 0,
    kTarget: [25, 25],
  };
}

export function newMatch(mode: Mode): MatchState {
  // restart() fills in the players, ball and restart fields
  const blank = {
    mode,
    score: { A: 0, B: 0 },
    tick: 0,
    over: false,
    halfDone: false,
    flash: null,
  } as MatchState;
  return restart(blank, "A");
}

/** Run the restart that was waiting for the freeze to end: kick-off, set piece or full time. */
export function applyPending(g: MatchState): MatchState {
  const p = g.pending;
  if (!p) return g;
  if (p.type === "kickoff") return { ...restart(g, p.team), flash: g.flash };
  if (p.type === "end") {
    return g.mode === "bot"
      ? newMatch("bot")
      : { ...g, over: true, pending: null, freeze: 0 };
  }
  const still = g.players.map((q) => ({ ...q, vx: 0, vy: 0 }));
  let owner: number;
  let players = still;
  if (p.keeper) {
    owner = still.findIndex((q) => q.role === "gk" && q.team === p.team);
  } else {
    const options = still
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.team === p.team && q.role === "out");
    owner = options.reduce((a, b) => (dist(a.q, p) <= dist(b.q, p) ? a : b)).i;
    const dir = p.team === "A" ? 1 : -1;
    players = still.map((q, i) =>
      i === owner
        ? {
            ...q,
            x: clamp(p.x - dir * 2, 2, 98),
            y: clamp(p.y, 2, 48),
            fx: dir,
            fy: 0,
          }
        : q,
    );
  }
  const o = players[owner];
  const active =
    g.mode === "human" && p.team === "A" && o.role === "out" ? owner : g.active;
  return {
    ...g,
    players,
    ball: freshBall(o.x, o.y, owner, p.team),
    pending: null,
    freeze: 0,
    hold: 0,
    active,
  };
}
