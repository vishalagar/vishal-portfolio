"use client";

import { useEffect, useRef } from "react";
import { shotPower, type MatchState } from "@/lib/engines/football";
import { useActive } from "@/lib/hooks/useActive";
import { useReducedMotion } from "@/lib/hooks/useStores";
import { EMPTY_PAD, type GameProps } from "@/lib/play/pad";
import { useMatch } from "./useMatch";
import styles from "./FootballGame.module.css";

const KIT = { A: "#2a50b8", B: "#e5432f" } as const;
/** Tracking box colour for the ball: not white, so it never blends into the pitch lines. */
const BALL_BOX = "#5ee7ff";

interface Actor {
  key: string;
  x: number;
  y: number;
  size: [number, number];
  fill: string;
  color: string;
  thick: boolean;
  label: string;
}

function actors(g: MatchState, accent: string): Actor[] {
  const human = g.mode === "human";
  const list: Actor[] = g.players.map((p, i) => {
    const you = human && i === g.active;
    const gk = p.role === "gk";
    return {
      key: `p${i}`,
      x: p.x,
      y: p.y,
      size: [12, 16],
      fill: gk ? (p.team === "A" ? "#3ddc97" : "#ff8a3d") : KIT[p.team],
      color: you ? accent : p.team === "A" ? "#cfe0f5" : "#ffb4a6",
      thick: you,
      label: you ? `you · ${p.num}` : gk ? "gk" : `id ${p.num}`,
    };
  });
  const bx = Math.max(0, Math.min(100, g.ball.x));
  const by = Math.max(0, Math.min(50, g.ball.y));
  return [...list, { key: "ball", x: bx, y: by, size: [11, 11], fill: "#ffffff", color: BALL_BOX, thick: false, label: "ball" }];
}

function status(g: MatchState): string {
  const owner = g.ball.owner === null ? null : g.players[g.ball.owner];
  if (!owner) return "loose ball";
  if (owner.team === "B") return "CPU on the ball";
  return g.mode === "human" ? "your ball" : "VA on the ball";
}

/**
 * The 2v2 match. attract: the bots play on the card. play: you are #4 in the Play overlay,
 * driven by the shared pad (keyboard in the theatre, on-screen buttons on a phone).
 * A new match starts whenever the mode or playKey changes.
 */
export function FootballGame(props: GameProps) {
  return <Match key={`${props.mode}-${props.playKey ?? 0}`} {...props} />;
}

function Match({ mode, pad = EMPTY_PAD, height = "360px" }: GameProps) {
  const root = useRef<HTMLDivElement>(null);
  const active = useActive(root);
  const calm = useReducedMotion();
  const human = mode === "play";
  const padRef = useRef(pad);
  useEffect(() => {
    padRef.current = pad;
  }, [pad]);
  // with reduced motion the bots don't play on their own; the match runs once the visitor presses Play
  const { g, charge } = useMatch(active && (human || !calm), human, padRef);
  const accent = "var(--accent)";
  const me = g.players[g.active];
  const minute = Math.min(90, Math.floor(g.tick / 30));
  const flash = g.flash && !g.over ? g.flash : null;
  const big = flash?.text === "Goal";
  const diff = g.score.A - g.score.B;

  return (
    <div
      ref={root}
      className={styles.game}
      style={{ height }}
      data-game="football"
      role="group"
      aria-label={
        human
          ? "Your match: you are #4 in blue, with #9, against the CPU in red."
          : "Bots playing a 2v2 match, every player tracked with a detection box."
      }
    >
      <div className={styles.lines} aria-hidden="true">
        <div className={styles.halfway} />
        <div className={styles.centre} />
        <div className={`${styles.box} ${styles.boxR}`} />
        <div className={`${styles.box} ${styles.boxL}`} />
        <div className={`${styles.goal} ${styles.goalR}`} />
        <div className={`${styles.goal} ${styles.goalL}`} />
      </div>

      <div className={styles.actors} aria-hidden="true">
        {actors(g, accent).map((a) => {
          const [w, h] = a.size;
          return (
            <div key={a.key} className={styles.actor} style={{ left: `${a.x}%`, top: `${(a.y / 50) * 100}%` }}>
              <div className={a.key === "ball" ? `${styles.body} ${styles.ball}` : styles.body} style={{ left: -w / 2, top: -h / 2, width: w, height: h, background: a.fill }} />
              <div
                className={styles.bbox}
                style={{ left: -w / 2 - 5, top: -h / 2 - 5, width: w + 10, height: h + 10, border: `${a.thick ? 3 : 2}px solid ${a.color}` }}
              />
              <span className={styles.tag} style={{ left: -w / 2 - 5, top: -h / 2 - 18, background: a.color }}>
                {a.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.hud}>
        <div className={styles.scoreline} aria-label={`VA ${g.score.A}, CPU ${g.score.B}, ${minute} minutes`}>
          <span className={styles.teamA}>VA</span>
          <span className={styles.score}>
            {g.score.A} – {g.score.B}
          </span>
          <span className={styles.teamB}>CPU</span>
          <span className={styles.minute}>{minute}&apos;</span>
        </div>
        <span className={styles.chipLine}>{status(g)}</span>
        {human && (
          <div className={styles.meter}>
            <span>stamina</span>
            <span className={styles.meterTrack}>
              <span style={{ width: `${Math.round((me?.stamina ?? 1) * 100)}%`, background: "#6fd08c" }} />
            </span>
          </div>
        )}
        {human && charge !== null && (
          <div className={styles.meter}>
            <span>power</span>
            <span className={styles.meterTrack}>
              <span style={{ width: `${Math.round(shotPower(charge) * 100)}%`, background: "#e5432f" }} />
            </span>
          </div>
        )}
      </div>

      {!human && <span className={`${styles.chipLine} ${styles.topRight}`}>{calm ? "Press play to kick off" : "Bots playing · YOLOv8n tracking"}</span>}

      {flash && (
        <div
          className={styles.flash}
          aria-live={human ? "polite" : undefined}
          style={{ fontSize: big ? 72 : flash.text.length > 12 ? 26 : 36, color: big ? accent : "#eef3ea" }}
        >
          {flash.text}
        </div>
      )}

      {human && g.over && (
        <div className={styles.fullTime} role="status" aria-label="Full time">
          <div className={styles.ftKicker}>Full time</div>
          <div className={styles.ftScore}>
            VA {g.score.A} – {g.score.B} CPU
          </div>
          <div className={styles.ftResult}>{diff > 0 ? "You win." : diff < 0 ? "The CPU wins this one." : "A draw."}</div>
          <div className={styles.ftHint}>A / Space: play again · Exit: back to the page</div>
        </div>
      )}
    </div>
  );
}
