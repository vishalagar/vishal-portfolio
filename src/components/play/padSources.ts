import { EMPTY_PAD, type Pad, type PadKey } from "@/lib/play/pad";

/**
 * Who is holding which pad buttons. Each source is one key on the keyboard ("key:KeyA") or one finger
 * on the controller ("ptr:7"), so two fingers, or a key and a finger, can hold buttons at once and
 * letting go of one never releases the other.
 */
export type PadSources = Readonly<Record<string, readonly PadKey[]>>;

export const NO_SOURCES: PadSources = {};

export function pressSource(sources: PadSources, id: string, keys: readonly PadKey[]): PadSources {
  const cur = sources[id];
  if (cur && cur.length === keys.length && cur.every((k, i) => k === keys[i])) return sources;
  if (!keys.length) return releaseSource(sources, id);
  return { ...sources, [id]: keys };
}

export function releaseSource(sources: PadSources, id: string): PadSources {
  if (!(id in sources)) return sources;
  return Object.fromEntries(Object.entries(sources).filter(([k]) => k !== id));
}

/** Keyboard sources only: used when the overlay loses focus but fingers may still be on the controller. */
export function releaseKeys(sources: PadSources): PadSources {
  const kept = Object.entries(sources).filter(([k]) => !k.startsWith("key:"));
  return kept.length === Object.keys(sources).length ? sources : Object.fromEntries(kept);
}

/** The pad every game reads: a button is down while any source holds it. */
export function padFromSources(sources: PadSources): Pad {
  const held = Object.values(sources).flat();
  if (!held.length) return EMPTY_PAD;
  return held.reduce<Pad>((pad, k) => (pad[k] ? pad : { ...pad, [k]: true }), EMPTY_PAD);
}

/** True on the tick a button goes down. */
export function pressed(pad: Pad, prev: Pad, key: PadKey): boolean {
  return pad[key] && !prev[key];
}

/** True on the tick a button comes up. */
export function released(pad: Pad, prev: Pad, key: PadKey): boolean {
  return !pad[key] && prev[key];
}

/** Fraction of the d-pad's half-width that counts as the dead centre. */
const DEAD = 0.22;
/** A direction counts once its axis is at least half the other one (about 27 degrees off the diagonal). */
const AXIS_RATIO = 0.5;

/**
 * Directions for a finger on the d-pad, relative to its centre (dx, dy in px, `half` = half its width).
 * One finger can slide between arms and hold diagonals, like a real cross pad.
 */
export function dpadKeys(dx: number, dy: number, half: number): PadKey[] {
  const dead = half * DEAD;
  if (Math.hypot(dx, dy) < dead) return [];
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const keys: PadKey[] = [];
  if (ay >= ax * AXIS_RATIO) keys.push(dy < 0 ? "up" : "down");
  if (ax >= ay * AXIS_RATIO) keys.push(dx < 0 ? "left" : "right");
  return keys;
}
