/** Costume-off frame maths (worlds-spec §4). Pure, so it can be unit-tested without a DOM. */

export const LAST_FRAME = 7;
/** Scroll distance the hero animation runs over. */
export const HERO_RANGE_PX = 280;
/** Scroll distance for the Pundit / footer sprites. */
export const INLINE_RANGE_PX = 160;
/** Pundit / footer start when the sprite top reaches this share of the viewport height. */
export const INLINE_START = 0.92;
/** Hero starts this far past the moment the sprite is fully on screen. */
const HERO_LEAD_PX = 24;

export type UnmaskMode = "hero" | "inline";

/** Progress 0–1 → frame 0–7. Reduced motion is a straight swap at 50%. */
export function unmaskFrame(progress: number, calm: boolean): number {
  if (calm) return progress >= 0.5 ? LAST_FRAME : 0;
  return Math.round(Math.min(1, Math.max(0, progress)) * LAST_FRAME);
}

export interface Geometry {
  /** getBoundingClientRect() top / bottom of the sprite's box. */
  top: number;
  bottom: number;
  scrollY: number;
  viewportH: number;
}

/** Unclamped progress; `unmaskFrame` clamps it. */
export function unmaskProgress(mode: UnmaskMode, g: Geometry): number {
  if (mode === "inline") {
    return (g.viewportH * INLINE_START - g.top) / INLINE_RANGE_PX;
  }
  const bottomOnPage = g.bottom + g.scrollY;
  const start = Math.max(0, bottomOnPage - g.viewportH) + HERO_LEAD_PX;
  return (g.scrollY - start) / HERO_RANGE_PX;
}
