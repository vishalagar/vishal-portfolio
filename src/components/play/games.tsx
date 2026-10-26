"use client";

import dynamic from "next/dynamic";
import { useRef, type ComponentType } from "react";
import type { GameId } from "@/content/worlds";
import { useInView } from "@/lib/hooks/useActive";
import type { GameProps } from "@/lib/play/pad";
import styles from "./Play.module.css";

function Warmup() {
  return (
    <div className={styles.warmup} aria-label="Loading the game">
      <span>Warming up…</span>
    </div>
  );
}

/** Every game is its own client chunk, loaded only when a card nears the screen or Play is pressed. */
export const GAMES: Record<GameId, ComponentType<GameProps>> = {
  football: dynamic(() => import("@/components/demos/football/FootballGame").then((m) => m.FootballGame), {
    ssr: false,
    loading: Warmup,
  }),
  race: dynamic(() => import("@/components/demos/race/RaceGame").then((m) => m.RaceGame), {
    ssr: false,
    loading: Warmup,
  }),
  pace: dynamic(() => import("@/components/demos/pace/PaceGame").then((m) => m.PaceGame), {
    ssr: false,
    loading: Warmup,
  }),
  label: dynamic(() => import("@/components/demos/label/LabelRushGame").then((m) => m.LabelRushGame), {
    ssr: false,
    loading: Warmup,
  }),
  snake: dynamic(() => import("@/components/demos/SnakeDemo").then((m) => m.SnakeDemo), {
    ssr: false,
    loading: Warmup,
  }),
};

/** A game on a card: its code only loads once the card is close to the viewport. */
export function LazyGame({ game, ...props }: GameProps & { game: GameId }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { rootMargin: "600px", once: true });
  const Game = GAMES[game];
  return (
    <div ref={ref} className={styles.lazy}>
      {near ? <Game {...props} /> : <Warmup />}
    </div>
  );
}
