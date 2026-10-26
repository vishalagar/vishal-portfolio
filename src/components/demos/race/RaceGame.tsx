"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActive, usePageVisible } from "@/lib/hooks/useActive";
import { usePalette, useReducedMotion } from "@/lib/hooks/useStores";
import { mathRng } from "@/lib/engines/rng";
import {
  CARS,
  createRace,
  LAPS,
  lapOf,
  NO_INPUT,
  PLAYER_NAME,
  stepRaceTick,
  TICK_MS,
  verdict,
  type RaceEvent,
  type RaceInput,
  type RaceState,
} from "@/lib/engines/race";
import { EMPTY_PAD, type GameProps, type Pad } from "@/lib/play/pad";
import { raceSfx } from "@/lib/sound/race";
import { drawRace } from "./draw";
import styles from "./RaceGame.module.css";

/** Never simulate more than this many ticks in one frame (tab was throttled). */
const MAX_CATCH_UP = 5;

interface Result {
  pos: number;
  order: string[];
}

interface PadEdge {
  a: boolean;
}

function playSounds(events: readonly RaceEvent[]): void {
  for (const e of events) {
    if (e === "light") raceSfx.light();
    else if (e === "go") raceSfx.go();
    else if (e === "drs") raceSfx.drs();
    else if (e === "contact") raceSfx.contact();
    else if (e === "lap") raceSfx.lap();
    else if (e === "overtake") raceSfx.overtake();
    else if (e === "finish") raceSfx.finish();
  }
}

/** Pad to race input; `drs` fires on the press, not while held. */
function inputFromPad(pad: Pad, prev: PadEdge): RaceInput {
  return { steer: (pad.right ? 1 : 0) - (pad.left ? 1 : 0), brake: pad.b || pad.down, drs: pad.a && !prev.a };
}

export function RaceGame({ mode, pad, playKey = 0, height = "360px" }: GameProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<RaceState>(createRace(mode));
  const padRef = useRef<Pad>(pad ?? EMPTY_PAD);
  const edge = useRef<PadEdge>({ a: false });
  const size = useRef({ w: 0, h: 0 });
  const fonts = useRef({ pixel: "monospace", display: "sans-serif" });
  const palette = usePalette();
  const paletteRef = useRef(palette);
  const active = useActive(wrap);
  const visible = usePageVisible();
  const calm = useReducedMotion();
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState("");
  const [box, setBox] = useState({ w: 0, h: 0 });
  const human = mode === "play";
  // with reduced motion the bot doesn't race on its own; only the visitor's race runs
  const running = visible && (human || (active && !calm));

  useEffect(() => {
    padRef.current = pad ?? EMPTY_PAD;
  }, [pad]);
  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  const paint = useCallback(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    const { w, h } = size.current;
    if (!el || !ctx || w === 0) return;
    const dpr = el.width / w;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawRace(ctx, game.current, { width: w, height: h, palette: paletteRef.current, fonts: fonts.current, human: game.current.mode === "play" });
  }, []);

  /** Size the canvas to its box with devicePixelRatio so it stays crisp at any width. */
  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const style = getComputedStyle(el);
    fonts.current = {
      pixel: style.getPropertyValue("--pixel").trim() || "monospace",
      display: style.getPropertyValue("--display").trim() || "sans-serif",
    };
    const fit = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      size.current = { w: r.width, h: r.height };
      cv.width = Math.max(1, Math.round(r.width * dpr));
      cv.height = Math.max(1, Math.round(r.height * dpr));
      setBox({ w: r.width, h: r.height });
      paint();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [paint]);

  const resetGame = useCallback(() => {
    game.current = createRace(mode);
    edge.current = { a: padRef.current.a };
    paint();
  }, [mode, paint]);
  const restart = useCallback(() => {
    resetGame();
    setResult(null);
    setStatus("");
  }, [resetGame]);

  // a new playKey or mode starts a fresh race (the result UI is cleared during render, below)
  const raceId = `${mode}:${playKey}`;
  const [seenId, setSeenId] = useState(raceId);
  if (seenId !== raceId) {
    setSeenId(raceId);
    setResult(null);
    setStatus("");
  }
  useEffect(() => {
    resetGame();
  }, [resetGame, playKey]);

  // repaint when the theme/world or box changes while no loop is running
  useEffect(() => {
    paint();
  }, [palette, box, running, paint]);

  useEffect(() => {
    if (!running) {
      raceSfx.stopEngine();
      return;
    }
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const advance = () => {
      const prev = game.current;
      const input = human ? inputFromPad(padRef.current, edge.current) : NO_INPUT;
      edge.current = { a: padRef.current.a };
      if (human && prev.phase === "over") {
        if (input.drs) restart();
        else game.current = stepRaceTick(prev, input, mathRng);
        return;
      }
      const next = stepRaceTick(prev, input, mathRng);
      game.current = next;
      if (human) playSounds(next.events);
      if (human && next.phase === "over" && prev.phase !== "over") {
        setResult({ pos: next.finishPos, order: next.finishOrder });
        setStatus(`Chequered flag. You finished P${next.finishPos} of ${CARS}.`);
      } else if (human && next.phase === "race" && (next.position !== prev.position || lapOf(next) !== lapOf(prev))) {
        setStatus(`Position ${next.position} of ${CARS}, lap ${lapOf(next)} of ${LAPS}`);
      }
    };
    const frame = (now: number) => {
      acc += Math.min(100, now - last);
      last = now;
      let n = 0;
      while (acc >= TICK_MS && n < MAX_CATCH_UP) {
        advance();
        acc -= TICK_MS;
        n++;
      }
      if (n === MAX_CATCH_UP) acc = 0;
      if (human) raceSfx.engine(game.current.phase === "race" ? game.current.me.speed : 0, game.current.me.boost > 0);
      paint();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      raceSfx.stopEngine();
    };
  }, [running, human, paint, restart]);

  return (
    <div ref={wrap} className={styles.game} style={{ height }} data-game="race">
      <canvas
        ref={canvas}
        className={styles.canvas}
        role="img"
        aria-label="Grand Prix, top-down. Detection boxes track all eight cars. You start last in car 4 and race three laps."
      />
      {!human && calm && <span className={styles.note}>Paused. Choose play to race.</span>}
      <span className={styles.sr} role="status" aria-live="polite">
        {status}
      </span>
      {human && result && (
        <div className={styles.over} role="dialog" aria-label="Race result">
          <div className={styles.kicker}>Chequered flag</div>
          <div className={styles.title}>
            P{result.pos} of {CARS}
          </div>
          <div className={styles.verdict}>{verdict(result.pos)}</div>
          <ol className={styles.order} aria-label="Finishing order">
            {result.order.map((n) => (
              <li key={n} className={n === PLAYER_NAME ? styles.you : undefined}>
                {n}
              </li>
            ))}
          </ol>
          <button type="button" className={`${styles.again} va-press`} onClick={restart}>
            Race again
          </button>
        </div>
      )}
    </div>
  );
}
