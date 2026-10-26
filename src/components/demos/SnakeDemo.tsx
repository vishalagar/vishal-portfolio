"use client";

import { useEffect, useRef, useState } from "react";
import { pressed } from "@/components/play/padSources";
import { useActive, useInterval } from "@/lib/hooks/useActive";
import { useReducedMotion } from "@/lib/hooks/useStores";
import { mathRng } from "@/lib/engines/rng";
import { createSnake, GRID_H, GRID_W, SNAKE_TICK_MS, steer, stepSnake, type Cell, type SnakeState } from "@/lib/engines/snake";
import { EMPTY_PAD, type GameProps, type Pad } from "@/lib/play/pad";
import { sfx } from "@/lib/sound";
import shared from "./Demos.module.css";
import styles from "./SnakeDemo.module.css";

/** The pad is checked this often so a quick tap between snake ticks still turns. */
const PAD_POLL_MS = 30;

const TURNS: ReadonlyArray<{ key: "up" | "down" | "left" | "right"; d: Cell }> = [
  { key: "up", d: [0, -1] },
  { key: "down", d: [0, 1] },
  { key: "left", d: [-1, 0] },
  { key: "right", d: [1, 0] },
];

/** The turn for a direction pressed since the last check, if any. */
function padTurn(pad: Pad, prev: Pad): Cell | null {
  return TURNS.find((t) => pressed(pad, prev, t.key))?.d ?? null;
}

function cellColor(x: number, y: number, body: Map<string, number>, food: Cell): string {
  const i = body.get(`${x},${y}`);
  if (i === 0) return "#c4f5a8";
  if (i !== undefined) return i % 2 ? "#4fae5a" : "#45a050";
  if (x === food[0] && y === food[1]) return "#e5432f";
  return (x + y) % 2 ? "#0f2418" : "#0c1f14";
}

const bestOf = (st: SnakeState) => Math.max(st.best, st.score);

/**
 * Snake DQN. attract: the bot plays on the card. play: the visitor steers with the shared pad in the
 * Play overlay; A plays again after a crash. A new run starts when mode or playKey changes (best is kept).
 */
export function SnakeDemo({ mode, pad = EMPTY_PAD, playKey = 0, height = "220px" }: GameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useActive(ref);
  const calm = useReducedMotion();
  const human = mode === "play";
  const runKey = `${mode}-${playKey}`;
  const [run, setRun] = useState(() => ({ runKey, st: createSnake(human ? "human" : "ai", 0) }));
  if (run.runKey !== runKey) setRun({ runKey, st: createSnake(human ? "human" : "ai", bestOf(run.st)) });
  const st = run.st;
  const update = (fn: (s: SnakeState) => SnakeState) => setRun((r) => ({ ...r, st: fn(r.st) }));

  const padRef = useRef(pad);
  const prevPad = useRef<Pad>(EMPTY_PAD);
  useEffect(() => {
    padRef.current = pad;
  }, [pad]);

  // with reduced motion the bot doesn't play on its own; only the visitor's game runs
  const running = active && st.mode !== "over" && (!calm || st.mode === "human");
  useInterval(
    () => {
      const out = stepSnake(st, mathRng);
      if (out.events.includes("eat") && st.mode === "human") sfx.snakeEat();
      if (out.events.includes("over")) sfx.snakeOver();
      update(() => out.state);
    },
    running ? SNAKE_TICK_MS : null,
  );

  useInterval(
    () => {
      const p = padRef.current;
      const prev = prevPad.current;
      prevPad.current = p;
      if (st.mode === "over") {
        if (pressed(p, prev, "a")) {
          sfx.snakeStart();
          update((s) => createSnake("human", bestOf(s)));
        }
        return;
      }
      const d = padTurn(p, prev);
      if (d) update((s) => steer(s, d));
    },
    human && active ? PAD_POLL_MS : null,
  );

  const body = new Map(st.snake.map(([x, y], i) => [`${x},${y}`, i]));
  const cells: string[] = [];
  for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) cells.push(cellColor(x, y, body, st.food));

  return (
    <div
      ref={ref}
      className={styles.demo}
      style={{ height }}
      data-game="snake"
      role="group"
      aria-label={human ? "Snake: you steer, eat the red food, don't hit the walls or yourself." : "Snake: the bot is playing."}
    >
      <div className={styles.grid} aria-hidden="true">
        {cells.map((bg, i) => (
          <div key={i} style={{ background: bg }} />
        ))}
      </div>

      <div className={styles.hud}>
        <span className={shared.badge}>
          {st.mode === "ai" ? "Bot playing" : "You"} · {st.score}
        </span>
        <span className={shared.badge}>best {bestOf(st)}</span>
      </div>

      {st.mode === "over" && (
        <div className={shared.overlay} role="status" aria-label="Game over">
          <div className={shared.overlayKicker}>Full time</div>
          <div className={shared.overlayTitle}>You scored {st.last}</div>
          <div className={styles.hint}>A / Space: play again · Exit: back to the page</div>
        </div>
      )}
    </div>
  );
}
