import { WORLD_IDS, type WorldId } from "@/content/worlds";
import { mathRng, type Rng } from "@/lib/engines/rng";
import { setSoundWorld, sfx } from "@/lib/sound";
import { varStore, worldStore } from "@/lib/stores/htmlAttr";

/** The world swaps while the wipe covers the screen, then the wipe clears (mock: 320 ms / 920 ms). */
export const WIPE_SWAP_MS = 320;
export const WIPE_END_MS = 920;

export interface WipeState {
  id: WorldId;
  /** "Welcome to" / "Random pick" / "". */
  sub: string;
}

const listeners = new Set<() => void>();
let wipe: WipeState | null = null;
let timers: ReturnType<typeof setTimeout>[] = [];

function setWipe(next: WipeState | null): void {
  wipe = next;
  listeners.forEach((fn) => fn());
}

/** What <WorldWipe/> renders: null when no wipe is running. */
export const wipeStore = {
  get: (): WipeState | null => wipe,
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

export function randomWorld(rng: Rng = mathRng): WorldId {
  return WORLD_IDS[Math.min(WORLD_IDS.length - 1, Math.floor(rng() * WORLD_IDS.length))];
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function applyWorld(id: WorldId): void {
  // VAR is a football joke: its boxes and labels don't follow the visitor into another world
  if (id !== worldStore.get() && varStore.get() === "on") varStore.set("off");
  worldStore.set(id);
  setSoundWorld(id);
  sfx.signature(); // gated: silent while sound is off
}

/** Switch world with the wipe (instant swap, no wipe, under reduced motion). */
export function enterWorld(id: WorldId, sub = ""): void {
  timers.forEach(clearTimeout);
  timers = [];
  if (prefersReducedMotion()) {
    setWipe(null);
    applyWorld(id);
    return;
  }
  setWipe({ id, sub });
  timers = [
    setTimeout(() => applyWorld(id), WIPE_SWAP_MS),
    setTimeout(() => {
      timers = [];
      setWipe(null);
    }, WIPE_END_MS),
  ];
}
