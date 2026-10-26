import { describe, expect, it } from "vitest";
import {
  createRetrain,
  injectDrift,
  RETRAIN_THRESHOLD,
  stageLabels,
  stepRetrain,
  type RetrainState,
} from "@/lib/engines/retrain";
import { constant, seeded } from "@/lib/engines/rng";

function run(st: RetrainState, n: number, rng = seeded(1)) {
  let s = st;
  const events: string[] = [];
  for (let i = 0; i < n; i++) {
    const out = stepRetrain(s, rng);
    s = out.state;
    events.push(...out.events);
  }
  return { s, events };
}

describe("retraining demo engine", () => {
  it("starts serving model v14 with 24 accuracy points above the threshold", () => {
    const s = createRetrain();
    expect(s.acc).toHaveLength(24);
    expect(s.phase).toBe("serving");
    expect(s.version).toBe(14);
    expect(s.acc.every((v) => v > RETRAIN_THRESHOLD)).toBe(true);
  });

  it("drifts down while serving until it breaches 0.88 and raises an alert", () => {
    let s = createRetrain();
    let ticks = 0;
    while (s.phase === "serving" && ticks < 200) {
      const out = stepRetrain(s, seeded(ticks));
      s = out.state;
      ticks++;
    }
    expect(s.phase).toBe("alert");
    expect(s.acc[s.acc.length - 1]).toBeLessThan(RETRAIN_THRESHOLD);
  });

  it("runs alert, four pipeline stages, then deploys the next version at 0.95", () => {
    const alert: RetrainState = { ...injectDrift(createRetrain()), phase: "alert", ticks: 0 };
    const { s, events } = run(alert, 5 + 4 * 5);
    expect(s.phase).toBe("deployed");
    expect(s.version).toBe(15);
    expect(s.acc[s.acc.length - 1]).toBe(0.95);
    expect(events).toContain("deploy");
    const back = run(s, 7).s;
    expect(back.phase).toBe("serving");
    expect(back.stage).toBe(-1);
  });

  it("counts Optuna trials up to 12 during tuning", () => {
    const tuning: RetrainState = { ...createRetrain(), phase: "pipeline", stage: 1, ticks: 0, trial: 0 };
    const { s } = run(tuning, 4);
    expect(s.trial).toBe(12);
    expect(stageLabels(s)[1]).toBe("Optuna tuning, trial 12/12");
  });

  it("injects drift only while serving", () => {
    const s = injectDrift(createRetrain());
    expect(s.acc[s.acc.length - 1]).toBe(0.865);
    const busy: RetrainState = { ...s, phase: "pipeline", stage: 0 };
    expect(injectDrift(busy)).toBe(busy);
  });

  it("alerts on the next tick after injected drift", () => {
    const out = stepRetrain(injectDrift(createRetrain()), constant(0.5));
    expect(out.state.phase).toBe("alert");
    expect(out.events).toContain("alert");
  });

  it("keeps accuracy between 0.80 and 0.99", () => {
    const { s } = run(createRetrain(), 500, seeded(99));
    expect(s.acc.every((v) => v >= 0.8 && v <= 0.99)).toBe(true);
  });
});
