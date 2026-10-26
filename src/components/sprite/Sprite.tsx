"use client";

import { useEffect, useState } from "react";
import { useReducedMotion, useWorldId } from "@/lib/hooks/useStores";
import { LAST_FRAME } from "@/lib/hooks/unmaskMath";
import styles from "./Sprite.module.css";

export type Gaze = "open" | "left" | "right";

/** Sheet frames, left to right: open, look-left, look-right, half-closed, closed. */
const FRAME: Record<Gaze | "half" | "closed", string> = {
  open: "0% 0",
  left: "25% 0",
  right: "50% 0",
  half: "75% 0",
  closed: "100% 0",
};

interface SpriteProps {
  /** Rendered size; keep it a whole multiple of the 48×56 bust. */
  scale: number;
  /** Controlled gaze (hero). Leave undefined to glance around on a CSS cycle. */
  gaze?: Gaze;
  glance?: { duration: number; delay: number };
  label?: string;
  /** Costume-off frame: 0 = costume sheet, 1–6 = unmask strip, 7 = base football sprite. Football is always base. */
  unmask?: number;
}

/** Blink every 2–6 s, sometimes twice: half → closed → half, about 160 ms in all. */
function useBlink(enabled: boolean): "half" | "closed" | null {
  const [lids, setLids] = useState<"half" | "closed" | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
    const blink = (start: number) => {
      at(() => setLids("half"), start);
      at(() => setLids("closed"), start + 50);
      at(() => setLids("half"), start + 110);
      at(() => setLids(null), start + 160);
    };
    const schedule = () => {
      const wait = 2000 + Math.random() * 4000;
      blink(wait);
      const double = Math.random() < 0.2;
      if (double) blink(wait + 300);
      at(schedule, wait + (double ? 500 : 200));
    };
    schedule();
    return () => timers.forEach(clearTimeout);
  }, [enabled]);
  return enabled ? lids : null;
}

export function Sprite({ scale, gaze, glance, label, unmask = 0 }: SpriteProps) {
  const world = useWorldId();
  const calm = useReducedMotion();
  const lids = useBlink(!calm);
  const width = 48 * scale;
  const height = 56 * scale;
  const gazeStyle =
    gaze !== undefined || !glance
      ? { backgroundPosition: FRAME[gaze ?? "open"] }
      : {
          animation: `va-glance ${glance.duration}s step-end ${glance.delay}s infinite`,
        };

  const costume = world !== "football" && unmask < LAST_FRAME;
  const midStrip = costume && unmask > 0;
  const sheetClass = costume ? `${styles.layer} ${styles[world]}` : styles.layer;

  return (
    <div
      className={styles.sprite}
      // a parent can resize it with --sprite-w / --sprite-h (e.g. smaller on phones)
      style={{
        width: `var(--sprite-w, ${width}px)`,
        height: `var(--sprite-h, ${height}px)`,
      }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-unmask={unmask}
    >
      {midStrip ? (
        <div
          className={`${styles.layer} ${styles.strip} ${styles[`strip${world}`]}`}
          style={{ backgroundPosition: `${((unmask / LAST_FRAME) * 100).toFixed(3)}% 0` }}
        />
      ) : (
        <>
          <div className={sheetClass} style={gazeStyle} />
          {lids && <div className={sheetClass} style={{ backgroundPosition: FRAME[lids] }} />}
        </>
      )}
    </div>
  );
}
