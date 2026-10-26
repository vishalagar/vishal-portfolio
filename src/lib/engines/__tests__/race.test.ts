import { describe, expect, it } from "vitest";
import {
  CARS,
  createRace,
  detectLabel,
  DRS_PER_RACE,
  kmh,
  lapOf,
  LAPS,
  litLights,
  NO_INPUT,
  PLAYER_NAME,
  RESULT_TICKS,
  stepRaceTick,
  trackCenter,
  verdict,
  type RaceInput,
  type RaceState,
} from "@/lib/engines/race";
import { seeded } from "@/lib/engines/rng";

const MAX_TICKS = 6000;

function runBot(seed: number): {
  final: RaceState;
  positions: number[];
  drsEvents: number;
  nan: boolean;
} {
  const rng = seeded(seed);
  let s = createRace("attract");
  const positions: number[] = [];
  let drsEvents = 0;
  let nan = false;
  for (let i = 0; i < MAX_TICKS && s.phase !== "over"; i++) {
    s = stepRaceTick(s, NO_INPUT, rng);
    if (s.phase === "race") positions.push(s.position);
    drsEvents += s.events.filter((e) => e === "drs").length;
    if (
      ![
        s.me.d,
        s.me.x,
        s.me.speed,
        ...s.rivals.flatMap((c) => [c.d, c.x, c.speed]),
      ].every(Number.isFinite)
    )
      nan = true;
  }
  return { final: s, positions, drsEvents, nan };
}

function startRace(mode: "play" | "attract", rng = seeded(1)): RaceState {
  let s = createRace(mode);
  while (s.phase === "lights") s = stepRaceTick(s, NO_INPUT, rng);
  return s;
}

function drive(
  s: RaceState,
  inp: RaceInput,
  ticks: number,
  rng = seeded(2),
): RaceState {
  let cur = s;
  for (let i = 0; i < ticks; i++) cur = stepRaceTick(cur, inp, rng);
  return cur;
}

describe("race engine", () => {
  it("starts last of eight with five lights then lights out", () => {
    const s = createRace("play");
    expect(s.rivals).toHaveLength(CARS - 1);
    expect(s.position).toBe(CARS);
    expect(s.rivals.every((c) => c.d > s.me.d)).toBe(true);
    let cur = s;
    const rng = seeded(1);
    for (let i = 0; i < 80; i++) cur = stepRaceTick(cur, NO_INPUT, rng);
    expect(litLights(cur)).toBe(5);
    while (cur.phase === "lights") cur = stepRaceTick(cur, NO_INPUT, rng);
    expect(cur.phase).toBe("race");
    expect(cur.events).toContain("go");
    expect(litLights(cur)).toBe(0);
  });

  it("finishes after three laps with a full finishing order", () => {
    const { final } = runBot(3);
    expect(final.phase).toBe("over");
    expect(lapOf(final)).toBe(LAPS);
    expect(final.finishOrder).toHaveLength(CARS);
    expect(new Set(final.finishOrder).size).toBe(CARS);
    expect(final.finishOrder[final.finishPos - 1]).toBe(PLAYER_NAME);
    expect(final.events).toContain("finish");
  });

  it("limits DRS to three uses however often it is requested", () => {
    let s = startRace("play");
    const rng = seeded(4);
    let uses = 0;
    for (let i = 0; i < 1500 && s.phase === "race"; i++) {
      s = stepRaceTick(s, { steer: 0, brake: false, drs: true }, rng);
      uses += s.events.filter((e) => e === "drs").length;
    }
    expect(uses).toBe(DRS_PER_RACE);
    expect(s.me.drs).toBe(0);
  });

  it("DRS makes the car faster than without it", () => {
    const base = drive(startRace("play"), NO_INPUT, 120);
    const boosted = drive(
      startRace("play"),
      { steer: 0, brake: false, drs: true },
      120,
    );
    expect(boosted.me.d).toBeGreaterThan(base.me.d);
  });

  it("braking slows the car", () => {
    const fast = drive(startRace("play"), NO_INPUT, 100);
    const braked = drive(fast, { steer: 0, brake: true, drs: false }, 60);
    const coasting = drive(fast, NO_INPUT, 60);
    expect(braked.me.speed).toBeLessThan(coasting.me.speed);
    expect(kmh(braked)).toBeLessThan(kmh(fast));
  });

  it("steering moves the car and the edges are clamped", () => {
    const left = drive(
      startRace("play"),
      { steer: -1, brake: false, drs: false },
      200,
    );
    expect(left.me.x).toBeGreaterThanOrEqual(0.02);
    expect(left.me.x).toBeLessThan(0.5);
  });

  it("contact slows whoever is behind and pushes the cars apart", () => {
    const s = startRace("play");
    const rival = {
      ...s.rivals[0],
      d: s.me.d + 3,
      x: s.me.x + 0.02,
      speed: 0.9,
    };
    const hit = stepRaceTick(
      {
        ...s,
        me: { ...s.me, speed: 0.9 },
        rivals: [rival, ...s.rivals.slice(1)],
      },
      NO_INPUT,
      seeded(5),
    );
    expect(hit.events).toContain("contact");
    expect(hit.me.bump).toBeGreaterThan(0);
    expect(hit.rivals[0].x).toBeGreaterThan(rival.x);
    expect(hit.me.x).toBeLessThan(s.me.x);
  });

  it("does not mutate the previous state", () => {
    const s = startRace("play");
    const snapshot = JSON.stringify(s);
    stepRaceTick(s, { steer: 1, brake: false, drs: true }, seeded(6));
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it("is deterministic for the same seed", () => {
    const a = runBot(11).final;
    const b = runBot(11).final;
    expect(a).toEqual(b);
  });

  it("never produces NaN over long bot sims and always finishes", () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const r = runBot(seed);
      expect(r.nan).toBe(false);
      expect(r.final.phase).toBe("over");
      expect(r.drsEvents).toBeLessThanOrEqual(DRS_PER_RACE);
    }
  });

  it("the bot overtakes rivals over several seeds", () => {
    const gains = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => {
      const { positions } = runBot(seed);
      return CARS - Math.min(...positions);
    });
    expect(gains.filter((g) => g > 0).length).toBeGreaterThanOrEqual(6);
    expect(Math.max(...gains)).toBeGreaterThanOrEqual(2);
  });

  it("attract restarts itself after the result; play waits", () => {
    const over = runBot(3).final;
    let attract = over;
    const rng = seeded(1);
    for (let i = 0; i <= RESULT_TICKS; i++)
      attract = stepRaceTick(attract, NO_INPUT, rng);
    expect(attract.phase).toBe("lights");
    let play: RaceState = { ...over, mode: "play" };
    for (let i = 0; i <= RESULT_TICKS + 10; i++)
      play = stepRaceTick(play, NO_INPUT, rng);
    expect(play.phase).toBe("over");
  });

  it("helpers: track centre stays on screen, labels and verdicts", () => {
    for (let d = 0; d < 2700; d += 10) {
      expect(trackCenter(d)).toBeGreaterThan(0.2);
      expect(trackCenter(d)).toBeLessThan(0.8);
    }
    expect(detectLabel(createRace("play").rivals[1])).toBe("car 21 0.91");
    expect(verdict(1)).toMatch(/win/);
    expect(verdict(3)).toMatch(/Podium/);
    expect(verdict(6)).toMatch(/Points/);
  });
});
