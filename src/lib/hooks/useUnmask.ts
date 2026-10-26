"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { sfx } from "@/lib/sound";
import { useReducedMotion, useWorldId } from "./useStores";
import { unmaskFrame, unmaskProgress, type UnmaskMode } from "./unmaskMath";

/**
 * Costume frame (0 = costume on … 7 = plain football avatar) for the sprite inside `ref`,
 * driven by scroll position. Football has no costume, so it stays at 0 and never listens.
 */
export function useUnmask(ref: RefObject<HTMLElement | null>, mode: UnmaskMode): number {
  const world = useWorldId();
  const calm = useReducedMotion();
  const [frame, setFrame] = useState(0);
  const last = useRef(0);
  const costume = world !== "football";

  useEffect(() => {
    if (!costume) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const next = unmaskFrame(
        unmaskProgress(mode, { top: r.top, bottom: r.bottom, scrollY: window.scrollY, viewportH: window.innerHeight }),
        calm,
      );
      const prev = last.current;
      if (next === prev) return;
      last.current = next;
      if (prev === 0) sfx.gear(true);
      else if (next === 0) sfx.gear(false);
      setFrame(next);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
    };
  }, [ref, mode, calm, costume]);

  return costume ? frame : 0;
}
