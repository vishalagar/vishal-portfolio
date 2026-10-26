import { describe, expect, it } from "vitest";
import { constant, seeded } from "../rng";
import {
  ATTRACT_RESTART_TICKS,
  attractShouldRestart,
  botLabel,
  createLabelRush,
  FINAL_VERSION,
  GATE,
  inGate,
  overKicker,
  stepBot,
  stepLabelRush,
  stepOver,
  type Chip,
  type LabelState,
} from "../labelrush";

const chip = (over: Partial<Chip> = {}): Chip => ({ id: 99, x: 65, crack: true, guess: true, conf: 0.8, done: false, result: null, ...over });
const withChips = (chips: Chip[], over: Partial<LabelState> = {}): LabelState => ({ ...createLabelRush(), spawn: 50, chips, ...over });

describe("labelrush engine", () => {
  it("scores a correct label and builds the streak", () => {
    const st = withChips([chip()], { streak: 2 });
    const out = stepLabelRush(st, "defect", constant(0.5));
    expect(out.state.score).toBe(100 + 2 * 10);
    expect(out.state.streak).toBe(3);
    expect(out.state.labels).toBe(1);
    expect(out.events).toContain("good");
    expect(out.state.chips[0].result).toBe("ok");
  });

  it("costs a life and the streak for a wrong label", () => {
    const out = stepLabelRush(withChips([chip({ crack: false })], { streak: 4 }), "defect", constant(0.5));
    expect(out.state.lives).toBe(2);
    expect(out.state.streak).toBe(0);
    expect(out.state.flash?.text).toBe("Mislabelled");
    expect(out.state.chips[0].result).toBe("wrong");
  });

  it("ignores a label with no chip in the scan zone", () => {
    const st = withChips([chip({ x: 10 })]);
    const out = stepLabelRush(st, "clean", constant(0.5));
    expect(out.state.lives).toBe(3);
    expect(out.state.labels).toBe(0);
  });

  it("does not mutate the previous state", () => {
    const st = withChips([chip()]);
    const snap = JSON.stringify(st);
    stepLabelRush(st, "defect", constant(0.5));
    expect(JSON.stringify(st)).toBe(snap);
  });

  it("retrains every 8 labels: new version, more accuracy, faster belt", () => {
    const st = withChips([chip()], { sinceRetrain: 7 });
    const out = stepLabelRush(st, "defect", constant(0.5));
    expect(out.events).toContain("retrain");
    expect(out.state.version).toBe(st.version + 1);
    expect(out.state.acc).toBeGreaterThan(st.acc);
    expect(out.state.speed).toBeGreaterThan(st.speed);
    expect(out.state.sinceRetrain).toBe(0);
    expect(out.state.flash?.text).toBe(`Retrained · v${st.version + 1}`);
  });

  it("lets the model guess when a chip leaves the gate unlabelled", () => {
    const right = stepLabelRush(withChips([chip({ x: GATE[1] - 0.1, guess: true })]), null, constant(0.5));
    expect(right.state.chips[0].result).toBe("auto");
    expect(right.state.score).toBe(40);

    const missed = stepLabelRush(withChips([chip({ x: GATE[1] - 0.1, guess: false })]), null, constant(0.5));
    expect(missed.state.chips[0].result).toBe("wrong");
    expect(missed.state.lives).toBe(2);
    expect(missed.state.flash?.text).toBe("Defect shipped");

    const falseAlarm = stepLabelRush(withChips([chip({ x: GATE[1] - 0.1, crack: false, guess: true })]), null, constant(0.5));
    expect(falseAlarm.state.score).toBe(-20);
    expect(falseAlarm.state.lives).toBe(3);
  });

  it("ends when lives run out", () => {
    const out = stepLabelRush(withChips([chip({ crack: false })], { lives: 1 }), "defect", constant(0.5));
    expect(out.state.phase).toBe("over");
    expect(out.events).toContain("over");
    expect(overKicker(out.state)).toBe("Too many bad labels");
  });

  it("ends when the model reaches the final version", () => {
    const st = withChips([chip()], { sinceRetrain: 7, version: FINAL_VERSION - 1 });
    const out = stepLabelRush(st, "defect", constant(0.5));
    expect(out.state.phase).toBe("over");
    expect(overKicker(out.state)).toBe("Model shipped to the line");
  });

  it("spawns chips, and removes them after they pass", () => {
    let st = createLabelRush();
    const rng = seeded(3);
    for (let i = 0; i < 40; i++) st = stepLabelRush(st, null, rng).state;
    expect(st.chips.length).toBeGreaterThan(0);
    expect(st.nextId).toBeGreaterThan(1);
    expect(st.chips.every((c) => c.x < 110)).toBe(true);
  });

  it("bot labels the first fresh chip past mid-gate", () => {
    expect(botLabel(withChips([chip({ x: GATE[0] + 1 })]), constant(0))).toBeNull();
    expect(botLabel(withChips([chip({ x: 70, crack: true })]), constant(0))).toBe("defect");
    expect(botLabel(withChips([chip({ x: 70, crack: true })]), constant(0.99))).toBe("clean");
    expect(inGate({ x: 70 })).toBe(true);
  });

  it("bot sims finish with a sane score, no NaN, and restart the attract", () => {
    let st = createLabelRush();
    const rng = seeded(11);
    let overSeen = false;
    for (let i = 0; i < 20000 && !(overSeen && st.phase === "run"); i++) {
      const out = stepBot(st, rng);
      if (out.events.includes("over")) overSeen = true;
      st = out.state;
      expect(Number.isFinite(st.score)).toBe(true);
    }
    expect(overSeen).toBe(true);
    expect(st.phase).toBe("run");
    expect(st.labels).toBe(0);
  });

  it("finishes a bot shift with a plausible score", () => {
    let st = createLabelRush();
    const rng = seeded(5);
    for (let i = 0; i < 20000 && st.phase === "run"; i++) st = stepBot(st, rng).state;
    expect(st.phase).toBe("over");
    expect(Number.isFinite(st.score)).toBe(true);
    expect(st.score).toBeGreaterThan(0);
    expect(st.score).toBeLessThan(20000);
  });

  it("is deterministic per seed", () => {
    const run = (seed: number) => {
      let st = createLabelRush();
      const rng = seeded(seed);
      for (let i = 0; i < 1500; i++) st = stepBot(st, rng).state;
      return JSON.stringify(st);
    };
    expect(run(7)).toBe(run(7));
    expect(run(7)).not.toBe(run(8));
  });

  it("times the attract restart off the end screen", () => {
    let st: LabelState = { ...createLabelRush(), phase: "over", t: 0 };
    st = stepOver(st);
    expect(st.t).toBe(1);
    expect(attractShouldRestart(st)).toBe(false);
    expect(attractShouldRestart({ ...st, t: ATTRACT_RESTART_TICKS + 1 })).toBe(true);
  });
});
