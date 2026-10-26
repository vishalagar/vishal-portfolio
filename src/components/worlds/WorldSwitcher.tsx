"use client";

import type { CSSProperties } from "react";
import { WORLD_IDS, WORLDS } from "@/content/worlds";
import { useWorldId } from "@/lib/hooks/useStores";
import { sfx } from "@/lib/sound";
import { enterWorld, wipeStore } from "@/lib/worlds/switch";
import styles from "./WorldSwitcher.module.css";

/** Five world buttons in the header: swatch dots on phones, dot + name from tablet width. */
export function WorldSwitcher() {
  const current = useWorldId();
  return (
    <div role="group" aria-label="World" className={styles.group}>
      {WORLD_IDS.map((id) => {
        const w = WORLDS[id];
        return (
          <button
            key={id}
            type="button"
            className={`${styles.btn} va-press`}
            aria-pressed={id === current}
            aria-label={w.name}
            style={{ "--sw": w.swatch } as CSSProperties}
            onClick={() => {
              if (id === current || wipeStore.get()) return;
              sfx.blip();
              enterWorld(id);
            }}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.label} aria-hidden="true">{w.name}</span>
          </button>
        );
      })}
    </div>
  );
}
