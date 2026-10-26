"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion, useTheme, useWorld } from "@/lib/hooks/useStores";
import { sfx } from "@/lib/sound";
import { themeStore } from "@/lib/stores/htmlAttr";
import styles from "./Header.module.css";

const SWAP_AT = { night: 420, day: 380 } as const;
const SEQUENCE_MS = 1350;

/** Label comes from the world (football: "Floodlights on" / "Day match"). Night: lights flicker on and beams sweep in; day: beams power down. */
export function ThemeToggle() {
  const theme = useTheme();
  const labels = useWorld().theme;
  const calm = useReducedMotion();
  const [lights, setLights] = useState<"on" | "off" | null>(null);
  // a stable bag, so unmount cleanup sees timers added after the effect ran
  const timers = useRef({ ids: [] as ReturnType<typeof setTimeout>[] });
  const night = theme === "night";

  useEffect(() => {
    const bag = timers.current;
    return () => bag.ids.forEach(clearTimeout);
  }, []);

  const toggle = () => {
    if (lights) return;
    const next = night ? "day" : "night";
    sfx.lights(next === "night");
    if (calm) {
      themeStore.set(next);
      return;
    }
    setLights(next === "night" ? "on" : "off");
    timers.current.ids = [
      setTimeout(() => themeStore.set(next), SWAP_AT[next]),
      setTimeout(() => setLights(null), SEQUENCE_MS),
    ];
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.toggle} va-press`}
        onClick={toggle}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 21V9" />
          <path d="M18 21V9" />
          <rect x="3" y="3" width="6" height="6" fill="var(--lamp-fill)" />
          <rect x="15" y="3" width="6" height="6" fill="var(--lamp-fill)" />
        </svg>
        <span className={styles.toggleText}>
          {night ? labels[0] : labels[1]}
        </span>
        <span className="sr-only">
          {night
            ? `: switch to ${labels[1].toLowerCase()} (light theme)`
            : `: switch to ${labels[0].toLowerCase()} (dark theme)`}
        </span>
      </button>
      {lights && (
        <div
          className={`${styles.lights} ${lights === "on" ? styles.on : styles.off}`}
          aria-hidden="true"
        >
          <div className={styles.blackout} />
          <div className={`${styles.beam} ${styles.beamLeft}`} />
          <div className={`${styles.beam} ${styles.beamRight}`} />
        </div>
      )}
    </>
  );
}
