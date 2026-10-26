"use client";

import { useEffect, type RefObject } from "react";

/**
 * While the overlay is open: the page behind it can't scroll, be tabbed into or be read out.
 * iOS Safari ignores `overflow: hidden` on body for touch scrolling, so body is pinned with
 * `position: fixed` at the current offset and the scroll position is put back on close.
 * Focus moves into the overlay on open and back to `returnFocus()` (the Play button) on close.
 */
export function usePageLock(overlay: RefObject<HTMLElement | null>, returnFocus: () => HTMLElement | null): void {
  useEffect(() => {
    const host = overlay.current;
    if (!host) return;
    const { body, documentElement: html } = document;
    const y = window.scrollY;
    const saved = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: html.style.overflow,
    };
    Object.assign(body.style, { position: "fixed", top: `-${y}px`, left: "0", right: "0", width: "100%" });
    html.style.overflow = "hidden";

    // everything else in <body> goes inert (unfocusable, hidden from screen readers)
    const page = Array.from(body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== host && !el.contains(host) && !el.hasAttribute("inert"),
    );
    page.forEach((el) => el.setAttribute("inert", ""));
    host.focus({ preventScroll: true });

    return () => {
      page.forEach((el) => el.removeAttribute("inert"));
      Object.assign(body.style, {
        position: saved.position,
        top: saved.top,
        left: saved.left,
        right: saved.right,
        width: saved.width,
      });
      html.style.overflow = saved.overflow;
      // html has smooth scrolling; jump straight back instead of animating from the top
      window.scrollTo({ top: y, left: 0, behavior: "instant" });
      // only now is the page focusable again
      returnFocus()?.focus({ preventScroll: true });
    };
  }, [overlay, returnFocus]);
}
