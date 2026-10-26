// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WORLD_IDS, type WorldId } from "@/content/worlds";

const badValues: string[] = [];
let created = 0;
const check = (name: string, args: unknown[]) =>
  args.forEach((a) => {
    if (typeof a === "number" && !Number.isFinite(a)) badValues.push(`${name}(${String(a)})`);
  });

function param(): unknown {
  const p: Record<string, unknown> = { value: 0 };
  return new Proxy(p, {
    get: (o, k) => (k === "value" ? o.value : (...a: unknown[]) => check(String(k), a)),
    set: (o, k, v) => {
      check(String(k), [v]);
      o[k as string] = v;
      return true;
    },
  });
}
const PARAMS = ["frequency", "gain", "Q", "detune", "pan", "delayTime", "threshold", "ratio"];
function node(): unknown {
  const o: Record<string, unknown> = {};
  return new Proxy(o, {
    get(t, k) {
      if (k in t) return t[k as string];
      if (PARAMS.includes(String(k))) return (t[k as string] = param());
      if (k === "connect") return (x: unknown) => x;
      return (...a: unknown[]) => check(String(k), a);
    },
    set(t, k, v) {
      check(String(k), [v]);
      t[k as string] = v;
      return true;
    },
  });
}
class FakeAC {
  sampleRate = 8000;
  currentTime = 1;
  state = "running";
  destination = node();
  static all: FakeAC[] = [];
  constructor() {
    FakeAC.all.push(this);
  }
  createBuffer(ch: number, len: number) {
    const d = Array.from({ length: ch }, () => new Float32Array(len));
    return { getChannelData: (i: number) => d[i], length: len };
  }
  resume() {}
}
for (const m of ["createOscillator", "createGain", "createBiquadFilter", "createBufferSource", "createConvolver", "createDelay", "createDynamicsCompressor", "createWaveShaper", "createStereoPanner"]) {
  (FakeAC.prototype as unknown as Record<string, () => unknown>)[m] = () => {
    created++;
    return node();
  };
}

async function load() {
  vi.resetModules();
  return import("../index");
}

beforeEach(() => {
  vi.useFakeTimers();
  badValues.length = 0;
  created = 0;
  FakeAC.all = [];
  (window as unknown as { AudioContext: unknown }).AudioContext = FakeAC;
});
afterEach(() => {
  vi.useRealTimers();
});

describe("sound gating", () => {
  it("creates no AudioContext and plays nothing while muted", async () => {
    const s = await load();
    s.sfx.signature();
    s.sfx.blip();
    s.sfx.prop();
    s.sfx.gear(true);
    s.sfx.lights(true);
    s.sfx.whistle();
    s.sfx.match("goal");
    s.setSoundWorld("gp");
    expect(FakeAC.all).toHaveLength(0);
    expect(created).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("creates the context on first turn-on and notifies subscribers", async () => {
    const s = await load();
    const fn = vi.fn();
    s.subscribeSound(fn);
    s.setSoundOn(true);
    expect(s.isSoundOn()).toBe(true);
    expect(FakeAC.all).toHaveLength(1);
    expect(fn).toHaveBeenCalledTimes(1);
    s.setSoundOn(true);
    expect(fn).toHaveBeenCalledTimes(1);
    s.setSoundOn(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe.each(WORLD_IDS as readonly WorldId[])("world %s", (id) => {
  it("signature, blip, prop, gear and ambient run, make nodes and stay finite", async () => {
    const s = await load();
    s.setSoundWorld(id);
    s.setSoundOn(true);
    expect(s.soundWorld()).toBe(id);
    const before = created;
    s.sfx.signature();
    s.sfx.blip();
    s.sfx.prop();
    s.sfx.gear(true);
    s.sfx.gear(false);
    expect(created).toBeGreaterThan(before);
    vi.advanceTimersByTime(40_000);
    s.setSoundOn(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(badValues).toEqual([]);
  });
});

describe("gear", () => {
  it("is a no-op in football", async () => {
    const s = await load();
    s.setSoundOn(true);
    const before = created;
    s.sfx.gear(true);
    expect(created).toBe(before);
  });
});

describe("ambient", () => {
  it("swapping world clears the old timers and starts the new ones", async () => {
    const s = await load();
    s.setSoundWorld("run");
    s.setSoundOn(true);
    const runTimers = vi.getTimerCount();
    expect(runTimers).toBeGreaterThan(0);
    s.setSoundWorld("gaming");
    expect(vi.getTimerCount()).toBe(1);
    s.setSoundWorld("football");
    expect(vi.getTimerCount()).toBe(0);
    s.setSoundWorld("gp");
    expect(vi.getTimerCount()).toBe(1);
    s.setSoundOn(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not pile up timers over a long run", async () => {
    const s = await load();
    s.setSoundWorld("run");
    s.setSoundOn(true);
    vi.advanceTimersByTime(120_000);
    expect(vi.getTimerCount()).toBeLessThanOrEqual(3);
    s.setSoundOn(false);
  });

  it("pauses when the tab is hidden and resumes on return", async () => {
    const s = await load();
    s.setSoundWorld("gaming");
    s.setSoundOn(true);
    expect(vi.getTimerCount()).toBe(1);
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(vi.getTimerCount()).toBe(0);
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(vi.getTimerCount()).toBe(1);
    s.setSoundOn(false);
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(vi.getTimerCount()).toBe(0);
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
  });
});

describe("shared sfx", () => {
  it("every gated one-shot runs while on without bad values", async () => {
    const s = await load();
    s.setSoundOn(true);
    s.sfx.whoosh();
    s.sfx.spotlight(2);
    s.sfx.psShred();
    s.sfx.psEncrypt();
    s.sfx.psLink();
    s.sfx.psPrint();
    s.sfx.retrainAlert();
    s.sfx.retrainDeploy();
    s.sfx.retrainInject();
    s.sfx.genDone();
    s.sfx.genClick();
    s.sfx.snakeStart();
    s.sfx.snakeEat();
    s.sfx.snakeOver();
    for (const e of ["kick", "pass", "tackle", "save", "goal", "whistle", "start", "end"] as const) s.sfx.match(e);
    s.sfx.thud();
    s.sfx.lights(true);
    s.sfx.lights(false);
    expect(badValues).toEqual([]);
    s.setSoundOn(false);
  });

  it("master gain is 0.55", async () => {
    const s = await load();
    s.setSoundOn(true);
    const { VOL } = await import("../core");
    expect(VOL).toEqual({ master: 0.55, amb: 0.45 });
  });
});
