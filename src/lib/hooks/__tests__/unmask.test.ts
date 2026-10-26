import { describe, expect, it } from "vitest";
import { unmaskFrame, unmaskProgress } from "../unmaskMath";

describe("unmaskFrame", () => {
  it("maps progress to frames 0–7 and clamps", () => {
    expect(unmaskFrame(-1, false)).toBe(0);
    expect(unmaskFrame(0, false)).toBe(0);
    expect(unmaskFrame(0.5, false)).toBe(4);
    expect(unmaskFrame(1, false)).toBe(7);
    expect(unmaskFrame(3, false)).toBe(7);
  });
  it("swaps straight at 50% in reduced motion", () => {
    expect(unmaskFrame(0.49, true)).toBe(0);
    expect(unmaskFrame(0.5, true)).toBe(7);
    expect(unmaskFrame(0.3, true)).not.toBe(3);
  });
});

describe("unmaskProgress", () => {
  const vh = 800;
  it("inline: starts at 92% of the viewport and runs 160 px", () => {
    const at = (top: number) => unmaskProgress("inline", { top, bottom: top + 100, scrollY: 0, viewportH: vh });
    expect(at(vh * 0.92)).toBe(0);
    expect(at(vh * 0.92 - 160)).toBe(1);
    expect(at(vh * 0.92 - 80)).toBeCloseTo(0.5);
  });
  it("hero: waits until the sprite is fully on screen, then 280 px", () => {
    // sprite bottom at 600 on the page: fully visible from the start, begins after 24 px
    const at = (scrollY: number) => unmaskProgress("hero", { top: 200 - scrollY, bottom: 600 - scrollY, scrollY, viewportH: vh });
    expect(at(24)).toBe(0);
    expect(at(24 + 280)).toBe(1);
    // sprite bottom below the fold (1000 on page): starts once it has scrolled into view
    const low = (scrollY: number) => unmaskProgress("hero", { top: 600 - scrollY, bottom: 1000 - scrollY, scrollY, viewportH: vh });
    expect(low(200 + 24)).toBe(0);
    expect(low(200 + 24 + 140)).toBeCloseTo(0.5);
  });
});
