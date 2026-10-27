/**
 * Every sound on the site, synthesised with WebAudio. No audio files.
 * Sound is off by default; nothing plays (and no AudioContext is created) until the visitor turns it on.
 * Per-world sets (opening sound, loop, blip, prop, gear) are in ./worlds and ./ambient; spec: tasks/worlds-spec/ section 5.
 */
import type { WorldId } from "@/content/worlds";
import type { MatchEvent } from "../engines/football/types";
import { startAmbient, stopAmbient } from "./ambient";
import { lightsNow, roarNow, shredNow, thudNow, whistleNow, whooshNow } from "./basics";
import { audio, masterOut, noise, playBuffer, tone } from "./core";
import { blipNow, gearNow, propNow, signatureNow } from "./worlds";

export { audio, masterOut, noise, playBuffer, tone };

let enabled = false;
let world: WorldId = "football";
const listeners = new Set<() => void>();

export function isSoundOn(): boolean {
  return enabled;
}

export function subscribeSound(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function soundWorld(): WorldId {
  return world;
}

/** The loop is paused while the tab is hidden and resumes on return if sound is still on. */
function onVisibility(): void {
  if (!enabled) return;
  if (document.hidden) stopAmbient();
  else startAmbient(world);
}

/** Which world's sound set plays. Swaps the background loop when sound is on (callers then call sfx.signature()). */
export function setSoundWorld(next: WorldId): void {
  if (next === world) return;
  world = next;
  if (enabled && typeof document !== "undefined" && !document.hidden) startAmbient(world);
  else if (enabled) stopAmbient();
}

/** Turn sound on or off. Must be called from a user gesture so browsers allow audio. */
export function setSoundOn(on: boolean): void {
  if (on === enabled) return;
  enabled = on;
  if (on) {
    signatureNow(world);
    startAmbient(world);
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);
  } else {
    stopAmbient();
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
  }
  listeners.forEach((fn) => fn());
}

/** Wrap a synth so it only plays while sound is on. */
export function gated<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
  return (...args: A) => {
    if (enabled) fn(...args);
  };
}

export const sfx = {
  /** The current world's opening sound (football: referee whistle). */
  signature: gated(() => signatureNow(world)),
  /** The hero prop (ball / tyre / coin / bottle / cube). */
  prop: gated(() => propNow(world)),
  /** Costume coming off (true) or going back on (false). No-op in football. */
  gear: gated((off: boolean) => gearNow(world, off)),
  whistle: gated(whistleNow),
  thud: gated(thudNow),
  /** The current world's button blip. */
  blip: gated(() => blipNow(world)),
  /** Theme switch: three clunks and a rising hum going to night; falling hum and a clunk going to day. */
  lights: gated(lightsNow),
  /** Kit room spotlight: clunk, click and a short hum, pitched per light. */
  spotlight: gated((i: number) => {
    tone("sine", 130 - i * 8, 45, 0.14, 0.3);
    tone("square", 2600, 1700, 0.025, 0.035);
    tone("sawtooth", 90, 110, 0.35, 0.012, 0.05);
  }),
  /** Shirt flip: band-pass noise sweeping 450 to 2600 Hz over 0.35 s. */
  whoosh: gated(whooshNow),
  psEncrypt: gated(() => tone("square", 520, 780, 0.08, 0.04)),
  psLink: gated(() => tone("sine", 880, 1320, 0.12, 0.05)),
  psPrint: gated(() => tone("square", 300, 280, 0.25, 0.03)),
  /** High-passed noise burst when the file is shredded. */
  psShred: gated(shredNow),
  retrainAlert: gated(() => {
    tone("square", 880, 880, 0.09, 0.04);
    tone("square", 660, 660, 0.09, 0.04, 0.12);
  }),
  retrainDeploy: gated(() => [523, 659, 784].forEach((f, i) => tone("triangle", f, f, 0.12, 0.05, i * 0.09))),
  retrainInject: gated(() => tone("sawtooth", 300, 120, 0.25, 0.04)),
  genDone: gated(() => {
    tone("triangle", 784, 784, 0.15, 0.04);
    tone("triangle", 1046, 1046, 0.2, 0.04, 0.08);
  }),
  genClick: gated(() => tone("triangle", 523, 523, 0.08, 0.04)),
  snakeStart: gated(() => tone("square", 520, 780, 0.08, 0.04)),
  snakeEat: gated(() => tone("square", 660, 1100, 0.07, 0.04)),
  snakeOver: gated(() => tone("sawtooth", 220, 55, 0.4, 0.05)),
  match: gated((e: MatchEvent | "start") => {
    switch (e) {
      case "kick":
        return tone("sine", 150, 50, 0.16, 0.35);
      case "pass":
        return tone("sine", 180, 70, 0.1, 0.2);
      case "tackle":
        return tone("square", 300, 180, 0.12, 0.04);
      case "save":
        return tone("sine", 220, 90, 0.2, 0.2);
      case "goal":
        roarNow();
        return tone("sine", 2800, 2800, 0.5, 0.06, 0.1);
      case "whistle":
      case "start":
        return tone("sine", 2800, 2800, 0.2, 0.05);
      case "end":
        tone("sine", 2800, 2800, 0.18, 0.06);
        tone("sine", 2800, 2800, 0.18, 0.06, 0.25);
        return tone("sine", 2800, 2800, 0.7, 0.06, 0.5);
    }
  }),
};
