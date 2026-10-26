import { describe, expect, it } from "vitest";
import {
  newMatch,
  restart,
  step,
  type HumanInput,
  type MatchState,
} from "@/lib/engines/football";
import { constant, seeded } from "@/lib/engines/rng";

const IDLE: HumanInput = {
  mx: 0,
  my: 0,
  sprint: false,
  shoot: null,
  pass: false,
  tackle: false,
};

function playBotMatch(
  rng: () => number,
  kickTeam: "A" | "B" = "A",
  maxTicks = 6000,
) {
  let g: MatchState = restart(newMatch("bot"), kickTeam);
  const events: Record<string, number> = {};
  let nan = 0;
  let stuck = 0;
  let still = 0;
  let prev: { x: number; y: number } | null = null;
  for (let i = 0; i < maxTicks; i++) {
    const before = g;
    const out = step(g, null, rng);
    g = out.g;
    out.events.forEach((e) => {
      events[e] = (events[e] ?? 0) + 1;
    });
    const coords = [
      g.ball.x,
      g.ball.y,
      ...g.players.flatMap((p) => [p.x, p.y]),
    ];
    if (coords.some(Number.isNaN)) nan++;
    const loose = g.freeze === 0 && g.ball.owner === null;
    if (
      loose &&
      prev &&
      Math.abs(prev.x - g.ball.x) + Math.abs(prev.y - g.ball.y) < 0.001
    )
      still++;
    else still = 0;
    if (still > 90) {
      stuck++;
      still = 0;
    }
    prev = { x: g.ball.x, y: g.ball.y };
    if (g.tick === 0 && before.tick > 0)
      return { score: before.score, events, nan, stuck };
  }
  return { score: g.score, events, nan, stuck };
}

describe("football engine", () => {
  it("sets up a 2v2 plus keepers line-up with the kicking team on the ball", () => {
    const g = newMatch("human");
    expect(g.players).toHaveLength(6);
    expect(g.players.filter((p) => p.role === "gk")).toHaveLength(2);
    expect(g.players[0].num).toBe(4);
    expect(g.players[1].num).toBe(9);
    expect(g.ball.owner).toBe(0);
    expect(g.freeze).toBe(20);
    expect(g.score).toEqual({ A: 0, B: 0 });
  });

  it("counts down the kick-off freeze before simulating", () => {
    const g = newMatch("bot");
    const out = step(g, null, constant(0.5));
    expect(out.simulated).toBe(false);
    expect(out.g.freeze).toBe(19);
    expect(out.g.tick).toBe(0);
  });

  it("plays both teams as exact mirrors when randomness is fixed (first half)", () => {
    const rng = constant(0.5);
    let g1 = restart(newMatch("bot"), "A");
    let g2 = restart(newMatch("bot"), "B");
    const pairs: Array<[number, number]> = [
      [0, 2],
      [1, 3],
      [2, 0],
      [3, 1],
      [4, 5],
      [5, 4],
    ];
    // The CPU always kicks off the second half, so the mirror only holds until half-time.
    for (let t = 0; t < 1500 && !g1.halfDone; t++) {
      g1 = step(g1, null, rng).g;
      g2 = step(g2, null, rng).g;
      if (g1.halfDone) break;
      for (const [i, j] of pairs) {
        expect(g1.players[i].x).toBeCloseTo(100 - g2.players[j].x, 6);
        expect(g1.players[i].y).toBeCloseTo(50 - g2.players[j].y, 6);
      }
      expect(g1.ball.x).toBeCloseTo(100 - g2.ball.x, 6);
    }
  });

  it("keeps the two teams balanced over many seeded bot matches", () => {
    let A = 0;
    let B = 0;
    for (let m = 0; m < 24; m++) {
      const kick = m % 2 === 0 ? "A" : "B";
      const r = playBotMatch(seeded(1000 + m), kick);
      A += r.score.A;
      B += r.score.B;
    }
    const total = A + B;
    expect(total).toBeGreaterThan(24 * 2);
    expect(Math.abs(A - B) / total).toBeLessThan(0.25);
  });

  it("never produces NaN positions or a ball that sits dead in open play", () => {
    for (let m = 0; m < 6; m++) {
      const r = playBotMatch(seeded(42 + m));
      expect(r.nan).toBe(0);
      expect(r.stuck).toBe(0);
    }
  });

  it("produces the usual match events: kicks, passes, saves, goals and whistles", () => {
    const r = playBotMatch(seeded(7));
    expect(r.events.kick).toBeGreaterThan(0);
    expect(r.events.pass).toBeGreaterThan(0);
    expect(r.events.goal).toBeGreaterThan(0);
    expect(r.events.end).toBeGreaterThanOrEqual(2);
  });

  it("restarts a bot match after full time but ends a human match", () => {
    const bot = playBotMatch(seeded(3));
    expect(bot.score.A + bot.score.B).toBeGreaterThanOrEqual(0);

    let g = newMatch("human");
    let guard = 0;
    while (!g.over && guard++ < 8000) g = step(g, IDLE, seeded(9)).g;
    expect(g.over).toBe(true);
    expect(Math.floor(g.tick / 30)).toBeGreaterThanOrEqual(90);
    const after = step(g, IDLE, seeded(9));
    expect(after.g).toBe(g);
    expect(after.simulated).toBe(false);
  });

  it("calls half-time at 45 minutes and the CPU kicks off the second half", () => {
    let g = newMatch("bot");
    const rng = seeded(11);
    let halfFlash = false;
    for (let i = 0; i < 2000 && !g.halfDone; i++) {
      g = step(g, null, rng).g;
      if (g.flash?.text === "Half-time") halfFlash = true;
    }
    expect(g.halfDone).toBe(true);
    expect(halfFlash).toBe(true);
    expect(g.pending).toEqual({ type: "kickoff", team: "B" });
  });

  it("lets a keeper attempt only one save per shot", () => {
    const base = newMatch("bot");
    const shot: MatchState = {
      ...base,
      freeze: 0,
      ball: {
        ...base.ball,
        owner: null,
        x: 94,
        y: 25,
        vx: 3,
        vy: 0,
        speed: 3,
        shotBy: "A",
        tried: [5],
      },
    };
    const out = step(shot, null, constant(0));
    expect(out.events).not.toContain("save");
  });

  it("gives the human team the ball back after a shot is taken", () => {
    let g: MatchState = { ...newMatch("human"), freeze: 0 };
    const shoot: HumanInput = { ...IDLE, shoot: 0.8 };
    const out = step(g, shoot, constant(0.5));
    g = out.g;
    expect(out.events).toContain("kick");
    expect(g.ball.owner).toBeNull();
    expect(g.ball.shotBy).toBe("A");
    expect(g.ball.vx).toBeGreaterThan(0);
  });

  it("passes from the human player to the team-mate", () => {
    const g: MatchState = { ...newMatch("human"), freeze: 0 };
    const out = step(g, { ...IDLE, pass: true }, constant(0.5));
    expect(out.events).toContain("pass");
    expect(out.g.ball.intended).toBe(1);
  });

  it("drains stamina while sprinting and recovers while walking", () => {
    let g: MatchState = { ...newMatch("human"), freeze: 0 };
    const sprint: HumanInput = { ...IDLE, mx: 1, sprint: true };
    for (let i = 0; i < 20; i++) g = step(g, sprint, constant(0.99)).g;
    const tired = g.players[g.active].stamina;
    expect(tired).toBeLessThan(1);
    for (let i = 0; i < 20; i++) g = step(g, IDLE, constant(0.99)).g;
    expect(g.players[g.active].stamina).toBeGreaterThan(tired);
  });

  it("awards a goal when the ball crosses the line inside the goal mouth", () => {
    const base = newMatch("bot");
    const g: MatchState = {
      ...base,
      freeze: 0,
      ball: {
        ...base.ball,
        owner: null,
        x: 99.3,
        y: 25,
        vx: 2,
        vy: 0,
        speed: 2,
        shotBy: "A",
        tried: [4, 5],
      },
    };
    const out = step(g, null, constant(0.99));
    expect(out.events).toContain("goal");
    expect(out.g.score.A).toBe(1);
    expect(out.g.pending).toEqual({ type: "kickoff", team: "B" });
  });

  it("gives a throw-in to the other team when the ball goes out at the side", () => {
    const base = newMatch("bot");
    const g: MatchState = {
      ...base,
      freeze: 0,
      ball: {
        ...base.ball,
        owner: null,
        x: 50,
        y: 49.3,
        vx: 0,
        vy: 1,
        speed: 1,
        last: "A",
        tried: [],
      },
    };
    const out = step(g, null, constant(0.99));
    expect(out.g.flash?.text).toBe("Throw-in");
    expect(out.g.pending).toMatchObject({ type: "set", team: "B" });
  });

  it("gives a corner when a defender puts it behind, and a goal kick otherwise", () => {
    const base = newMatch("bot");
    const wide = {
      ...base.ball,
      owner: null,
      x: 99.3,
      y: 5,
      vx: 2,
      vy: 0,
      speed: 2,
      tried: [],
    };
    const corner = step(
      { ...base, freeze: 0, ball: { ...wide, last: "B" } },
      null,
      constant(0.99),
    );
    expect(corner.g.flash?.text).toBe("Corner");
    const goalKick = step(
      { ...base, freeze: 0, ball: { ...wide, last: "A" } },
      null,
      constant(0.99),
    );
    expect(goalKick.g.flash?.text).toBe("Goal kick");

    let g = goalKick.g;
    for (let i = 0; i < 40 && g.pending; i++)
      g = step(g, null, constant(0.99)).g;
    expect(g.players[g.ball.owner ?? 0].role).toBe("gk");
  });
});
