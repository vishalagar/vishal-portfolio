/**
 * PaceCoach pace run: hold the coach's target for a half marathon, ~50 s of play.
 * Pure and deterministic: immutable state, a fixed tick, randomness injected.
 * Ported from design/mock-worlds/MarathonGame.dc.html (tuning from sim/pacesim.mjs).
 *
 * Units: 1 distance unit = 10 m. One tick = SEC_PER_TICK of race time,
 * so min/km = 100 / speed * SEC_PER_TICK / 60 = 9 / speed.
 */
import { clamp, type Rng } from "./rng";

export const RACE = 2110;
export const KM_UNITS = 100;
export const LAST_KM = 21;
/** Coach's target: 6:20 /km. */
export const TARGET = 6 + 20 / 60;
/** A km is "on pace" within 15 s of the target (in minutes). */
export const BAND = 0.25;
/** Speed added per alternating step. Holding the target takes ~5-6 steps a second. */
export const BOOST = 0.26;
export const SEC_PER_TICK = 5.4;
/** Fixed tick length in ms (30 Hz). */
export const TICK_MS = 33;
export const LANES = 3;
const LANE_COOLDOWN = 6;
const TIRED = 0.15;
const DRAFT_GAP = 4;
const RIVAL_SHIRTS = ["#e8590c", "#2f9e44", "#ae3ec9", "#f2f2f2", "#fab005", "#e03131", "#1098ad"] as const;

export type Foot = "L" | "R";
export type PaceMode = "bot" | "human";

export interface PaceInput {
  step: Foot | null;
  /** -1 up, 1 down, 0 none. */
  lane: -1 | 0 | 1;
}

export interface Rival {
  id: number;
  shirt: string;
  lane: number;
  d: number;
  pace: number;
  phase: number;
}

export interface Water {
  d: number;
  lane: number;
  taken: boolean;
}

export interface Runner {
  lane: number;
  d: number;
  speed: number;
  stamina: number;
  last: Foot | null;
  step: number;
  laneCool: number;
  sinceStep: number;
}

export type FlashKind = "go" | "good" | "bad" | "info";
export interface Flash {
  text: string;
  sub?: string;
  kind: FlashKind;
  /** Ticks left. */
  t: number;
}

export type PaceEvent =
  | { type: "step" }
  | { type: "stumble" }
  | { type: "water" }
  | { type: "km"; km: number; split: number; onPace: boolean; tooFast: boolean }
  | { type: "finish" };

export interface PaceState {
  mode: PaceMode;
  phase: "run" | "over";
  /** Ticks since the run started (drives rival surges). */
  t: number;
  me: Runner;
  rivals: Rival[];
  waters: Water[];
  flash: Flash | null;
  drafting: boolean;
  position: number;
  /** Race ticks (the clock). */
  ticks: number;
  kmTick: number;
  onTarget: number;
  judged: number;
  fastKms: number;
}

export function createPace(mode: PaceMode, rng: Rng): PaceState {
  // the rng nudges each rival's start a little so no two runs are identical
  const rivals: Rival[] = RIVAL_SHIRTS.map((shirt, i) => ({
    id: 101 + i * 13,
    shirt,
    lane: i % LANES,
    d: 6 + i * 7 + Math.floor(rng() * 2),
    pace: 1.05 + ((i * 17) % 9) / 22,
    phase: i,
  }));
  return {
    mode,
    phase: "run",
    t: 0,
    me: { lane: 1, d: 0, speed: 0, stamina: 1, last: null, step: 0, laneCool: 0, sinceStep: 0 },
    rivals,
    waters: [
      { d: 700, lane: 0, taken: false },
      { d: 1400, lane: 2, taken: false },
    ],
    flash: { text: "Go", sub: `hold ${fmtPace(TARGET)} /km`, kind: "go", t: 40 },
    drafting: false,
    position: rivals.length + 1,
    ticks: 0,
    kmTick: 0,
    onTarget: 0,
    judged: 0,
    fastKms: 0,
  };
}

/** Pace in min/km for a speed (0 when standing). */
export function paceOf(speed: number): number {
  return speed > 0.2 ? 9 / speed : 0;
}

export function fmtPace(min: number): string {
  const m = Math.floor(min);
  const sec = Math.round((min - m) * 60);
  return sec === 60 ? `${m + 1}:00` : `${m}:${String(sec).padStart(2, "0")}`;
}

/** Race clock, h:mm:ss. */
export function clock(ticks: number): string {
  const s = Math.round(ticks * SEC_PER_TICK);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Distance in km, clamped to the 21.1 km finish. */
export function kmOf(d: number): number {
  return Math.min(21.1, d / KM_UNITS);
}

export function isOnPace(pace: number): boolean {
  return Math.abs(pace - TARGET) <= BAND;
}

/** Game-copy verdict from the km tally (not a claim about the real app). */
export function verdict(s: Pick<PaceState, "onTarget" | "fastKms">): string {
  if (s.onTarget >= 17) return "PaceCoach: textbook. The plan stays as it is.";
  if (s.onTarget >= 10) return "PaceCoach: close. Next week adds a steady tempo run.";
  if (s.fastKms >= 6) return "PaceCoach: went out too fast. Easy week, then try again.";
  return "PaceCoach: slow and steady. The plan eases the target a little.";
}

function blocker(rivals: readonly Rival[], d: number, lane: number): Rival | undefined {
  return rivals.find((r) => r.lane === lane && r.d > d && r.d - d < DRAFT_GAP);
}

/** The pacer bot: steps (alternating feet) only when below target speed, and steps out around a blocker. */
export function botInput(s: PaceState): PaceInput {
  const { me } = s;
  const want = 9 / TARGET;
  const step: Foot | null = me.sinceStep >= 3 && me.speed < want - BOOST / 2 ? (me.last === "L" ? "R" : "L") : null;
  let lane: -1 | 0 | 1 = 0;
  if (blocker(s.rivals, me.d, me.lane)) {
    const free = [0, 1, 2].filter((l) => Math.abs(l - me.lane) === 1 && !blocker(s.rivals, me.d, l));
    if (free.length) lane = (free[0] - me.lane) as -1 | 1;
  }
  return { step, lane };
}

function applyStep(me: Runner, foot: Foot): { me: Runner; events: PaceEvent[]; flash: Flash | null } {
  if (foot === me.last) {
    // same foot twice: stumble
    return { me: { ...me, speed: me.speed * 0.85, last: foot }, events: [{ type: "stumble" }], flash: { text: "Stumble", kind: "bad", t: 14 } };
  }
  const boosted = me.speed + BOOST * (me.stamina > TIRED ? 1 : 0.4);
  return { me: { ...me, speed: boosted, step: me.step + 1, sinceStep: 0, last: foot }, events: [{ type: "step" }], flash: null };
}

function scoreKm(s: PaceState, kmNow: number, ticks: number): { patch: Partial<PaceState>; event: PaceEvent; flash: Flash } {
  const split = ((ticks - s.kmTick) * SEC_PER_TICK) / 60;
  const off = split - TARGET;
  const onPace = Math.abs(off) <= BAND;
  const tooFast = off < 0;
  const sub = `km ${kmNow} · ${fmtPace(split)} /km`;
  const flash: Flash = onPace
    ? { text: "On pace", sub, kind: "good", t: 26 }
    : { text: tooFast ? "Too fast" : "Too slow", sub, kind: "bad", t: 26 };
  return {
    patch: {
      judged: s.judged + 1,
      kmTick: ticks,
      onTarget: s.onTarget + (onPace ? 1 : 0),
      fastKms: s.fastKms + (!onPace && tooFast ? 1 : 0),
    },
    event: { type: "km", km: kmNow, split, onPace, tooFast },
    flash,
  };
}

export function stepPace(s: PaceState, input: PaceInput): { state: PaceState; events: PaceEvent[] } {
  if (s.phase === "over") return { state: { ...s, t: s.t + 1 }, events: [] };
  const events: PaceEvent[] = [];
  let flash: Flash | null = s.flash && s.flash.t > 1 ? { ...s.flash, t: s.flash.t - 1 } : null;
  let me = s.me;

  if (input.step) {
    const out = applyStep(me, input.step);
    me = out.me;
    events.push(...out.events);
    flash = out.flash ?? flash;
  }
  me = { ...me, sinceStep: me.sinceStep + 1, laneCool: Math.max(0, me.laneCool - 1) };
  if (input.lane && me.laneCool === 0) {
    me = { ...me, lane: clamp(me.lane + input.lane, 0, LANES - 1), laneCool: LANE_COOLDOWN };
  }
  const cap = me.stamina > TIRED ? 1.9 : 1.15;
  let speed = Math.min(cap, me.speed * 0.97);
  const block = blocker(s.rivals, s.me.d, me.lane);
  const drafting = !!block;
  if (block) speed = Math.min(speed, block.pace * 1.02);
  const stamina = clamp(me.stamina + (speed > 1.5 && !drafting ? -0.0045 : 0.0025), 0, 1);
  me = { ...me, speed, stamina, d: me.d + speed };

  const waters = s.waters.map((w) => {
    if (!w.taken && w.lane === me.lane && Math.abs(w.d - me.d) < 2) {
      me = { ...me, stamina: 1 };
      flash = { text: "Water", kind: "info", t: 20 };
      events.push({ type: "water" });
      return { ...w, taken: true };
    }
    return w;
  });

  const rivals = s.rivals.map((r) => ({
    ...r,
    d: r.d + r.pace * (1 + 0.08 * Math.sin((s.t + r.id) / 90)) * (s.mode === "human" ? 0.96 : 1),
    phase: r.phase + 0.35 * r.pace,
  }));

  const ticks = s.ticks + 1;
  let tally: Partial<PaceState> = {};
  const kmNow = Math.floor(me.d / KM_UNITS);
  if (kmNow > Math.floor(s.me.d / KM_UNITS) && kmNow <= LAST_KM) {
    const km = scoreKm(s, kmNow, ticks);
    tally = km.patch;
    flash = km.flash;
    events.push(km.event);
  }
  const position = 1 + rivals.filter((r) => r.d > me.d).length;
  const next: PaceState = { ...s, ...tally, me, rivals, waters, flash, drafting, position, ticks, t: s.t + 1 };
  if (me.d >= RACE) {
    events.push({ type: "finish" });
    return { state: { ...next, phase: "over", t: 0, flash: null }, events };
  }
  return { state: next, events };
}
