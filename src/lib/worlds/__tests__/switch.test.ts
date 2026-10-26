// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { constant } from "@/lib/engines/rng";

const { setSoundWorld, signature } = vi.hoisted(() => ({ setSoundWorld: vi.fn(), signature: vi.fn() }));
vi.mock("@/lib/sound", () => ({ setSoundWorld, sfx: { signature } }));

import { enterWorld, randomWorld, WIPE_END_MS, WIPE_SWAP_MS, wipeStore } from "../switch";
import { worldStore } from "@/lib/stores/htmlAttr";

function mockMotion(reduced: boolean) {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: reduced })));
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  document.documentElement.removeAttribute("data-world");
  setSoundWorld.mockClear();
  signature.mockClear();
  mockMotion(false);
});

afterEach(() => {
  vi.runAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("randomWorld", () => {
  it("maps rng output onto the five worlds", () => {
    expect(randomWorld(constant(0))).toBe("football");
    expect(randomWorld(constant(0.45))).toBe("gaming");
    expect(randomWorld(constant(0.999999))).toBe("ai");
  });
});

describe("enterWorld", () => {
  it("shows the wipe, swaps at 320 ms and clears at 920 ms", () => {
    enterWorld("gp", "Welcome to");
    expect(wipeStore.get()).toEqual({ id: "gp", sub: "Welcome to" });
    expect(worldStore.get()).toBe("football");
    vi.advanceTimersByTime(WIPE_SWAP_MS);
    expect(worldStore.get()).toBe("gp");
    expect(localStorage.getItem("va-world")).toBe("gp");
    expect(setSoundWorld).toHaveBeenCalledWith("gp");
    expect(signature).toHaveBeenCalledTimes(1);
    expect(wipeStore.get()).not.toBeNull();
    vi.advanceTimersByTime(WIPE_END_MS - WIPE_SWAP_MS);
    expect(wipeStore.get()).toBeNull();
  });

  it("notifies subscribers", () => {
    const fn = vi.fn();
    const off = wipeStore.subscribe(fn);
    enterWorld("ai");
    vi.advanceTimersByTime(WIPE_END_MS);
    expect(fn).toHaveBeenCalledTimes(2);
    off();
  });

  it("swaps instantly with no wipe under reduced motion", () => {
    mockMotion(true);
    enterWorld("run");
    expect(wipeStore.get()).toBeNull();
    expect(worldStore.get()).toBe("run");
    expect(signature).toHaveBeenCalledTimes(1);
  });

  it("a second switch replaces the first", () => {
    enterWorld("gp");
    vi.advanceTimersByTime(100);
    enterWorld("gaming");
    vi.advanceTimersByTime(WIPE_END_MS);
    expect(worldStore.get()).toBe("gaming");
    expect(setSoundWorld).toHaveBeenCalledTimes(1);
  });
});
