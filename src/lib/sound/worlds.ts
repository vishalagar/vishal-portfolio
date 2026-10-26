/** Per-world opening sound, button blip, prop sound and gear off/on (worlds-spec section 5). */
import type { WorldId } from "@/content/worlds";
import { bell, bus, claps, cheer, engine, hit, now, pad, pluck, send } from "./bus";
import { thudNow, whistleNow, whooshNow } from "./basics";
import { tone } from "./core";

function notes(type: OscillatorType, freqs: readonly number[], step: number, len: number, vol: number): void {
  freqs.forEach((fq, i) => tone(type, fq, fq, len, vol, i * step));
}

function gpSignature(t: number): void {
  // engine blips on the grid, five red lights, lights out, launch through the gears
  const idle = engine(t, [[0, 120], [0.25, 230], [0.45, 130], [1.1, 135], [1.25, 260], [1.45, 140], [2.2, 130]], 0.045, { release: 0.2, bright: 4 });
  if (idle) send(idle.out, { verb: 0.2 });
  for (let i = 0; i < 5; i++) {
    pluck(t + i * 0.36, 880, 0.14, { vol: 0.05, verb: 0.3 });
    hit(t + i * 0.36, 0.05, { type: "lowpass", f0: 500, vol: 0.18 });
  }
  const go = t + 5 * 0.36 + 0.4;
  hit(go, 0.3, { type: "bandpass", f0: 3300, q: 7, vol: 0.06, verb: 0.2 });
  const run = engine(go, [[0, 170], [0.07, 260], [0.5, 590], [0.55, 410], [0.95, 640], [1.0, 450], [1.45, 680], [2.1, 650]], 0.11, { release: 0.7 });
  const b = bus();
  if (!run || !b) return;
  if (b.ac.createStereoPanner) {
    const pn = b.ac.createStereoPanner();
    pn.pan.setValueAtTime(0, go);
    pn.pan.linearRampToValueAtTime(0.8, run.end);
    run.out.connect(pn);
    send(pn, { verb: 0.3 });
  } else send(run.out, { verb: 0.3 });
}

function runSignature(t: number): void {
  // starting pistol: crack, body, an echo off the buildings, then the crowd goes
  hit(t, 0.09, { type: "highpass", f0: 900, vol: 0.55, verb: 0.7 });
  hit(t, 0.3, { type: "lowpass", f0: 2600, f1: 280, vol: 0.3, verb: 0.5 });
  pluck(t, 150, 0.2, { f1: 42, vol: 0.32 });
  hit(t + 0.34, 0.14, { type: "bandpass", f0: 1300, vol: 0.07, verb: 0.6 });
  cheer(t + 0.25, 2.4, 0.16);
  claps(t + 0.45, 2, 28, 0.1);
}

function aiSignature(t: number): void {
  // boot: a wide chord opening up, a rising arpeggio with echoes, one high shimmer
  pad(t, [110, 164.81, 220, 277.18, 329.63, 493.88], 3, 0.02, { sweep: [280, 3400, 1100], attack: 0.6 });
  [659.25, 880, 987.77, 1108.73, 1318.51].forEach((fq, i) => pluck(t + 0.35 + i * 0.09, fq, 0.4, { type: "triangle", vol: 0.04, echo: 0.45, verb: 0.3, pan: i % 2 ? 0.4 : -0.4 }));
  bell(t + 0.95, 1760, 1.4, 0.03);
}

/** The world's opening sound. */
export function signatureNow(world: WorldId): void {
  const t = now();
  if (world === "gp") gpSignature(t);
  else if (world === "gaming") {
    notes("square", [523, 659, 784, 1047], 0.09, 0.08, 0.035);
    tone("square", 1047, 1047, 0.28, 0.035, 0.36);
  } else if (world === "run") runSignature(t);
  else if (world === "ai") aiSignature(t);
  else whistleNow();
}

/** The world's button blip. */
export function blipNow(world: WorldId): void {
  const t = now();
  if (world === "gp") {
    hit(t, 0.07, { type: "bandpass", f0: 1900, q: 1.4, vol: 0.3 });
    pluck(t + 0.02, 1320, 0.07, { type: "square", vol: 0.06, lp: 2400 });
  } else if (world === "gaming") tone("square", 988, 1319, 0.06, 0.035, 0);
  else if (world === "run") pluck(t, 3400, 0.06, { type: "square", vol: 0.08, lp: 5000 });
  else if (world === "ai") pluck(t, 1318.5, 0.22, { type: "triangle", vol: 0.12, echo: 0.35, verb: 0.2 });
  else tone("square", 660, 990, 0.07, 0.04, 0);
}

/** The hero prop (ball / tyre / coin / bottle / cube). */
export function propNow(world: WorldId): void {
  const t = now();
  if (world === "gp") {
    // tyre: rubber thump, then a squeal with a little wobble
    pluck(t, 120, 0.15, { f1: 50, vol: 0.3 });
    hit(t + 0.03, 0.5, { type: "bandpass", f0: 2700, f1: 2300, q: 9, vol: 0.16, verb: 0.25 });
    pluck(t + 0.03, 1900, 0.45, { type: "sawtooth", f1: 1500, vol: 0.03, lp: 3000, verb: 0.2 });
  } else if (world === "gaming") {
    tone("square", 988, 988, 0.08, 0.04, 0);
    tone("square", 1319, 1319, 0.3, 0.04, 0.08);
  } else if (world === "run") {
    // squeeze the bottle, bubbles, a gulp
    hit(t, 0.2, { type: "lowpass", f0: 1400, f1: 400, vol: 0.12 });
    for (let i = 0; i < 4; i++) {
      const fq = 500 + Math.random() * 600;
      pluck(t + 0.06 + i * 0.06, fq, 0.05, { f1: fq * 1.7, vol: 0.05 });
    }
    pluck(t + 0.38, 270, 0.12, { f1: 130, vol: 0.13 });
  } else if (world === "ai") bell(t, 1046.5, 0.9, 0.15);
  else thudNow();
}

/** Costume coming off (off = true) or going back on. Football has none. */
export function gearNow(world: WorldId, off: boolean): void {
  if (world === "football") return;
  const t = now();
  whooshNow();
  if (world === "gaming") tone("sine", off ? 500 : 900, off ? 900 : 500, 0.08, 0.1, 0);
  else if (world === "gp") {
    // visor clack and the chin strap
    hit(t, 0.04, { type: "lowpass", f0: 1500, vol: 0.3 });
    hit(t + 0.06, 0.22, { type: "highpass", f0: 1800, vol: 0.06 });
    hit(t + 0.12, 0.18, { type: "highpass", f0: 2200, vol: 0.05 });
  } else if (world === "run") {
    // elastic stretch, then snap
    pluck(t, off ? 220 : 520, 0.22, { type: "triangle", f1: off ? 520 : 220, vol: 0.05 });
    hit(t + 0.22, 0.03, { type: "highpass", f0: 2600, vol: 0.1 });
    pluck(t + 0.22, 700, 0.08, { f1: 180, vol: 0.1 });
  } else if (world === "ai") {
    // power down (or up) with a few glitchy blips
    pluck(t, off ? 880 : 55, 0.6, { type: "sawtooth", f1: off ? 55 : 880, vol: 0.035, lp: off ? 1800 : 2600, verb: 0.3 });
    [1600, 1200, 800].forEach((fq, i) => pluck(t + 0.05 + i * 0.07, off ? fq : 2400 - fq, 0.03, { type: "square", vol: 0.015 }));
    if (!off) bell(t + 0.55, 1318.5, 0.8, 0.03);
  }
}
