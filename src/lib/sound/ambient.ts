/**
 * Looping background per world: crowd (football), cars passing (GP), chiptune bass (gaming),
 * crowd + footsteps + breathing (running), synth pad + plucks (AI).
 * Every node and timer is tracked so stopAmbient() leaves nothing running.
 */
import type { WorldId } from "@/content/worlds";
import { bus, cheer, claps, breath, engine, footstep, now, pluck, send } from "./bus";
import { audio, masterOut, tone, VOL } from "./core";

interface Ambient {
  nodes: Array<{ stop: () => void }>;
  cancels: Array<() => void>;
  stopped: boolean;
}

let current: Ambient | null = null;
const A = VOL.amb;

/** Looping brown-noise bed, band-passed, with a slow LFO on the gain. */
function bed(freq: number, q: number, vol: number, lfoRate: number, lfoDepth: number): Array<{ stop: () => void }> {
  const ac = audio();
  const out = masterOut();
  if (!ac || !out) return [];
  const len = Math.floor(ac.sampleRate * 3);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = ac.createGain();
  g.gain.value = vol;
  const lfo = ac.createOscillator();
  const lg = ac.createGain();
  lfo.frequency.value = lfoRate;
  lg.gain.value = lfoDepth;
  lfo.connect(lg).connect(g.gain);
  src.connect(bp).connect(g).connect(out);
  src.start();
  lfo.start();
  return [src, lfo];
}

/**
 * One car flying past: pitch drops through the doppler shift as it pans across and the filter opens.
 * Kept low, dark and quiet so it stays easy to listen to for minutes on end.
 */
function carPass(level: number): void {
  const b = bus();
  if (!b) return;
  const ac = b.ac;
  const t = now();
  const dir = Math.random() < 0.5 ? -1 : 1;
  const base = 240 + Math.random() * 80;
  const e = engine(t, [[0, base * 1.16], [1.0, base * 1.2], [1.22, base * 0.85], [2.7, base * 0.8]], 0.035 * level, { attack: 1.0, release: 1.4, bright: 2.5 });
  if (!e) return;
  const near = ac.createBiquadFilter();
  near.type = "lowpass";
  near.frequency.setValueAtTime(500, t);
  near.frequency.exponentialRampToValueAtTime(2200, t + 1.1);
  near.frequency.exponentialRampToValueAtTime(600, t + 2.7);
  e.out.connect(near);
  if (ac.createStereoPanner) {
    const pn = ac.createStereoPanner();
    pn.pan.setValueAtTime(-0.9 * dir, t);
    pn.pan.linearRampToValueAtTime(0.9 * dir, t + 2.7);
    near.connect(pn);
    send(pn, { verb: 0.3 });
  } else send(near, { verb: 0.3 });
}

function aiPad(ac: AudioContext, amb: Ambient): void {
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 520;
  lp.Q.value = 2;
  const sweep = ac.createOscillator();
  const sg = ac.createGain();
  sweep.frequency.value = 0.05;
  sg.gain.value = 300;
  sweep.connect(sg).connect(lp.frequency);
  const g = ac.createGain();
  g.gain.value = 0.014 * A;
  lp.connect(g);
  send(g, { verb: 0.7 });
  [55, 82.41, 110, 138.59, 164.81].forEach((fq) =>
    [-8, 8].forEach((cents) => {
      const o = ac.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = fq;
      o.detune.value = cents;
      o.connect(lp);
      o.start();
      amb.nodes.push(o);
    }),
  );
  sweep.start();
  amb.nodes.push(sweep);
}

export function stopAmbient(): void {
  const amb = current;
  if (!amb) return;
  current = null;
  amb.stopped = true;
  amb.cancels.forEach((c) => c());
  amb.nodes.forEach((n) => {
    try {
      n.stop();
    } catch {
      // already stopped
    }
  });
}

export function ambientRunning(): boolean {
  return current !== null;
}

export function startAmbient(world: WorldId): void {
  stopAmbient();
  const b = bus();
  if (!b) return;
  const amb: Ambient = { nodes: [], cancels: [], stopped: false };
  current = amb;
  const every = (ms: number, fn: () => void) => {
    const id = setInterval(() => !amb.stopped && fn(), ms);
    amb.cancels.push(() => clearInterval(id));
  };
  // one pending timeout at a time, so nothing piles up
  const randomly = (min: number, max: number, fn: () => void) => {
    let id: ReturnType<typeof setTimeout> | undefined;
    const go = () => {
      if (amb.stopped) return;
      fn();
      id = setTimeout(go, min + Math.random() * (max - min));
    };
    id = setTimeout(go, Math.random() * min);
    amb.cancels.push(() => clearTimeout(id));
  };
  if (world === "gp") {
    amb.nodes.push(...bed(260, 0.6, 0.014 * A, 0.09, 0.006 * A));
    randomly(9000, 16000, () => carPass(A));
  } else if (world === "gaming") {
    const bass = [110, 110, 165, 110, 147, 110, 196, 165];
    let i = 0;
    every(230, () => {
      tone("square", bass[i % 8], bass[i % 8], 0.16, 0.018 * A, 0);
      i += 1;
    });
  } else if (world === "run") {
    amb.nodes.push(...bed(700, 0.5, 0.018 * A, 0.11, 0.008 * A));
    amb.nodes.push(...bed(1700, 0.8, 0.006 * A, 0.17, 0.003 * A));
    let step = 0;
    every(353, () => {
      const t = now();
      footstep(t, step % 2 ? 1 : -1, A);
      if (step % 4 === 0) breath(t, true, A);
      if (step % 4 === 2) breath(t, false, A);
      step += 1;
    });
    randomly(6000, 10000, () => {
      const t = now();
      cheer(t, 2.6, 0.09 * A);
      claps(t + 0.2, 2.2, 18, 0.07 * A);
    });
  } else if (world === "ai") {
    aiPad(b.ac, amb);
    const scale = [880, 987.77, 1108.73, 1318.51, 1479.98, 1760];
    randomly(1400, 3200, () => pluck(now(), scale[Math.floor(Math.random() * scale.length)], 0.3, { type: "triangle", vol: 0.018 * A, echo: 0.6, verb: 0.4, pan: Math.random() * 1.6 - 0.8 }));
  } else {
    amb.nodes.push(...bed(480, 0.6, 0.05 * A, 0.15, 0.02 * A));
  }
}
