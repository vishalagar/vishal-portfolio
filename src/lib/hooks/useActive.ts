"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

function subscribeVisibility(fn: () => void): () => void {
  document.addEventListener("visibilitychange", fn);
  return () => document.removeEventListener("visibilitychange", fn);
}

export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => false,
  );
}

interface InViewOptions {
  rootMargin?: string;
  threshold?: number;
  /** Stop observing after the first time it comes into view. */
  once?: boolean;
}

export function useInView<T extends Element>(ref: RefObject<T | null>, opts: InViewOptions = {}): boolean {
  const { rootMargin = "0px", threshold = 0, once = false } = opts;
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      // very old browsers: treat as visible so content still works
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        setInView(hit);
        if (hit && once) io.disconnect();
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold, once]);
  return inView;
}

/** True while the element is on screen and the tab is visible: demos only tick then. */
export function useActive<T extends Element>(ref: RefObject<T | null>): boolean {
  const inView = useInView(ref, { rootMargin: "120px" });
  const visible = usePageVisible();
  return inView && visible;
}

/** setInterval that always calls the latest callback. Pass `null` to pause. */
export function useInterval(callback: () => void, ms: number | null): void {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);
  useEffect(() => {
    if (ms === null) return;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}
