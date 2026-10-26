/**
 * The shared controller every game reads. Keyboard (theatre mode) and the on-screen
 * Game Boy buttons (phone) both write into one Pad; games only read it.
 */
export interface Pad {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  /** Primary action: Space / J / phone A. */
  a: boolean;
  /** Secondary: X / K / phone B. */
  b: boolean;
  /** Shoulder: Shift / L / phone R (football sprint). */
  r: boolean;
}

export type PadKey = keyof Pad;

export const EMPTY_PAD: Pad = { up: false, down: false, left: false, right: false, a: false, b: false, r: false };

const KEY_MAP: Record<string, PadKey> = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
  " ": "a",
  j: "a",
  J: "a",
  x: "b",
  X: "b",
  k: "b",
  K: "b",
  Shift: "r",
  l: "r",
  L: "r",
};

/** The pad button a key drives, or null (also null with Cmd/Ctrl/Alt so browser shortcuts keep working). */
export function padKeyFor(e: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey">): PadKey | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  return KEY_MAP[e.key] ?? null;
}

export function withKey(pad: Pad, key: PadKey, on: boolean): Pad {
  return pad[key] === on ? pad : { ...pad, [key]: on };
}

/** Props every playable game component takes (worlds-spec: games take the shared controller). */
export interface GameProps {
  /** attract: the bot plays on the card. play: the visitor plays in the overlay. */
  mode: "attract" | "play";
  /** Only read in play mode. */
  pad?: Pad;
  /** Bumped to restart the game. */
  playKey?: number;
  /** CSS height of the game box. */
  height?: string;
}
