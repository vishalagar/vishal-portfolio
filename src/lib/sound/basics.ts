/** Football's sounds (kept exactly as the first mock) plus the one-shots every world shares. */
import { audio, masterOut, noise, playBuffer, tone } from "./core";

export function whistleNow(): void {
  const ac = audio();
  const out = masterOut();
  if (!ac || !out) return;
  for (const [d, len] of [[0, 0.16], [0.24, 0.5]] as const) {
    const t = ac.currentTime + d;
    const o = ac.createOscillator();
    const lfo = ac.createOscillator();
    const lg = ac.createGain();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.value = 2800;
    lfo.frequency.value = 30;
    lg.gain.value = 160;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
    g.gain.setValueAtTime(0.09, t + len - 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(out);
    o.start(t);
    lfo.start(t);
    o.stop(t + len + 0.02);
    lfo.stop(t + len + 0.02);
  }
}

export const thudNow = (delay = 0): void => {
  tone("sine", 140, 45, 0.18, 0.35, delay);
  tone("triangle", 900, 300, 0.05, 0.05, delay);
};

/** Shirt flip / costume whoosh: band-pass noise sweeping 450 to 2600 Hz over 0.35 s. */
export function whooshNow(): void {
  const ac = audio();
  if (!ac) return;
  const buf = noise(ac, 0.4, (i, len) => (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len));
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(450, ac.currentTime);
  bp.frequency.exponentialRampToValueAtTime(2600, ac.currentTime + 0.35);
  const g = ac.createGain();
  g.gain.value = 0.25;
  playBuffer(buf, bp, g, ac);
}

export function roarNow(): void {
  const ac = audio();
  if (!ac) return;
  const buf = noise(ac, 1.6, (_i, _len, last) => ((last / 4 + 0.05 * (Math.random() * 2 - 1)) / 1.05) * 4);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 650;
  bp.Q.value = 0.5;
  const g = ac.createGain();
  const t = ac.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  playBuffer(buf, bp, g, ac);
}

/** Theme switch: three clunks and a rising hum going to night; falling hum and a clunk going to day. */
export function lightsNow(night: boolean): void {
  if (night) {
    thudNow(0);
    thudNow(0.16);
    thudNow(0.5);
    tone("sawtooth", 70, 120, 0.9, 0.025, 0.5);
  } else {
    tone("sawtooth", 120, 40, 0.6, 0.03);
    thudNow(0.3);
  }
}

export function shredNow(): void {
  const ac = audio();
  if (!ac) return;
  const buf = noise(ac, 0.9, (i) => (Math.random() * 2 - 1) * (0.5 + 0.5 * Math.sin(i / 260)));
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.08, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.9);
  playBuffer(buf, hp, g, ac);
}
