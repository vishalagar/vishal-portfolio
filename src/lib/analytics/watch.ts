import type { Props, Tracker } from "./track";

interface Readable<T> {
  get: () => T;
  subscribe: (fn: () => void) => () => void;
}

export interface Watchable {
  theme: Readable<string>;
  world: Readable<string>;
  intro: Readable<string>;
  varMode: Readable<string>;
  sound: Readable<boolean>;
  play: Readable<{ game: string; key: number } | null>;
}

/** Calls onChange(next, prev) whenever the store's value really changes. */
function onChange<T>(store: Readable<T>, fn: (next: T, prev: T) => void): () => void {
  let prev = store.get();
  return store.subscribe(() => {
    const next = store.get();
    if (next === prev) return;
    const was = prev;
    prev = next;
    fn(next, was);
  });
}

/**
 * Reports what visitors do with the page-wide controls (world, theme, sound, VAR, start
 * screen, games) and keeps world/theme/sound attached to every other event.
 */
export function watchStores(
  s: Watchable,
  t: Pick<Tracker, "track" | "register">,
  now: () => number = () => Date.now(),
): () => void {
  const context = (): Props => ({ world: s.world.get(), theme: s.theme.get(), sound: s.sound.get() });
  t.register(context());

  let session: { game: string; key: number; started: number; restarts: number } | null = null;
  const stops = [
    onChange(s.world, (to, from) => {
      t.track("world_changed", { from, to });
      t.register(context());
    }),
    onChange(s.theme, (to) => {
      t.track("theme_changed", { to });
      t.register(context());
    }),
    onChange(s.sound, (on) => {
      t.track("sound_toggled", { on });
      t.register(context());
    }),
    onChange(s.varMode, (mode) => t.track("var_easter_egg", { on: mode === "on" })),
    onChange(s.intro, (state) => {
      if (state === "off") t.track("start_screen_closed", {});
    }),
    onChange(s.play, (next) => {
      if (next && session && next.game === session.game) {
        session = { ...session, key: next.key, restarts: session.restarts + 1 };
        t.track("game_restarted", { game: next.game });
        return;
      }
      if (session) {
        const seconds = Math.round((now() - session.started) / 1000);
        t.track("game_closed", { game: session.game, seconds, restarts: session.restarts });
      }
      session = next ? { game: next.game, key: next.key, started: now(), restarts: 0 } : null;
      if (next) t.track("game_opened", { game: next.game });
    }),
  ];
  return () => stops.forEach((stop) => stop());
}
