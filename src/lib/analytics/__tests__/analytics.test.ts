import { describe, expect, it, vi } from "vitest";
import { createTracker } from "../track";
import { watchStores, type Watchable } from "../watch";

function fakeStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    set(next: T) {
      value = next;
      listeners.forEach((fn) => fn());
    },
    listeners,
  };
}

describe("createTracker", () => {
  it("queues events until a client attaches, then flushes them in order", () => {
    const t = createTracker();
    t.track("a", { n: 1 });
    t.register({ world: "football" });
    t.track("b");
    const client = { capture: vi.fn(), register: vi.fn() };
    t.attach(client);
    expect(client.register).toHaveBeenCalledWith({ world: "football" });
    expect(client.capture.mock.calls).toEqual([
      ["a", { n: 1 }],
      ["b", {}],
    ]);
  });

  it("sends straight to the client once attached", () => {
    const t = createTracker();
    const client = { capture: vi.fn(), register: vi.fn() };
    t.attach(client);
    t.track("c", { x: "y" });
    expect(client.capture).toHaveBeenCalledWith("c", { x: "y" });
  });

  it("caps the queue so a page without a key never grows it forever", () => {
    const t = createTracker(3);
    for (let i = 0; i < 10; i++) t.track("e", { i });
    const client = { capture: vi.fn(), register: vi.fn() };
    t.attach(client);
    expect(client.capture.mock.calls.map((c) => c[1])).toEqual([{ i: 7 }, { i: 8 }, { i: 9 }]);
  });

  it("never throws when the client does", () => {
    const t = createTracker();
    t.attach({
      capture: () => {
        throw new Error("blocked");
      },
      register: () => {
        throw new Error("blocked");
      },
    });
    expect(() => t.track("x")).not.toThrow();
    expect(() => t.register({ a: 1 })).not.toThrow();
  });
});

describe("watchStores", () => {
  function setup() {
    const theme = fakeStore("night");
    const world = fakeStore("football");
    const intro = fakeStore("on");
    const varMode = fakeStore("off");
    const sound = fakeStore(false);
    const play = fakeStore<{ game: string; key: number } | null>(null);
    let now = 1000;
    const track = vi.fn();
    const register = vi.fn();
    const stores: Watchable = { theme, world, intro, varMode, sound, play };
    const stop = watchStores(stores, { track, register }, () => now);
    return { theme, world, intro, varMode, sound, play, track, register, stop, tick: (ms: number) => (now += ms) };
  }

  it("registers the starting world and theme as properties on every event", () => {
    const { register } = setup();
    expect(register).toHaveBeenCalledWith({ world: "football", theme: "night", sound: false });
  });

  it("tracks world, theme, sound and VAR changes", () => {
    const s = setup();
    s.world.set("gp");
    s.theme.set("day");
    s.sound.set(true);
    s.varMode.set("on");
    expect(s.track.mock.calls).toEqual([
      ["world_changed", { from: "football", to: "gp" }],
      ["theme_changed", { to: "day" }],
      ["sound_toggled", { on: true }],
      ["var_easter_egg", { on: true }],
    ]);
    expect(s.register).toHaveBeenLastCalledWith({ world: "gp", theme: "day", sound: true });
  });

  it("ignores notifications that don't change the value", () => {
    const s = setup();
    s.world.set("football");
    expect(s.track).not.toHaveBeenCalled();
  });

  it("tracks the start screen being closed", () => {
    const s = setup();
    s.intro.set("off");
    expect(s.track).toHaveBeenCalledWith("start_screen_closed", {});
  });

  it("tracks a game session: opened, restarted, closed with time played", () => {
    const s = setup();
    s.play.set({ game: "snake", key: 1 });
    s.tick(4000);
    s.play.set({ game: "snake", key: 2 });
    s.tick(6000);
    s.play.set(null);
    expect(s.track.mock.calls).toEqual([
      ["game_opened", { game: "snake" }],
      ["game_restarted", { game: "snake" }],
      ["game_closed", { game: "snake", seconds: 10, restarts: 1 }],
    ]);
  });

  it("stops listening when stopped", () => {
    const s = setup();
    s.stop();
    expect(s.world.listeners.size).toBe(0);
    expect(s.play.listeners.size).toBe(0);
  });
});
