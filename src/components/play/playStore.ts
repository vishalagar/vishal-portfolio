"use client";

import { useSyncExternalStore } from "react";
import type { GameId } from "@/content/worlds";

/** What the full-screen Play overlay is showing. `key` changes on every start and restart. */
export interface PlaySession {
  game: GameId;
  key: number;
}

let session: PlaySession | null = null;
let seq = 0;
/** The button that opened the overlay, so focus can go back to it on exit. */
let opener: HTMLElement | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((fn) => fn());
}

/**
 * A tiny external store so any card can open the overlay without a provider around the page.
 * Every change replaces the session object; nothing is mutated in place.
 */
export const playStore = {
  get: (): PlaySession | null => session,
  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  open(game: GameId, from: HTMLElement | null = null): void {
    opener = from;
    seq += 1;
    session = { game, key: seq };
    emit();
  },
  restart(): void {
    if (!session) return;
    seq += 1;
    session = { ...session, key: seq };
    emit();
  },
  close(): void {
    if (!session) return;
    session = null;
    emit();
  },
  /** Hands back (once) the element to refocus after the overlay closes. */
  takeOpener(): HTMLElement | null {
    const el = opener;
    opener = null;
    return el;
  },
};

export function usePlaySession(): PlaySession | null {
  return useSyncExternalStore(playStore.subscribe, playStore.get, () => null);
}
