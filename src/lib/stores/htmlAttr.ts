import { DEFAULT_WORLD, WORLD_IDS, type WorldId } from "@/content/worlds";

/**
 * Tiny external stores backed by an attribute on <html>, so CSS can react to them
 * and React can read them with useSyncExternalStore.
 */
export interface HtmlAttrStore<T extends string> {
  get: () => T;
  set: (value: T) => void;
  subscribe: (fn: () => void) => () => void;
  serverValue: T;
}

export function htmlAttrStore<T extends string>(
  attr: string,
  values: readonly T[],
  fallback: T,
  storageKey?: string,
): HtmlAttrStore<T> {
  const listeners = new Set<() => void>();
  const get = (): T => {
    if (typeof document === "undefined") return fallback;
    const v = document.documentElement.getAttribute(attr) as T | null;
    return v && values.includes(v) ? v : fallback;
  };
  const set = (value: T) => {
    document.documentElement.setAttribute(attr, value);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, value);
      } catch {
        // storage blocked (private mode); the attribute still applies for this visit
      }
    }
    listeners.forEach((fn) => fn());
  };
  const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };
  return { get, set, subscribe, serverValue: fallback };
}

export type Theme = "night" | "day";
export const THEME_KEY = "va-theme";
/** Night (dark) is the default for this site, deliberately; the toggle is saved to localStorage. */
export const themeStore = htmlAttrStore<Theme>("data-theme", ["night", "day"], "night", THEME_KEY);

export type VarMode = "on" | "off";
/** Easter egg: typing VAR puts detection boxes on the whole page. */
export const varStore = htmlAttrStore<VarMode>("data-var", ["on", "off"], "off");

export const WORLD_KEY = "va-world";
/** Which world the page is dressed as. Saved, so a returning visitor's start screen opens over it. */
export const worldStore = htmlAttrStore<WorldId>("data-world", WORLD_IDS, DEFAULT_WORLD, WORLD_KEY);

export type IntroState = "on" | "off";
/** The "Choose your world" start screen. On once per visit (per tab), see BOOT_SCRIPT. */
export const introStore = htmlAttrStore<IntroState>("data-intro", ["on", "off"], "off");

/** sessionStorage flag: this tab has been past the start screen, so reloads skip it. */
export const SEEN_KEY = "va-seen";

export function markIntroSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // storage blocked: the start screen just shows again on reload
  }
}

/** The world picked on a previous visit, if any. */
export function savedWorld(): WorldId | null {
  try {
    const w = localStorage.getItem(WORLD_KEY);
    return w && (WORLD_IDS as readonly string[]).includes(w) ? (w as WorldId) : null;
  } catch {
    return null;
  }
}

const WORLD_LIST = JSON.stringify(WORLD_IDS);

/**
 * Runs in <head> before first paint: applies a saved day theme so it never flashes night,
 * applies the saved world (or ?world=<id>, used for links and tests), shows the start screen
 * once per visit (skipped on reloads in the same tab and for ?world= links), and marks
 * <html data-js> so "hidden until revealed" styles only apply when scripts run.
 */
export const BOOT_SCRIPT = `(function(){var d=document.documentElement;d.setAttribute("data-js","");var W=${WORLD_LIST},w=null,q=null,s=null;try{var t=localStorage.getItem("${THEME_KEY}");if(t==="day"||t==="night")d.setAttribute("data-theme",t);w=localStorage.getItem("${WORLD_KEY}")}catch(e){}try{s=sessionStorage.getItem("${SEEN_KEY}")}catch(e){}try{q=new URLSearchParams(location.search).get("world");if(q&&W.indexOf(q)>=0)w=q;else q=null}catch(e){}if(w&&W.indexOf(w)>=0)d.setAttribute("data-world",w);d.setAttribute("data-intro",q||s?"off":"on")})()`;
