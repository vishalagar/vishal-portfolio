"use client";

import { useWorld } from "@/lib/hooks/useStores";
import styles from "./Header.module.css";

/** The broadcast scorebug; its text follows the current world (spec §1). */
export function Scorebug() {
  const { live, home, score, away } = useWorld().scorebug;
  return (
    <div className={styles.scorebug} data-detect="scorebug 0.97">
      <div className={styles.live}>
        <span className={styles.liveDot} aria-hidden="true" />
        {live}
      </div>
      <div className={styles.teams}>
        <span className={styles.crest} aria-hidden="true" />
        {home}
        <span className={styles.score}>{score}</span>
        {away}
      </div>
    </div>
  );
}
