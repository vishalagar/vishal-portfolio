"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { PHONE_QUERY } from "./sizing";

function subscribePhone(fn: () => void): () => void {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
}

/** True for the handheld split (phones, small touch tablets); false for the laptop theatre. */
export function usePhoneLayout(): boolean {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

export interface Size {
  w: number;
  h: number;
}

/** The content-box size of an element, kept up to date (rotation, URL bar, window resize). */
export function useContentSize(ref: RefObject<HTMLElement | null>, deps: unknown): Size | null {
  const [size, setSize] = useState<Size | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((s) => (s && s.w === Math.floor(width) && s.h === Math.floor(height) ? s : { w: Math.floor(width), h: Math.floor(height) }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, deps]);
  return size;
}
