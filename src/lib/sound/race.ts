/**
 * Grand Prix sounds, synthesised with the primitives from @/lib/sound.
 * Everything is gated: nothing plays (and no engine node is created) while sound is muted.
 */
import { audio, gated, masterOut, noise, playBuffer, tone } from "@/lib/sound";

interface Engine {
  osc: OscillatorNode;
  sub: OscillatorNode;
  gain: GainNode;
}

let engine: Engine | null = null;
let watchdog: ReturnType<typeof setTimeout> | null = null;
/** If no update arrives for this long (muted, paused, off screen) the engine is shut down. */
const ENGINE_IDLE_MS = 200;

function stopEngineNow(): void {
  if (watchdog) clearTimeout(watchdog);
  watchdog = null;
  if (!engine) return;
  const { osc, sub, gain } = engine;
  engine = null;
  try {
    gain.gain.value = 0;
    osc.stop();
    sub.stop();
  } catch {
    // already stopped
  }
}

function startEngine(): Engine | null {
  const ac = audio();
  if (!ac) return null;
  const osc = ac.createOscillator();
  const sub = ac.createOscillator();
  const lp = ac.createBiquadFilter();
  const gain = ac.createGain();
  osc.type = "sawtooth";
  sub.type = "square";
  osc.frequency.value = 80;
  sub.frequency.value = 40;
  lp.type = "lowpass";
  lp.frequency.value = 900;
  gain.gain.value = 0.0001;
  osc.connect(lp);
  sub.connect(lp);
  lp.connect(gain).connect(masterOut() ?? ac.destination);
  osc.start();
  sub.start();
  return (engine = { osc, sub, gain });
}

/** Keep the engine whine in step with speed (0..1.3). Call every tick; it shuts itself down when ticks stop or sound is muted. */
const engineWhine = gated((speed: number, boosting: boolean): void => {
  if (watchdog) clearTimeout(watchdog);
  watchdog = setTimeout(stopEngineNow, ENGINE_IDLE_MS);
  const e = engine ?? startEngine();
  const ac = audio();
  if (!e || !ac) return;
  const s = Number.isFinite(speed) ? Math.max(0, speed) : 0;
  const f = 70 + s * 190 + (boosting ? 40 : 0);
  const t = ac.currentTime;
  e.osc.frequency.setTargetAtTime(f, t, 0.05);
  e.sub.frequency.setTargetAtTime(f / 2, t, 0.05);
  e.gain.gain.setTargetAtTime(s > 0.02 ? 0.018 + s * 0.012 : 0.0001, t, 0.08);
});

export const raceSfx = {
  engine: engineWhine,
  /** Always safe to call, muted or not. */
  stopEngine: stopEngineNow,
  /** One start light coming on. */
  light: gated(() => tone("square", 440, 440, 0.12, 0.04)),
  go: gated(() => tone("square", 880, 880, 0.3, 0.05)),
  drs: gated(() => {
    tone("sawtooth", 200, 600, 0.4, 0.03);
    const ac = audio();
    if (!ac) return;
    const buf = noise(ac, 0.35, (i, len) => (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len));
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(600, ac.currentTime);
    bp.frequency.exponentialRampToValueAtTime(3000, ac.currentTime + 0.3);
    const g = ac.createGain();
    g.gain.value = 0.12;
    playBuffer(buf, bp, g, ac);
  }),
  contact: gated(() => {
    tone("square", 160, 90, 0.12, 0.05);
    tone("sine", 120, 40, 0.15, 0.2);
  }),
  lap: gated(() => tone("triangle", 660, 660, 0.15, 0.04)),
  overtake: gated(() => tone("triangle", 520, 880, 0.12, 0.04)),
  finish: gated(() => {
    tone("sine", 523, 523, 0.15, 0.05);
    tone("sine", 659, 659, 0.15, 0.05, 0.15);
    tone("sine", 784, 784, 0.3, 0.05, 0.3);
  }),
};
