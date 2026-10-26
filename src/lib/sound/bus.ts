/**
 * Shared mix bus (compressor, generated 2.4 s stereo reverb, filtered 0.23 s echo) and the voices built on it:
 * pluck, noise hit, engine, pad, crowd cheer, claps, footsteps, breath, FM bell. Used by Grand Prix, Running and AI.
 */
import { audio, masterOut } from "./core";

export interface SendOpts {
  pan?: number;
  verb?: number;
  echo?: number;
}
export interface PluckOpts extends SendOpts {
  type?: OscillatorType;
  f1?: number;
  vol?: number;
  attack?: number;
  lp?: number;
}
export interface HitOpts extends SendOpts {
  type?: BiquadFilterType;
  f0?: number;
  f1?: number;
  q?: number;
  vol?: number;
  attack?: number;
}
export interface EngineOpts {
  attack?: number;
  release?: number;
  bright?: number;
}
export interface Fx {
  ac: AudioContext;
  out: GainNode;
  verb: ConvolverNode;
  echo: DelayNode;
  white: AudioBuffer;
}

let fx: Fx | null = null;
let curve: Float32Array<ArrayBuffer> | null = null;

/** Time to schedule at: a hair ahead of now. */
export function now(): number {
  const ac = audio();
  return ac ? ac.currentTime + 0.01 : 0;
}

export function bus(): Fx | null {
  const ac = audio();
  const master = masterOut();
  if (!ac || !master) return null;
  if (fx && fx.ac === ac) return fx;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.ratio.value = 4;
  comp.connect(master);
  const out = ac.createGain();
  out.gain.value = 0.9;
  out.connect(comp);
  const verb = ac.createConvolver();
  const len = Math.floor(ac.sampleRate * 2.4);
  const ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  verb.buffer = ir;
  const verbOut = ac.createGain();
  verbOut.gain.value = 0.45;
  verb.connect(verbOut).connect(comp);
  const echo = ac.createDelay(1);
  echo.delayTime.value = 0.23;
  const fb = ac.createGain();
  fb.gain.value = 0.38;
  const dark = ac.createBiquadFilter();
  dark.type = "lowpass";
  dark.frequency.value = 3200;
  echo.connect(dark).connect(fb).connect(echo);
  const echoOut = ac.createGain();
  echoOut.gain.value = 0.55;
  dark.connect(echoOut).connect(comp);
  const white = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const wd = white.getChannelData(0);
  for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
  fx = { ac, out, verb, echo, white };
  return fx;
}

/** Route a node into the bus, optionally panned, with reverb and echo sends. */
export function send(node: AudioNode, o: SendOpts): void {
  const b = bus();
  if (!b) return;
  let tail: AudioNode = node;
  if (o.pan !== undefined && b.ac.createStereoPanner) {
    const pn = b.ac.createStereoPanner();
    pn.pan.value = o.pan;
    tail.connect(pn);
    tail = pn;
  }
  tail.connect(b.out);
  if (o.verb) {
    const g = b.ac.createGain();
    g.gain.value = o.verb;
    tail.connect(g).connect(b.verb);
  }
  if (o.echo) {
    const g = b.ac.createGain();
    g.gain.value = o.echo;
    tail.connect(g).connect(b.echo);
  }
}

function env(g: GainNode, t: number, attack: number, peak: number, dur: number): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

/** One oscillator note with a fast attack and exponential decay. */
export function pluck(t: number, freq: number, dur: number, o: PluckOpts = {}): void {
  const b = bus();
  if (!b) return;
  const ac = b.ac;
  const osc = ac.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
  const g = ac.createGain();
  env(g, t, o.attack ?? 0.005, o.vol ?? 0.05, dur);
  let node: AudioNode = osc;
  if (o.lp) {
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.lp;
    node.connect(f);
    node = f;
  }
  node.connect(g);
  send(g, o);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** A filtered noise burst. */
export function hit(t: number, dur: number, o: HitOpts = {}): void {
  const b = bus();
  if (!b) return;
  const ac = b.ac;
  const src = ac.createBufferSource();
  src.buffer = b.white;
  const f = ac.createBiquadFilter();
  f.type = o.type ?? "bandpass";
  f.frequency.setValueAtTime(o.f0 ?? 1000, t);
  if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
  f.Q.value = o.q ?? 0.8;
  const g = ac.createGain();
  env(g, t, o.attack ?? 0.002, o.vol ?? 0.1, dur);
  src.connect(f).connect(g);
  send(g, o);
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.05);
}

function driveCurve(): Float32Array<ArrayBuffer> {
  if (!curve) {
    const n = 1024;
    const c = new Float32Array(n);
    for (let i = 0; i < n; i++) c[i] = Math.tanh(3 * ((i / (n - 1)) * 2 - 1));
    curve = c;
  }
  return curve;
}

/**
 * A raspy high-revving race engine: two detuned saws, a saw an octave up and a square sub, through a tanh
 * waveshaper and a low-pass that follows the revs. pts = [[seconds, hz], ...]. Returns the output gain.
 */
export function engine(t: number, pts: ReadonlyArray<readonly [number, number]>, vol: number, o: EngineOpts = {}): { out: GainNode; end: number } | null {
  const b = bus();
  if (!b) return null;
  const ac = b.ac;
  const end = t + pts[pts.length - 1][0];
  const mix = ac.createGain();
  mix.gain.value = 0.4;
  const follow = (param: AudioParam, mul: number, cap = 20000) =>
    pts.forEach(([dt, hz], i) => {
      const v = Math.min(cap, hz * mul);
      if (i === 0) param.setValueAtTime(v, t + dt);
      else param.linearRampToValueAtTime(v, t + dt);
    });
  const voices: ReadonlyArray<readonly [OscillatorType, number]> = [["sawtooth", 1], ["sawtooth", 1.008], ["sawtooth", 2.003], ["square", 0.5]];
  voices.forEach(([type, mul]) => {
    const osc = ac.createOscillator();
    osc.type = type;
    follow(osc.frequency, mul);
    osc.connect(mix);
    osc.start(t);
    osc.stop(end + 0.1);
  });
  const shaper = ac.createWaveShaper();
  shaper.curve = driveCurve();
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 3;
  follow(lp.frequency, o.bright ?? 5, 9000);
  const g = ac.createGain();
  const attack = o.attack ?? 0.04;
  const release = o.release ?? 0.3;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.setValueAtTime(vol, Math.max(t + attack, end - release));
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  mix.connect(shaper).connect(lp).connect(g);
  return { out: g, end };
}

/** Detuned saw chord through a sweeping low-pass. */
export function pad(t: number, freqs: readonly number[], dur: number, vol: number, o: { sweep?: readonly [number, number, number]; attack?: number; verb?: number } = {}): void {
  const b = bus();
  if (!b) return;
  const ac = b.ac;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 2;
  const sw = o.sweep ?? [600, 600, 600];
  lp.frequency.setValueAtTime(sw[0], t);
  lp.frequency.exponentialRampToValueAtTime(sw[1], t + dur * 0.45);
  lp.frequency.exponentialRampToValueAtTime(sw[2], t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + (o.attack ?? 0.5));
  g.gain.setValueAtTime(vol, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  lp.connect(g);
  send(g, { verb: o.verb ?? 0.6 });
  freqs.forEach((fq) =>
    [-7, 7].forEach((cents) => {
      const osc = ac.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = fq;
      osc.detune.value = cents;
      osc.connect(lp);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }),
  );
}

/** A crowd "ahh": noise through three vowel-ish formants (480 / 1150 / 2600 Hz), each wobbling on its own. */
export function cheer(t: number, dur: number, vol: number): void {
  const b = bus();
  if (!b) return;
  const ac = b.ac;
  const formants: ReadonlyArray<readonly [number, number, number]> = [[480, 1.1, 1], [1150, 1.4, 0.7], [2600, 1.8, 0.35]];
  formants.forEach(([fq, q, share]) => {
    const src = ac.createBufferSource();
    src.buffer = b.white;
    src.loop = true;
    const f = ac.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = fq;
    f.Q.value = q;
    const wob = ac.createOscillator();
    const wg = ac.createGain();
    wob.frequency.value = 3 + Math.random() * 4;
    wg.gain.value = fq * 0.06;
    wob.connect(wg).connect(f.frequency);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * share, t + 0.35);
    g.gain.setValueAtTime(vol * share, t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g);
    send(g, { verb: 0.35 });
    src.start(t, Math.random());
    wob.start(t);
    src.stop(t + dur + 0.05);
    wob.stop(t + dur + 0.05);
  });
}

export function claps(t: number, dur: number, n: number, vol = 0.08): void {
  for (let i = 0; i < n; i++) {
    hit(t + Math.random() * dur, 0.03 + Math.random() * 0.02, { type: "bandpass", f0: 1000 + Math.random() * 1000, q: 0.9, vol: vol * (0.5 + Math.random() * 0.5), verb: 0.25, pan: Math.random() * 1.4 - 0.7 });
  }
}

export function footstep(t: number, side: number, level = 1): void {
  hit(t, 0.07, { type: "bandpass", f0: 1100, f1: 380, q: 0.9, vol: 0.1 * level, pan: side * 0.15 });
  pluck(t, 80, 0.08, { f1: 40, vol: 0.14 * level });
}

export function breath(t: number, inhale: boolean, level = 1): void {
  hit(t, inhale ? 0.38 : 0.5, { type: "bandpass", f0: inhale ? 1800 : 1100, q: 0.6, vol: 0.022 * level, attack: inhale ? 0.14 : 0.06 });
}

/** FM bell: modulator at 3.5x the carrier, its depth dying away. */
export function bell(t: number, freq: number, dur: number, vol: number, o: SendOpts = { echo: 0.45, verb: 0.35 }): void {
  const b = bus();
  if (!b) return;
  const ac = b.ac;
  const car = ac.createOscillator();
  const mod = ac.createOscillator();
  const depth = ac.createGain();
  car.frequency.value = freq;
  mod.frequency.value = freq * 3.5;
  depth.gain.setValueAtTime(freq * 1.2, t);
  depth.gain.exponentialRampToValueAtTime(1, t + dur);
  mod.connect(depth).connect(car.frequency);
  const g = ac.createGain();
  env(g, t, 0.004, vol, dur);
  car.connect(g);
  send(g, o);
  car.start(t);
  mod.start(t);
  car.stop(t + dur + 0.05);
  mod.stop(t + dur + 0.05);
}

export function resetBusForTests(): void {
  fx = null;
}
