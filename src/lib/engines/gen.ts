export const GEN_TICK_MS = 90;
export const GEN_STEPS = 20;
export const GEN_SIZE = 16;
const HOLD_TICKS = 22;

export type Rgb = readonly [number, number, number];
export type GenEvent = "done";

const PALETTE: Record<string, Rgb> = {
  B: [29, 38, 48],
  D: [20, 26, 33],
  t: [227, 231, 236],
  T: [196, 202, 210],
  s: [142, 149, 159],
  L: [210, 164, 115],
  C: [184, 135, 90],
  c: [148, 102, 64],
  K: [43, 26, 16],
};

/** A 16×16 MLCC chip capacitor with a diagonal crack (K). */
const CRACK = [
  "BBBBBBBBBBBBBBBB",
  "BBBBBBBBBBBBBBBB",
  "BBBBBBBBBBBBBBBB",
  "BBBBBBBBBBBBBBBB",
  "BtttLLLLLLLLtttB",
  "BTTTCCCCCCCKTTTB",
  "BTTTCCCCCCKCTTTB",
  "BTTTCCCCCKKCTTTB",
  "BTTTCCCCKCCCTTTB",
  "BTTTCCCKKCCCTTTB",
  "BTTTccKcccccTTTB",
  "BsssccccccccsssB",
  "BDDDDDDDDDDDDDDB",
  "BBBBBBBBBBBBBBBB",
  "BBBBBBBBBBBBBBBB",
  "BBBBBBBBBBBBBBBB",
];
const CLEAN = CRACK.map((row, y) => row.replace(/K/g, y >= 10 ? "c" : "C"));

export const GEN_TARGETS = [
  { rows: CRACK, title: "MLCC chip · crack", label: "a ceramic chip capacitor with a diagonal crack" },
  { rows: CLEAN, title: "MLCC chip · clean", label: "a clean ceramic chip capacitor" },
] as const;

export interface GenState {
  /** Denoising steps left: GEN_STEPS is pure noise, 0 is the finished image. */
  t: number;
  seed: number;
  cls: number;
  hold: number;
}

export function createGen(): GenState {
  return { t: GEN_STEPS, seed: 1, cls: 0, hold: 0 };
}

export function nextSample(st: GenState): GenState {
  return { t: GEN_STEPS, seed: st.seed + 1, cls: (st.cls + 1) % GEN_TARGETS.length, hold: 0 };
}

export function stepGen(st: GenState): { state: GenState; events: GenEvent[] } {
  if (st.t > 0) return { state: { ...st, t: st.t - 1 }, events: st.t === 1 ? ["done"] : [] };
  if (st.hold >= HOLD_TICKS) return { state: nextSample(st), events: [] };
  return { state: { ...st, hold: st.hold + 1 }, events: [] };
}

/** Deterministic hash noise in [0, 1). */
export function hashNoise(n: number): number {
  let h = Math.imul(n ^ (n >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Each cell blends from hashed noise to its target colour with weight w = (t/T)^1.3. */
export function genPixels(st: GenState): Rgb[] {
  const target = GEN_TARGETS[st.cls];
  const w = Math.pow(st.t / GEN_STEPS, 1.3);
  const out: Rgb[] = [];
  for (let y = 0; y < GEN_SIZE; y++) {
    for (let x = 0; x < GEN_SIZE; x++) {
      const base = PALETTE[target.rows[y][x]];
      const k = st.seed * 100003 + st.t * 7919 + (y * GEN_SIZE + x) * 131;
      const noise = [hashNoise(k) * 255, hashNoise(k + 1) * 255, hashNoise(k + 2) * 255];
      out.push([0, 1, 2].map((j) => Math.round(base[j] * (1 - w) + noise[j] * w)) as unknown as Rgb);
    }
  }
  return out;
}

export function targetPixel(cls: number, x: number, y: number): Rgb {
  return PALETTE[GEN_TARGETS[cls].rows[y][x]];
}
