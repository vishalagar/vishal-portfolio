import type { Rng } from "./rng";

export const RETRAIN_TICK_MS = 260;
export const RETRAIN_THRESHOLD = 0.88;
const POINTS = 24;
const ALERT_TICKS = 4;
const STAGE_TICKS = 4;
const DEPLOYED_TICKS = 6;

export type RetrainPhase = "serving" | "alert" | "pipeline" | "deployed";
export type RetrainEvent = "alert" | "deploy";

export interface RetrainState {
  acc: number[];
  phase: RetrainPhase;
  /** Pipeline stage 0–3, 4 once deployed, -1 while serving. */
  stage: number;
  ticks: number;
  version: number;
  trial: number;
}

export function createRetrain(): RetrainState {
  const acc = Array.from({ length: POINTS }, (_, i) => 0.95 - i * 0.0012 + 0.004 * Math.sin(i * 1.7));
  return { acc, phase: "serving", stage: -1, ticks: 0, version: 14, trial: 0 };
}

function push(acc: number[], v: number): number[] {
  return [...acc.slice(1), Math.max(0.8, Math.min(0.99, v))];
}

export function stepRetrain(st: RetrainState, rng: Rng): { state: RetrainState; events: RetrainEvent[] } {
  const last = st.acc[st.acc.length - 1];
  switch (st.phase) {
    case "serving": {
      const next = last - (0.002 + rng() * 0.004) + (rng() - 0.5) * 0.004;
      if (next < RETRAIN_THRESHOLD) {
        return { state: { ...st, acc: push(st.acc, next), phase: "alert", ticks: 0 }, events: ["alert"] };
      }
      return { state: { ...st, acc: push(st.acc, next) }, events: [] };
    }
    case "alert": {
      if (st.ticks >= ALERT_TICKS) {
        return { state: { ...st, phase: "pipeline", stage: 0, ticks: 0, acc: push(st.acc, last) }, events: [] };
      }
      return { state: { ...st, ticks: st.ticks + 1, acc: push(st.acc, last) }, events: [] };
    }
    case "pipeline": {
      const trial = st.stage === 1 ? Math.min(12, st.trial + 3) : st.trial;
      if (st.ticks < STAGE_TICKS) {
        return { state: { ...st, ticks: st.ticks + 1, trial, acc: push(st.acc, last) }, events: [] };
      }
      if (st.stage >= 3) {
        const state = { ...st, phase: "deployed" as const, stage: 4, ticks: 0, trial: 0, version: st.version + 1, acc: push(st.acc, 0.95) };
        return { state, events: ["deploy"] };
      }
      return { state: { ...st, stage: st.stage + 1, ticks: 0, trial, acc: push(st.acc, last) }, events: [] };
    }
    case "deployed": {
      const next = last + (rng() - 0.5) * 0.004;
      if (st.ticks >= DEPLOYED_TICKS) {
        return { state: { ...st, phase: "serving", stage: -1, ticks: 0, acc: push(st.acc, next) }, events: [] };
      }
      return { state: { ...st, ticks: st.ticks + 1, acc: push(st.acc, next) }, events: [] };
    }
  }
}

/** "Inject drift": force an immediate drop below the threshold. Only while serving. */
export function injectDrift(st: RetrainState): RetrainState {
  if (st.phase !== "serving") return st;
  return { ...st, acc: push(st.acc, 0.865) };
}

export function stageLabels(st: RetrainState): string[] {
  return [
    "Data checks: duplicates and labels",
    `Optuna tuning, trial ${Math.max(1, st.trial)}/12`,
    "Retrain on a free GPU",
    `Validate and register v${st.version + 1}`,
  ];
}
