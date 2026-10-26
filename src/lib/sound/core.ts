/**
 * AudioContext, master gain and the basic primitives. Nothing is created until a caller asks for audio(),
 * and callers only do that once sound is on.
 */
type Wave = OscillatorType;

/** Everything runs through `master`; looping beds and loops sit at `amb` of that. */
export const VOL = { master: 0.55, amb: 0.45 } as const;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = VOL.master;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** The master gain every sound feeds (null until audio() has built the context). */
export function masterOut(): GainNode | null {
  audio();
  return master;
}

/** Drop the context (tests only). */
export function resetAudioForTests(): void {
  ctx = null;
  master = null;
}

export function tone(type: Wave, f0: number, f1: number, dur: number, vol: number, delay = 0): void {
  const ac = audio();
  if (!ac || !master) return;
  const t = ac.currentTime + delay;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** A buffer of noise shaped by `shape(i, len, prev)`. */
export function noise(ac: AudioContext, seconds: number, shape: (i: number, len: number, prev: number) => number): AudioBuffer {
  const len = Math.max(1, Math.floor(ac.sampleRate * seconds));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    prev = shape(i, len, prev);
    d[i] = prev;
  }
  return buf;
}

export function playBuffer(buf: AudioBuffer, filter: BiquadFilterNode, gain: GainNode, ac: AudioContext): AudioBufferSourceNode {
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.connect(filter).connect(gain).connect(master ?? ac.destination);
  src.start();
  return src;
}
