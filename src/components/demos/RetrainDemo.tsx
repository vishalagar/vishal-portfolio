"use client";

import { useRef, useState } from "react";
import { useActive, useInterval } from "@/lib/hooks/useActive";
import { useReducedMotion } from "@/lib/hooks/useStores";
import { createRetrain, injectDrift, RETRAIN_THRESHOLD, RETRAIN_TICK_MS, stageLabels, stepRetrain } from "@/lib/engines/retrain";
import { mathRng } from "@/lib/engines/rng";
import { sfx } from "@/lib/sound";
import shared from "./Demos.module.css";
import styles from "./RetrainDemo.module.css";

const CHART_PX = 76;
/** Screen readers hear phase changes only, not every accuracy tick. */
const PHASE_ANNOUNCEMENT = {
  serving: "Model serving.",
  alert: "Accuracy dropped below the threshold.",
  pipeline: "Retraining on its own.",
  deployed: "New version deployed.",
} as const;

function barHeight(v: number): number {
  return Math.round(Math.max(0, Math.min(1, (v - 0.8) / 0.18)) * CHART_PX + 2);
}

export function RetrainDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const active = useActive(ref);
  const calm = useReducedMotion();
  const [engaged, setEngaged] = useState(false);
  const [st, setSt] = useState(createRetrain);

  useInterval(
    () => {
      const out = stepRetrain(st, mathRng);
      if (out.events.includes("alert")) sfx.retrainAlert();
      if (out.events.includes("deploy")) sfx.retrainDeploy();
      setSt(out.state);
    },
    // with reduced motion it waits for "Inject drift" instead of drifting on its own
    active && (!calm || engaged) ? RETRAIN_TICK_MS : null,
  );

  const last = st.acc[st.acc.length - 1];
  const busy = st.phase !== "serving";
  const labels = stageLabels(st);
  const status = {
    serving: { text: `Serving · acc ${last.toFixed(3)}`, color: "#93a4b5" },
    alert: { text: `Drop detected · ${last.toFixed(3)} < ${RETRAIN_THRESHOLD}`, color: "#ff6b57" },
    pipeline: { text: "Retraining on its own", color: "var(--accent)" },
    deployed: { text: `Deployed v${st.version} · acc ${last.toFixed(3)}`, color: "#6fd08c" },
  }[st.phase];

  return (
    <div ref={ref} className={styles.demo}>
      <div className={styles.top}>
        <span className={styles.model}>defect-yolo v{st.version}</span>
        <span className={styles.status} style={{ color: status.color }}>
          {status.text}
        </span>
        <span className="sr-only" aria-live="polite">
          {PHASE_ANNOUNCEMENT[st.phase]}
        </span>
      </div>

      <div
        className={styles.chart}
        role="img"
        aria-label={`Model accuracy over time, currently ${last.toFixed(3)}. Retraining triggers below ${RETRAIN_THRESHOLD}.`}
      >
        {st.acc.map((v, i) => (
          <div key={i} className={styles.bar} style={{ height: barHeight(v), background: v < RETRAIN_THRESHOLD ? "#e5432f" : "#8fb0d9" }} />
        ))}
        <div className={styles.threshold} style={{ bottom: barHeight(RETRAIN_THRESHOLD) - 2 }} aria-hidden="true" />
        <span className={styles.thresholdLabel} style={{ bottom: barHeight(RETRAIN_THRESHOLD) + 1 }} aria-hidden="true">
          retrain below {RETRAIN_THRESHOLD}
        </span>
      </div>

      <div className={styles.bottom}>
        <ol className={styles.stages}>
          {labels.map((label, i) => {
            const done = st.stage > i;
            const now = st.phase === "pipeline" && st.stage === i;
            const color = done ? "#6fd08c" : now ? "var(--accent)" : "#93a4b5";
            return (
              <li key={i} className={styles.stage} style={{ color }}>
                <span
                  className={styles.dot}
                  style={{ background: done || now ? color : "transparent", borderColor: color, animation: now ? "va-pulse .6s steps(1) infinite" : "none" }}
                  aria-hidden="true"
                />
                <span className={styles.stageLabel}>{label}</span>
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          className={`${shared.btn} va-press`}
          disabled={busy}
          onClick={() => {
            sfx.retrainInject();
            setEngaged(true);
            setSt((s) => injectDrift(s));
          }}
        >
          Inject drift
        </button>
      </div>
    </div>
  );
}
