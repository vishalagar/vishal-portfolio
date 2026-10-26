"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { botInput, clock, createPace, fmtPace, stepPace, TARGET, TICK_MS, verdict, type PaceEvent, type PaceInput, type PaceState } from "@/lib/engines/pace";
import { mathRng } from "@/lib/engines/rng";
import { useActive } from "@/lib/hooks/useActive";
import { usePalette, useReducedMotion } from "@/lib/hooks/useStores";
import { EMPTY_PAD, type GameProps, type Pad } from "@/lib/play/pad";
import { paceSfx } from "@/lib/sound/pace";
import { drawPace, frameScale, type Fonts } from "./drawPace";
import styles from "./PaceGame.module.css";

/** After the bot finishes it rests this many ticks, then runs again. */
const BOT_REST_TICKS = 150;
const MAX_CATCH_UP_MS = 250;
const IDLE: PaceInput = { step: null, lane: 0 };

interface Sim {
  state: PaceState;
  prevPad: Pad;
}

interface Result {
  /** Which run this belongs to (mode + playKey), so a restart from outside hides it. */
  run: string;
  onTarget: number;
  time: string;
  verdict: string;
}

const fresh = (human: boolean): Sim => ({ state: createPace(human ? "human" : "bot", mathRng), prevPad: EMPTY_PAD });

/** Left foot = Left or A, right foot = Right or B (rising edges only); up/down change lane. */
function humanInput(pad: Pad, prev: Pad): PaceInput {
  const left = (pad.left && !prev.left) || (pad.a && !prev.a);
  const right = (pad.right && !prev.right) || (pad.b && !prev.b);
  return { step: left ? "L" : right ? "R" : null, lane: ((pad.down && !prev.down ? 1 : 0) - (pad.up && !prev.up ? 1 : 0)) as -1 | 0 | 1 };
}

function playSounds(events: readonly PaceEvent[], step: number) {
  for (const e of events) {
    if (e.type === "step" && step % 2 === 0) paceSfx.footstep();
    else if (e.type === "water") paceSfx.water();
    else if (e.type === "km") (e.onPace ? paceSfx.kmGood : paceSfx.kmBad)();
    else if (e.type === "finish") paceSfx.finish();
  }
}

export function PaceGame({ mode, pad, playKey = 0, height = "360px" }: GameProps) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const againBtn = useRef<HTMLButtonElement>(null);
  const active = useActive(root);
  const calm = useReducedMotion();
  const palette = usePalette();
  const human = mode === "play";
  // reduced motion: the pacer waits for the visitor, only a played run moves
  const running = active && (human || !calm);

  const sim = useRef<Sim>(fresh(human));
  const padRef = useRef<Pad>(EMPTY_PAD);
  const box = useRef({ w: 0, h: 0, dpr: 1 });
  const fonts = useRef<Fonts>({ pixel: "monospace", display: "sans-serif" });
  const [done, setResult] = useState<Result | null>(null);
  const [said, setAnnounce] = useState<{ run: string; text: string } | null>(null);
  const run = `${mode}-${playKey}`;
  const result = done?.run === run ? done : null;
  const announce = said?.run === run ? said.text : "";

  useEffect(() => {
    padRef.current = pad ?? EMPTY_PAD;
  }, [pad]);

  const paint = useCallback(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    const { w, h, dpr } = box.current;
    if (!el || !ctx || !w || !h) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPace(ctx, sim.current.state, { w, h, k: frameScale(w, h), fonts: fonts.current, pal: palette, human });
  }, [palette, human]);

  // restart whenever the mode flips or the overlay asks for a new run
  useEffect(() => {
    sim.current = fresh(human);
    paint();
  }, [human, playKey, paint]);

  // size the canvas to its box, crisp on high-DPR screens
  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const style = getComputedStyle(el);
    fonts.current = {
      pixel: style.getPropertyValue("--pixel").trim() || "monospace",
      display: style.getPropertyValue("--display").trim() || "sans-serif",
    };
    const fit = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      box.current = { w: r.width, h: r.height, dpr };
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      paint();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [paint]);

  const restart = useCallback(() => {
    sim.current = fresh(human);
    setResult(null);
    setAnnounce(null);
  }, [human]);

  useEffect(() => {
    if (!running) {
      paint();
      return;
    }
    let raf = 0;
    let last: number | null = null;
    let acc = 0;
    const tick = () => {
      const { state, prevPad } = sim.current;
      const p = padRef.current;
      if (state.phase === "over") {
        if (human) {
          if (p.a && !prevPad.a) restart();
          else sim.current = { state, prevPad: p };
        } else if (state.t > BOT_REST_TICKS) restart();
        else sim.current = { state: stepPace(state, IDLE).state, prevPad };
        return;
      }
      const input = human ? humanInput(p, prevPad) : botInput(state);
      const out = stepPace(state, input);
      sim.current = { state: out.state, prevPad: p };
      if (!human) return;
      playSounds(out.events, out.state.me.step);
      const km = out.events.find((e) => e.type === "km");
      if (km?.type === "km") setAnnounce({ run, text: `${km.onPace ? "On pace" : km.tooFast ? "Too fast" : "Too slow"}, km ${km.km}, ${fmtPace(km.split)} per km` });
      if (out.events.some((e) => e.type === "finish")) {
        const s = out.state;
        setResult({ run, onTarget: s.onTarget, time: clock(s.ticks), verdict: verdict(s) });
      }
    };
    const frame = (now: number) => {
      acc += last === null ? 0 : Math.min(now - last, MAX_CATCH_UP_MS);
      last = now;
      while (acc >= TICK_MS) {
        tick();
        acc -= TICK_MS;
      }
      paint();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, human, run, restart, paint]);

  useEffect(() => {
    if (result) againBtn.current?.focus({ preventScroll: true });
  }, [result]);

  const label = human
    ? `PaceCoach pace run. Alternate left and right to run, up and down to change lane. Hold ${fmtPace(TARGET)} per km.`
    : `PaceCoach pace run demo: the pacer holds ${fmtPace(TARGET)} per km.`;

  return (
    <div ref={root} className={styles.game} style={{ height }} data-game="pace">
      <canvas ref={canvas} className={styles.canvas} role="img" aria-label={label} />
      <div className={styles.sr} aria-live="polite">
        {announce}
      </div>
      {human && result && (
        <div className={styles.over} role="dialog" aria-label="Finish line">
          <div className={styles.kicker}>Finish line · 21.097 km</div>
          <div className={styles.big}>{result.onTarget} / 21 km on pace</div>
          <div className={styles.time}>
            {result.time} · target {fmtPace(TARGET)} /km
          </div>
          <div className={styles.verdict}>{result.verdict}</div>
          <button ref={againBtn} type="button" className={styles.again} onClick={restart}>
            Run it again
          </button>
          <div className={styles.hint}>A: run it again · Exit: back to the page</div>
        </div>
      )}
    </div>
  );
}
