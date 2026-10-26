import type { Rng } from "./rng";

/** Fixed simulation step (the mock ticks at 30 Hz). */
export const LABEL_TICK_MS = 33;
/** The scan zone, as a percentage of the belt width. */
export const GATE: readonly [number, number] = [58, 72];
export const RETRAIN_EVERY = 8;
export const START_VERSION = 14;
/** Reaching this model version ends the shift. */
export const FINAL_VERSION = 18;
export const START_LIVES = 3;
/** Ticks the attract bot waits on the end screen before a new batch. */
export const ATTRACT_RESTART_TICKS = 150;
/** Chance the bot labels a chip correctly. */
export const BOT_SKILL = 0.92;

const START_SPEED = 0.32;
const MAX_SPEED = 0.62;
const MAX_ACC = 0.97;
const SPAWN_X = -6;
const DESPAWN_X = 110;
const CRACK_RATE = 0.4;

export type Verdict = "defect" | "clean";
export type ChipResult = "ok" | "auto" | "wrong";
export type LabelEvent = "good" | "bad" | "retrain" | "over";

export interface Chip {
  id: number;
  x: number;
  crack: boolean;
  /** What the model thinks, and how sure it is. */
  guess: boolean;
  conf: number;
  done: boolean;
  result: ChipResult | null;
}

export interface Flash {
  text: string;
  t: number;
  tone: "cyan" | "red";
}

export interface LabelState {
  t: number;
  phase: "run" | "over";
  chips: readonly Chip[];
  nextId: number;
  spawn: number;
  speed: number;
  version: number;
  acc: number;
  labels: number;
  sinceRetrain: number;
  score: number;
  streak: number;
  lives: number;
  flash: Flash | null;
}

export function createLabelRush(): LabelState {
  return {
    t: 0,
    phase: "run",
    chips: [],
    nextId: 1,
    spawn: 20,
    speed: START_SPEED,
    version: START_VERSION,
    acc: 0.7,
    labels: 0,
    sinceRetrain: 0,
    score: 0,
    streak: 0,
    lives: START_LIVES,
    flash: { text: "Batch incoming", t: 40, tone: "cyan" },
  };
}

export function inGate(c: Pick<Chip, "x">): boolean {
  return c.x >= GATE[0] && c.x <= GATE[1];
}

/** The model is right with probability acc; its confidence tracks how sure it is. */
function predict(crack: boolean, acc: number, rng: Rng): { guess: boolean; conf: number } {
  const right = rng() < acc;
  return { guess: right ? crack : !crack, conf: Math.min(0.99, acc + (rng() - 0.5) * 0.2) };
}

/** The attract bot: labels the first fresh chip once it is past the middle of the scan zone. */
export function botLabel(st: LabelState, rng: Rng): Verdict | null {
  const mid = (GATE[0] + GATE[1]) / 2;
  const c = st.chips.find((k) => inGate(k) && !k.done && k.x > mid);
  if (!c) return null;
  const right = rng() < BOT_SKILL;
  return c.crack === right ? "defect" : "clean";
}

export interface StepOut {
  state: LabelState;
  events: LabelEvent[];
}

/** Advance the run by one tick. `label` is the annotator's verdict this tick, if any. */
export function stepLabelRush(st: LabelState, label: Verdict | null, rng: Rng): StepOut {
  const events: LabelEvent[] = [];
  let { score, streak, lives, labels, sinceRetrain, version, acc, speed, nextId, spawn } = st;
  let flash: Flash | null = st.flash && st.flash.t > 1 ? { ...st.flash, t: st.flash.t - 1 } : null;
  const bad = (text: string) => {
    lives -= 1;
    streak = 0;
    flash = { text, t: 26, tone: "red" };
    events.push("bad");
  };

  spawn -= 1;
  let chips: Chip[] = st.chips.map((c) => ({ ...c, x: c.x + speed }));
  if (spawn <= 0) {
    const crack = rng() < CRACK_RATE;
    const p = predict(crack, acc, rng);
    chips = [...chips, { id: nextId, x: SPAWN_X, crack, guess: p.guess, conf: p.conf, done: false, result: null }];
    nextId += 1;
    spawn = Math.round(70 / (speed / START_SPEED));
  }

  if (label) {
    const target = chips.find((k) => inGate(k) && !k.done);
    if (target) {
      const correct = (label === "defect") === target.crack;
      chips = chips.map((c) => (c.id === target.id ? { ...c, done: true, result: correct ? "ok" : "wrong" } : c));
      if (correct) {
        score += 100 + streak * 10;
        streak += 1;
        labels += 1;
        sinceRetrain += 1;
        events.push("good");
      } else {
        bad("Mislabelled");
      }
    }
  }

  // chips that leave the gate unlabelled: the model's guess goes through
  chips = chips.map((c) => {
    if (c.done || c.x <= GATE[1]) return c;
    const correct = c.guess === c.crack;
    if (correct) score += 40;
    else if (c.crack) bad("Defect shipped");
    else score -= 20;
    return { ...c, done: true, result: correct ? "auto" : "wrong" };
  });
  chips = chips.filter((c) => c.x < DESPAWN_X);

  if (sinceRetrain >= RETRAIN_EVERY) {
    sinceRetrain = 0;
    version += 1;
    acc = Math.min(MAX_ACC, acc + 0.07);
    speed = Math.min(MAX_SPEED, speed + 0.06);
    flash = { text: `Retrained · v${version}`, t: 40, tone: "cyan" };
    events.push("retrain");
  }

  const over = lives <= 0 || version >= FINAL_VERSION;
  if (over) events.push("over");
  return {
    state: {
      ...st,
      t: over ? 0 : st.t + 1,
      phase: over ? "over" : "run",
      chips,
      spawn,
      nextId,
      speed,
      version,
      acc,
      labels,
      sinceRetrain,
      score,
      streak,
      lives,
      flash,
    },
    events,
  };
}

/** Tick the end screen (keeps the scenery moving and times the attract restart). */
export function stepOver(st: LabelState): LabelState {
  return { ...st, t: st.t + 1 };
}

export function overKicker(st: LabelState): string {
  return st.lives > 0 ? "Model shipped to the line" : "Too many bad labels";
}

/** The end screen has been up long enough for the attract bot to start a new batch. */
export function attractShouldRestart(st: LabelState): boolean {
  return st.phase === "over" && st.t > ATTRACT_RESTART_TICKS;
}

/** One-call helper for the whole bot: plays a tick, restarting after the end screen. */
export function stepBot(st: LabelState, rng: Rng): StepOut {
  if (st.phase === "over") {
    return { state: attractShouldRestart(st) ? createLabelRush() : stepOver(st), events: [] };
  }
  return stepLabelRush(st, botLabel(st, rng), rng);
}
