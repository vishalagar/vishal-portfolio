import { describe, expect, it } from "vitest";
import {
  BAND,
  BOOST,
  RACE,
  SEC_PER_TICK,
  TARGET,
  botInput,
  clock,
  createPace,
  fmtPace,
  isOnPace,
  kmOf,
  paceOf,
  stepPace,
  verdict,
  type Foot,
  type PaceEvent,
  type PaceInput,
  type PaceState,
} from "../pace";
import { seeded } from "../rng";

const IDLE: PaceInput = { step: null, lane: 0 };

function runBot(seed: number) {
  let s = createPace("bot", seeded(seed));
  const events: PaceEvent[] = [];
  let n = 0;
  while (s.phase !== "over" && n++ < 5000) {
    const out = stepPace(s, botInput(s));
    s = out.state;
    events.push(...out.events);
  }
  return { s, events, n };
}

function runTapper(every: number) {
  let s = createPace("human", seeded(1));
  let foot: Foot = "R";
  let n = 0;
  while (s.phase !== "over" && n < 5000) {
    let step: Foot | null = null;
    if (n % every === 0) {
      foot = foot === "L" ? "R" : "L";
      step = foot;
    }
    s = stepPace(s, { step, lane: 0 }).state;
    n++;
  }
  return { s, n };
}

describe("pace maths", () => {
  it("min/km = 9 / speed", () => {
    expect(paceOf(9 / TARGET)).toBeCloseTo(TARGET, 10);
    expect(paceOf(0)).toBe(0);
    expect(paceOf(0.1)).toBe(0);
  });
  it("matches a unit of 10 m and a tick of 5.4 s", () => {
    const speed = 1.5;
    expect(((100 / speed) * SEC_PER_TICK) / 60).toBeCloseTo(paceOf(speed), 10);
  });
  it("formats pace and clock", () => {
    expect(fmtPace(TARGET)).toBe("6:20");
    expect(fmtPace(5.999)).toBe("6:00");
    expect(clock(1000)).toBe("1:30:00");
  });
  it("on-pace band is +/- 15 s", () => {
    expect(isOnPace(TARGET + BAND)).toBe(true);
    expect(isOnPace(TARGET - BAND)).toBe(true);
    expect(isOnPace(TARGET + BAND + 0.01)).toBe(false);
  });
  it("km clamps at 21.1", () => {
    expect(kmOf(RACE)).toBeCloseTo(21.1, 10);
    expect(kmOf(RACE + 500)).toBe(21.1);
  });
});

describe("pace run rules", () => {
  it("an alternating step boosts, repeating the same foot does not", () => {
    const s0 = createPace("human", seeded(1));
    const a = stepPace(s0, { step: "L", lane: 0 });
    expect(a.events).toContainEqual({ type: "step" });
    expect(a.state.me.speed).toBeCloseTo(BOOST * 0.97, 10);
    const b = stepPace(a.state, { step: "L", lane: 0 });
    expect(b.events).toContainEqual({ type: "stumble" });
    expect(b.state.me.speed).toBeLessThan(a.state.me.speed);
    const c = stepPace(a.state, { step: "R", lane: 0 });
    expect(c.state.me.speed).toBeGreaterThan(a.state.me.speed);
  });
  it("does not mutate the previous state", () => {
    const s0 = createPace("human", seeded(1));
    const frozen = JSON.stringify(s0);
    stepPace(s0, { step: "L", lane: 1 });
    expect(JSON.stringify(s0)).toBe(frozen);
  });
  it("changes lane with a cooldown and clamps to the road", () => {
    let s = createPace("human", seeded(1));
    s = stepPace(s, { step: null, lane: -1 }).state;
    expect(s.me.lane).toBe(0);
    s = stepPace(s, { step: null, lane: -1 }).state;
    expect(s.me.lane).toBe(0);
    for (let i = 0; i < 6; i++) s = stepPace(s, IDLE).state;
    s = stepPace(s, { step: null, lane: 1 }).state;
    expect(s.me.lane).toBe(1);
  });
  it("water refills stamina", () => {
    const s0 = createPace("human", seeded(1));
    const tired: PaceState = { ...s0, rivals: [], me: { ...s0.me, lane: 0, d: 699, stamina: 0.2, speed: 1 } };
    const out = stepPace(tired, IDLE);
    expect(out.events).toContainEqual({ type: "water" });
    expect(out.state.me.stamina).toBe(1);
    expect(out.state.waters[0].taken).toBe(true);
    expect(out.state.flash?.text).toBe("Water");
    const again = stepPace({ ...out.state, me: { ...out.state.me, stamina: 0.2, d: 699 } }, IDLE);
    expect(again.events).not.toContainEqual({ type: "water" });
  });
  it("misses water in another lane", () => {
    const s0 = createPace("human", seeded(1));
    const out = stepPace({ ...s0, rivals: [], me: { ...s0.me, lane: 2, d: 699, speed: 1, stamina: 0.5 } }, IDLE);
    expect(out.events).not.toContainEqual({ type: "water" });
  });
  it("drafting caps speed to the runner ahead", () => {
    const s0 = createPace("human", seeded(1));
    const rival = { ...s0.rivals[0], lane: 1, d: 12, pace: 1 };
    const out = stepPace({ ...s0, rivals: [rival], me: { ...s0.me, lane: 1, d: 10, speed: 1.8 } }, IDLE);
    expect(out.state.drafting).toBe(true);
    expect(out.state.me.speed).toBeLessThanOrEqual(1.02);
  });
  it("tired runners boost less", () => {
    const s0 = createPace("human", seeded(1));
    const fresh = stepPace(s0, { step: "L", lane: 0 }).state.me.speed;
    const tired = stepPace({ ...s0, me: { ...s0.me, stamina: 0.1 } }, { step: "L", lane: 0 }).state.me.speed;
    expect(tired).toBeLessThan(fresh);
  });
});

describe("km scoring bands", () => {
  const cross = (ticksPerKm: number, expectText: string, onPace: boolean) => {
    const s0 = createPace("human", seeded(1));
    const s: PaceState = { ...s0, rivals: [], ticks: ticksPerKm - 1, me: { ...s0.me, d: 99.5, speed: 1, stamina: 1 } };
    const out = stepPace(s, IDLE);
    const km = out.events.find((e) => e.type === "km");
    expect(km).toBeDefined();
    expect(out.state.flash?.text).toBe(expectText);
    expect(out.state.judged).toBe(1);
    expect(out.state.onTarget).toBe(onPace ? 1 : 0);
  };
  it("flashes On pace inside the band", () => cross(Math.round((TARGET * 60) / SEC_PER_TICK), "On pace", true));
  it("flashes Too fast", () => cross(40, "Too fast", false));
  it("flashes Too slow", () => cross(100, "Too slow", false));
  it("counts too-fast km", () => {
    const s0 = createPace("human", seeded(1));
    const out = stepPace({ ...s0, rivals: [], ticks: 39, me: { ...s0.me, d: 99.5, speed: 1 } }, IDLE);
    expect(out.state.fastKms).toBe(1);
  });
  it("verdict picks by tally", () => {
    expect(verdict({ onTarget: 20, fastKms: 0 })).toMatch(/textbook/);
    expect(verdict({ onTarget: 12, fastKms: 0 })).toMatch(/close/);
    expect(verdict({ onTarget: 3, fastKms: 8 })).toMatch(/too fast/);
    expect(verdict({ onTarget: 3, fastKms: 0 })).toMatch(/slow and steady/);
  });
});

describe("full runs", () => {
  it("bot holds the pace for at least 20 of 21 km (pacesim port)", () => {
    for (const seed of [1, 2, 3, 7, 42, 99]) {
      const { s } = runBot(seed);
      expect(s.phase).toBe("over");
      expect(s.judged).toBe(21);
      expect(s.onTarget).toBeGreaterThanOrEqual(20);
    }
  });
  it("bot plays about 50 s and finishes at 21.1 km", () => {
    const { s, n } = runBot(5);
    const seconds = (n * 33) / 1000;
    expect(seconds).toBeGreaterThan(40);
    expect(seconds).toBeLessThan(60);
    expect(kmOf(s.me.d)).toBe(21.1);
    expect(s.me.d).toBeGreaterThanOrEqual(RACE);
  });
  it("bot only steps below target speed and alternates feet", () => {
    const { events } = runBot(3);
    expect(events.filter((e) => e.type === "stumble")).toHaveLength(0);
  });
  it("is deterministic per seed and differs between seeds", () => {
    const a = runBot(11).s;
    const b = runBot(11).s;
    expect(b).toEqual(a);
    const withOther = createPace("bot", seeded(12));
    expect(withOther.rivals.map((r) => r.d)).not.toEqual(createPace("bot", seeded(11)).rivals.map((r) => r.d));
  });
  it("never produces NaN", () => {
    const { s } = runBot(9);
    const flat = JSON.stringify(s);
    expect(flat).not.toMatch(/null.*NaN|NaN/);
    expect(Number.isFinite(s.me.speed)).toBe(true);
    expect(Number.isFinite(s.me.stamina)).toBe(true);
  });
  it("a human tapping every 5 ticks finishes with some km on pace", () => {
    const { s } = runTapper(5);
    expect(s.phase).toBe("over");
    expect(s.onTarget).toBeGreaterThan(8);
  });
  it("a human barely tapping finishes slow with none on pace", () => {
    const { s } = runTapper(7);
    expect(s.onTarget).toBe(0);
    expect(verdict(s)).toMatch(/slow and steady/);
  });
  it("after the finish the state stays put", () => {
    const { s } = runBot(4);
    const out = stepPace(s, { step: "L", lane: 1 });
    expect(out.events).toEqual([]);
    expect(out.state.me).toBe(s.me);
    expect(out.state.phase).toBe("over");
  });
});
