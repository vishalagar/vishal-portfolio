import { describe, expect, it } from "vitest";
import { EMPTY_PAD } from "@/lib/play/pad";
import { PLAY } from "@/content/worlds";
import {
  dpadKeys,
  NO_SOURCES,
  padFromSources,
  pressed,
  pressSource,
  released,
  releaseKeys,
  releaseSource,
} from "../padSources";
import { playStore } from "../playStore";
import { fitBox, isPhoneLayout } from "../sizing";

describe("pad sources", () => {
  it("starts empty and gives the shared empty pad", () => {
    expect(padFromSources(NO_SOURCES)).toBe(EMPTY_PAD);
  });

  it("holds a button while any source holds it", () => {
    let s = pressSource(NO_SOURCES, "key:ArrowLeft", ["left"]);
    s = pressSource(s, "key:KeyA", ["left"]);
    expect(padFromSources(s).left).toBe(true);
    s = releaseSource(s, "key:ArrowLeft");
    expect(padFromSources(s).left).toBe(true);
    s = releaseSource(s, "key:KeyA");
    expect(padFromSources(s)).toEqual(EMPTY_PAD);
  });

  it("lets a finger on the d-pad and a finger on A press at once", () => {
    let s = pressSource(NO_SOURCES, "ptr:1", ["up", "right"]);
    s = pressSource(s, "ptr:2", ["a"]);
    expect(padFromSources(s)).toEqual({ ...EMPTY_PAD, up: true, right: true, a: true });
    s = releaseSource(s, "ptr:1");
    expect(padFromSources(s)).toEqual({ ...EMPTY_PAD, a: true });
  });

  it("never mutates and returns the same object when nothing changes", () => {
    const a = pressSource(NO_SOURCES, "ptr:1", ["up"]);
    expect(NO_SOURCES).toEqual({});
    expect(pressSource(a, "ptr:1", ["up"])).toBe(a);
    expect(releaseSource(a, "ptr:9")).toBe(a);
    const b = pressSource(a, "ptr:1", ["up", "left"]);
    expect(a["ptr:1"]).toEqual(["up"]);
    expect(b["ptr:1"]).toEqual(["up", "left"]);
  });

  it("pressing no keys releases the source (finger back in the dead centre)", () => {
    const a = pressSource(NO_SOURCES, "ptr:1", ["up"]);
    expect(pressSource(a, "ptr:1", [])).toEqual({});
  });

  it("releaseKeys drops keyboard sources and keeps fingers", () => {
    const s = pressSource(pressSource(NO_SOURCES, "key:Space", ["a"]), "ptr:3", ["left"]);
    expect(releaseKeys(s)).toEqual({ "ptr:3": ["left"] });
    const fingers = pressSource(NO_SOURCES, "ptr:3", ["left"]);
    expect(releaseKeys(fingers)).toBe(fingers);
  });

  it("detects presses and releases between two pads", () => {
    const down = { ...EMPTY_PAD, a: true };
    expect(pressed(down, EMPTY_PAD, "a")).toBe(true);
    expect(pressed(down, down, "a")).toBe(false);
    expect(released(EMPTY_PAD, down, "a")).toBe(true);
    expect(released(down, down, "a")).toBe(false);
  });
});

describe("d-pad directions", () => {
  const half = 80;
  it("ignores the dead centre", () => {
    expect(dpadKeys(5, -5, half)).toEqual([]);
  });
  it("reads the four arms", () => {
    expect(dpadKeys(0, -60, half)).toEqual(["up"]);
    expect(dpadKeys(0, 60, half)).toEqual(["down"]);
    expect(dpadKeys(-60, 4, half)).toEqual(["left"]);
    expect(dpadKeys(60, -4, half)).toEqual(["right"]);
  });
  it("reads diagonals, but not when one axis clearly wins", () => {
    expect(dpadKeys(50, -50, half)).toEqual(["up", "right"]);
    expect(dpadKeys(-40, 45, half)).toEqual(["down", "left"]);
    expect(dpadKeys(60, -20, half)).toEqual(["right"]);
  });
});

describe("play layout", () => {
  it("uses the handheld split on narrow screens and small touch screens", () => {
    expect(isPhoneLayout(390, false)).toBe(true);
    expect(isPhoneLayout(820, true)).toBe(true);
    expect(isPhoneLayout(820, false)).toBe(false);
    expect(isPhoneLayout(1280, true)).toBe(false);
  });

  it("fits the theatre box to the height on a wide laptop (mock maths)", () => {
    // 1440 × 900 laptop, football (2:1): mock availW = min(1392, 1280), availH = 730
    const box = fitBox(1280, 730, PLAY.football.desk);
    expect(box).toEqual({ w: 1280, h: 640, gameH: "636px" });
    const race = fitBox(1280, 730, PLAY.race.desk);
    expect(race).toEqual({ w: 1168, h: 730, gameH: "726px" });
  });

  it("fits the phone screen to its width", () => {
    // 390 px phone: the slot is 342 wide and ~350 tall
    expect(fitBox(342, 350, PLAY.football.phone)).toEqual({ w: 342, h: 263, gameH: "259px" });
    // the race is taller than it is wide on a phone
    expect(fitBox(342, 350, PLAY.race.phone)).toEqual({ w: 297, h: 349, gameH: "345px" });
  });

  it("caps the width and refuses spaces too small to play in", () => {
    expect(fitBox(3000, 3000, 2)?.w).toBe(1280);
    expect(fitBox(0, 300, 2)).toBeNull();
    expect(fitBox(300, 10, 2)).toBeNull();
    expect(fitBox(300, 300, 0)).toBeNull();
  });
});

describe("play store", () => {
  it("opens, restarts with a new key, and closes", () => {
    const seen: Array<ReturnType<typeof playStore.get>> = [];
    const off = playStore.subscribe(() => seen.push(playStore.get()));
    const button = { focus: () => undefined } as unknown as HTMLElement;
    playStore.open("snake", button);
    const first = playStore.get();
    expect(first?.game).toBe("snake");
    playStore.restart();
    const second = playStore.get();
    expect(second?.game).toBe("snake");
    expect(second?.key).not.toBe(first?.key);
    expect(second).not.toBe(first);
    playStore.close();
    expect(playStore.get()).toBeNull();
    expect(playStore.takeOpener()).toBe(button);
    expect(playStore.takeOpener()).toBeNull();
    off();
    expect(seen).toHaveLength(3);
  });

  it("ignores restart and close while nothing is open", () => {
    const calls: number[] = [];
    const off = playStore.subscribe(() => calls.push(1));
    playStore.restart();
    playStore.close();
    off();
    expect(calls).toEqual([]);
  });
});
