"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActive, useInterval } from "@/lib/hooks/useActive";
import { useReducedMotion } from "@/lib/hooks/useStores";
import { createGen, GEN_SIZE, GEN_STEPS, GEN_TARGETS, GEN_TICK_MS, genPixels, nextSample, stepGen } from "@/lib/engines/gen";
import { sfx } from "@/lib/sound";
import shared from "./Demos.module.css";
import styles from "./GenDemo.module.css";

export function GenDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const active = useActive(ref);
  const calm = useReducedMotion();
  const [engaged, setEngaged] = useState(false);
  const [state, setSt] = useState(createGen);
  // with reduced motion, show a finished sample until the visitor presses Generate
  const st = useMemo(() => (calm && !engaged ? { ...state, t: 0 } : state), [calm, engaged, state]);

  useInterval(
    () => {
      const out = stepGen(state);
      if (out.events.includes("done")) sfx.genDone();
      setSt(out.state);
    },
    active && (!calm || engaged) ? GEN_TICK_MS : null,
  );

  // paint the 16×16 sample; CSS scales it up with crisp pixels
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(GEN_SIZE, GEN_SIZE);
    genPixels(st).forEach(([r, g, b], i) => {
      img.data.set([r, g, b, 255], i * 4);
    });
    ctx.putImageData(img, 0, 0);
  }, [st]);

  const target = GEN_TARGETS[st.cls];
  const done = st.t === 0;

  return (
    <div ref={ref} className={styles.demo}>
      <canvas
        ref={canvas}
        width={GEN_SIZE}
        height={GEN_SIZE}
        className={`${styles.canvas} pixelated`}
        role="img"
        aria-label={done ? `Generated pixel image of ${target.label}` : "Noise gradually resolving into an image"}
      />
      <div className={styles.side}>
        <div className={styles.step}>{done ? `Sample #${st.seed} · done` : `Denoising step ${GEN_STEPS - st.t}/${GEN_STEPS}`}</div>
        <div className={styles.progress} aria-hidden="true">
          <div style={{ width: `${Math.round((1 - st.t / GEN_STEPS) * 100)}%` }} />
        </div>
        <div className={styles.title}>{done ? target.title : "From pure noise…"}</div>
        <div className={styles.note}>Real defects are rare. The platform makes labelled synthetic ones to train on.</div>
        <button
          type="button"
          className={`${shared.btn} va-press`}
          style={{ alignSelf: "flex-start", marginTop: "auto" }}
          onClick={() => {
            sfx.genClick();
            setEngaged(true);
            setSt((s) => nextSample(s));
          }}
        >
          Generate
        </button>
      </div>
    </div>
  );
}
