"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createLabelRush,
  GATE,
  inGate,
  LABEL_TICK_MS,
  overKicker,
  RETRAIN_EVERY,
  stepBot,
  stepLabelRush,
  stepOver,
  type Chip,
  type LabelEvent,
  type LabelState,
  type Verdict,
} from "@/lib/engines/labelrush";
import { mathRng } from "@/lib/engines/rng";
import { useActive, useInterval } from "@/lib/hooks/useActive";
import { useReducedMotion } from "@/lib/hooks/useStores";
import { EMPTY_PAD, type GameProps, type Pad } from "@/lib/play/pad";
import { labelSfx } from "@/lib/sound/label";
import styles from "./LabelRushGame.module.css";

const CYAN = "#2de2e6";
const PINK = "#ff2a6d";
const VIOLET = "#7a4dff";
const YELLOW = "#ffd400";
const SOFT = "#b2a8dc";

function playSounds(events: readonly LabelEvent[], human: boolean) {
  if (!human) return;
  events.forEach((e) => {
    if (e === "good") labelSfx.correct();
    else if (e === "bad") labelSfx.wrong();
    else if (e === "retrain") labelSfx.retrain();
    else labelSfx.gameOver();
  });
}

interface ChipView {
  id: number;
  left: string;
  crack: boolean;
  box: string;
  label: string;
}

function chipView(c: Chip): ChipView {
  const kind = c.crack ? "crack" : "clean";
  let box = SOFT;
  let label = `${c.guess ? "crack" : "clean"} ${c.conf.toFixed(2)}?`;
  if (c.result === "ok") {
    box = CYAN;
    label = `${kind} · labelled`;
  } else if (c.result === "auto") {
    box = VIOLET;
    label = `${kind} ${c.conf.toFixed(2)}`;
  } else if (c.result === "wrong") {
    box = PINK;
    label = c.crack ? "missed crack" : "not a crack";
  } else if (inGate(c)) {
    box = YELLOW;
  }
  return { id: c.id, left: `${c.x.toFixed(2)}%`, crack: c.crack, box, label };
}

/** A rising edge on the verdict buttons: A / ← = defect, B / → = clean. */
function padVerdict(pad: Pad, prev: Pad): { verdict: Verdict | null; again: boolean } {
  const defect = (pad.a && !prev.a) || (pad.left && !prev.left);
  const clean = (pad.b && !prev.b) || (pad.right && !prev.right);
  return { verdict: defect ? "defect" : clean ? "clean" : null, again: pad.a && !prev.a };
}

/** A new run whenever the mode flips or the overlay asks for a restart (the key remounts the run). */
export function LabelRushGame(props: GameProps) {
  return <LabelRun key={`${props.mode}-${props.playKey ?? 0}`} {...props} />;
}

function LabelRun({ mode, pad = EMPTY_PAD, height = "360px" }: GameProps) {
  const root = useRef<HTMLDivElement>(null);
  const active = useActive(root);
  const calm = useReducedMotion();
  const human = mode === "play";
  const [g, setG] = useState<LabelState>(createLabelRush);
  const game = useRef<LabelState>(g);
  const padRef = useRef<Pad>(pad);
  const prevPad = useRef<Pad>(pad);

  // keep the latest pad for the tick; the effect runs after render so the ref is never written during render
  useEffect(() => {
    padRef.current = pad;
  }, [pad]);

  const publish = useCallback((next: LabelState) => {
    game.current = next;
    setG(next);
  }, []);

  const tick = () => {
    const st = game.current;
    if (!human) {
      const out = stepBot(st, mathRng);
      publish(out.state);
      return;
    }
    const { verdict, again } = padVerdict(padRef.current, prevPad.current);
    prevPad.current = padRef.current;
    if (st.phase === "over") {
      publish(again ? createLabelRush() : stepOver(st));
      return;
    }
    const out = stepLabelRush(st, verdict, mathRng);
    playSounds(out.events, true);
    publish(out.state);
  };

  // with reduced motion the bot doesn't play on its own; the visitor's game always runs
  const running = active && (human || !calm);
  useInterval(tick, running ? LABEL_TICK_MS : null);

  const flash = g.flash && g.phase !== "over" ? g.flash : null;
  const gateLeft = GATE[0] - 3;
  const gateWidth = GATE[1] - GATE[0] + 6;
  const overOn = g.phase === "over" && human;

  return (
    <div
      ref={root}
      className={styles.game}
      style={{ height }}
      data-game="label"
      role="img"
      aria-label={human ? "Label Rush: label MLCC chips as crack or clean before the model guesses" : "Label Rush: a bot labelling chips"}
    >
      <div className={styles.grid} style={{ backgroundPosition: `${(g.t * 2) % 36}px 0` }} aria-hidden="true" />
      <div className={styles.sky} aria-hidden="true" />
      <div className={styles.belt} style={{ backgroundPosition: `${Math.round((g.t * g.speed * 12) % 32)}px 0` }} aria-hidden="true" />

      <div className={styles.gate} style={{ left: `${gateLeft}%`, width: `${gateWidth}%` }} aria-hidden="true">
        <span className={styles.laser} style={{ top: `${Math.round(50 + Math.sin(g.t / 6) * 45)}%` }} />
        <span className={styles.gateTag}>scan zone</span>
      </div>

      <div className={styles.chips} aria-hidden="true">
        {g.chips.map(chipView).map((c) => (
          <div key={c.id} className={styles.chip} style={{ left: c.left, ["--box" as string]: c.box }}>
            <div className={styles.body}>
              <span className={`${styles.cap} ${styles.capL}`} />
              <span className={`${styles.cap} ${styles.capR}`} />
              <span className={styles.ceramic} />
              {c.crack && <span className={styles.crack} />}
            </div>
            <div className={styles.box} />
            <span className={styles.tag}>{c.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.hud}>
        <div className={styles.model}>
          <span className={styles.modelName}>defect-yolo v{g.version}</span>
          <span className={styles.modelAcc}>acc {Math.round(g.acc * 100)}%</span>
        </div>
        <span className={styles.stats}>
          labels {g.labels} · score {g.score} · lives {g.lives}
        </span>
        <div className={styles.retrain}>
          <span>next retrain</span>
          <span className={styles.retrainBar}>
            <span className={styles.retrainFill} style={{ width: `${Math.round((g.sinceRetrain / RETRAIN_EVERY) * 100)}%` }} />
          </span>
        </div>
      </div>

      <div className={styles.keys}>
        <span className={styles.keyA}>A · defect</span>
        <span className={styles.keyB}>B · clean</span>
      </div>

      {!human && <span className={styles.auto}>Auto-labelling · human in the loop off</span>}

      {flash && (
        <div className={`${styles.flash} ${flash.tone === "red" ? styles.flashRed : ""}`} aria-live="polite">
          {flash.text}
        </div>
      )}

      {overOn && (
        <div className={styles.over} role="dialog" aria-label="Game over">
          <div className={styles.overKicker}>{overKicker(g)}</div>
          <div className={styles.overTitle}>
            v{g.version} · acc {Math.round(g.acc * 100)}%
          </div>
          <div className={styles.overScore}>
            {g.score} pts · {g.labels} labels
          </div>
          <div className={styles.overHint}>A: new batch · Exit: back to the page</div>
        </div>
      )}
    </div>
  );
}
