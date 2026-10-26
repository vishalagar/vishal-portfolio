"use client";

import { useSyncExternalStore } from "react";
import { isSoundOn, subscribeSound } from "@/lib/sound";
import { WORLDS, type Palette, type World, type WorldId } from "@/content/worlds";
import {
  introStore,
  themeStore,
  varStore,
  worldStore,
  type IntroState,
  type Theme,
  type VarMode,
} from "@/lib/stores/htmlAttr";

export function useSoundOn(): boolean {
  return useSyncExternalStore(subscribeSound, isSoundOn, () => false);
}

export function useTheme(): Theme {
  return useSyncExternalStore(themeStore.subscribe, themeStore.get, () => themeStore.serverValue);
}

export function useVarMode(): VarMode {
  return useSyncExternalStore(varStore.subscribe, varStore.get, () => varStore.serverValue);
}

export function useWorldId(): WorldId {
  return useSyncExternalStore(worldStore.subscribe, worldStore.get, () => worldStore.serverValue);
}

/** The current world's definition (copy, fonts, layouts). Football on the server. */
export function useWorld(): World {
  return WORLDS[useWorldId()];
}

/** The current world's colours for the current theme, for canvas drawing. CSS should use the variables instead. */
export function usePalette(): Palette {
  const world = useWorld();
  const theme = useTheme();
  return world.modes[theme];
}

export function useIntro(): IntroState {
  return useSyncExternalStore(introStore.subscribe, introStore.get, () => introStore.serverValue);
}

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(fn: () => void): () => void {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}
