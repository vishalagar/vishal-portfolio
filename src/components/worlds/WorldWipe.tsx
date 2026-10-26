"use client";

import { useSyncExternalStore } from "react";
import { WORLDS } from "@/content/worlds";
import { useTheme } from "@/lib/hooks/useStores";
import { wipeStore } from "@/lib/worlds/switch";
import { fontStack } from "./fonts";
import styles from "./WorldWipe.module.css";

/** Full-screen colour wipe in the target world's palette and font, with the world's name on it. */
export function WorldWipe() {
  const wipe = useSyncExternalStore(wipeStore.subscribe, wipeStore.get, () => null);
  const theme = useTheme();
  if (!wipe) return null;
  const world = WORLDS[wipe.id];
  const mode = world.modes[theme];
  return (
    <div className={styles.wipe} aria-hidden="true" style={{ background: mode.bg, color: mode.ink }}>
      <div className={styles.card}>
        {wipe.sub && <div className={styles.sub}>{wipe.sub}</div>}
        <div className={styles.name} style={{ fontFamily: fontStack(world.fonts.display) }}>
          {world.name}
        </div>
      </div>
    </div>
  );
}
