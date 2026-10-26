"use client";

import { useEffect, useRef, useState } from "react";
import {
  hexLine,
  SCRAMBLE_MS,
  STAGE_COPY,
  STAGE_STARTS,
  stageView,
  type PrintSafeStage,
} from "@/lib/engines/printsafe";
import { sfx } from "@/lib/sound";
import styles from "./PrintSafeDemo.module.css";

const LINE_WIDTHS = ["90%", "72%", "84%", "60%", "80%", "68%", "44%"];
const STAGE_SOUND: Partial<Record<PrintSafeStage, () => void>> = {
  1: sfx.psEncrypt,
  2: sfx.psLink,
  3: sfx.psPrint,
  4: sfx.psShred,
};

/** At this height and up (the featured card) the document and copy get more room. */
const BIG_FROM_PX = 300;

export function PrintSafeDemo({ height = "220px" }: { height?: string }) {
  const big = parseInt(height, 10) >= BIG_FROM_PX;
  const [stage, setStage] = useState<PrintSafeStage>(0);
  const [scramble, setScramble] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach((t) => {
      clearTimeout(t);
      clearInterval(t);
    });
    timers.current = [];
  };
  useEffect(() => clear, []);

  const run = () => {
    clear();
    const scrambler = setInterval(() => setScramble((n) => n + 1), SCRAMBLE_MS);
    timers.current.push(scrambler);
    for (const [s, at] of STAGE_STARTS) {
      timers.current.push(
        setTimeout(() => {
          if (s === 2) clearInterval(scrambler);
          STAGE_SOUND[s]?.();
          setStage(s);
        }, at),
      );
    }
  };

  const view = stageView(stage);
  const copy = STAGE_COPY[stage];
  const seed = stage === 1 ? scramble : 7;

  return (
    <div
      className={`${styles.demo} ${big ? styles.big : ""}`} // --ps-h lets the featured card shrink on phones, where the compact layout is used
      style={{ height: big ? `var(--ps-h, ${height})` : height }}
    >
      <div className={styles.inner}>
        <div className={styles.file} aria-hidden="true">
          {view.showDoc && (
            <div className={styles.doc}>
              <div className={styles.docName}>visa_docs.pdf</div>
              <div className={styles.lines}>
                {LINE_WIDTHS.map((w, i) => (
                  <div
                    key={i}
                    className={styles.docLine}
                    style={{
                      width: w,
                      background: stage === 0 ? "#d8edff" : "transparent",
                    }}
                  >
                    {stage === 0 ? "" : hexLine(i, seed)}
                  </div>
                ))}
              </div>
              {view.locked && (
                <div className={styles.lock}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0d0d0d"
                    strokeWidth="2.5"
                  >
                    <rect x="5" y="11" width="14" height="10" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </div>
              )}
              {view.printed && <div className={styles.stamp}>Printed</div>}
            </div>
          )}
          {view.shredding && (
            <div className={styles.strips}>
              {LINE_WIDTHS.map((_, i) => (
                <div
                  key={i}
                  className={`${styles.strip} ${i % 2 ? styles.stripR : styles.stripL}`}
                  style={{ animationDelay: `${(i * 0.05).toFixed(2)}s` }}
                />
              ))}
            </div>
          )}
          {view.gone && <div className={styles.gone}>0 bytes</div>}
        </div>

        <div className={styles.copy}>
          <div className={styles.brand}>PrintSafe</div>
          <div className={styles.head} aria-live="polite">
            {copy.head}
          </div>
          <div className={styles.sub}>{copy.sub}</div>
          {view.showLink && (
            <div className={styles.link}>
              printsafe.in/v/3f9c2a1e
              <span className={styles.key}>#k=Zx7q…</span>
            </div>
          )}
          {view.showButton && (
            <button
              type="button"
              className={`${styles.button} va-press`}
              onClick={run}
            >
              {copy.button}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
