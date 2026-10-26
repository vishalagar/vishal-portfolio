"use client";

import type { MouseEvent, ReactNode } from "react";
import { GenDemo } from "@/components/demos/GenDemo";
import { PrintSafeDemo } from "@/components/demos/PrintSafeDemo";
import { RetrainDemo } from "@/components/demos/RetrainDemo";
import { ColorizeDemo, FireDemo } from "@/components/demos/StaticDemos";
import { LazyGame } from "@/components/play/games";
import { PlayOverlay } from "@/components/play/PlayOverlay";
import { playStore, usePlaySession } from "@/components/play/playStore";
import { CheckIcon } from "@/components/sprite/PixelBall";
import { PACECOACH, PROJECTS, SPORTS_DETECTION, SQUAD, type DemoKind, type Project } from "@/content/projects";
import { worldMinute, type FeaturedId, type GameId, type World } from "@/content/worlds";
import { useWorld } from "@/lib/hooks/useStores";
import { sfx } from "@/lib/sound";
import styles from "./Highlights.module.css";

const GAME_H = "360px";
const CARD_GAME_H = "220px";

/** The card a world's game belongs to, in the shape both featured cards use (worlds-spec §7). */
interface CardInfo {
  min: string;
  title: string;
  /** Lines of copy, first one in full ink. */
  lines: readonly string[];
  checks: readonly string[];
  stack: readonly string[];
  href: string;
  cta: string;
}

const byKind = (kind: DemoKind): Project => {
  const p = PROJECTS.find((x) => x.kind === kind);
  if (!p) throw new Error(`Missing project: ${kind}`);
  return p;
};

/** Grid projects that are also a world's featured card, so they aren't shown twice. */
const FEATURED_KIND: Partial<Record<FeaturedId, DemoKind>> = { snake: "snake", retrain: "retrain" };

/** "Ask the Pundit" becomes "Ask the Race Engineer", "Ask the Coach"… */
function worldCta(cta: string, world: World): string {
  return cta === "Ask the Pundit" ? `Ask the ${world.assistant}` : cta;
}

/** The project's opening sentence: the world's game blurb follows it on the card. */
function firstSentence(text: string): string {
  const m = /^.*?[.!?](?=\s|$)/.exec(text);
  return m ? m[0] : text;
}

function featuredCard(world: World): CardInfo {
  const lines = (line: string) => [line, world.game.blurb];
  if (world.featured === "sports" || world.featured === "pacecoach") {
    const f = world.featured === "sports" ? SPORTS_DETECTION : PACECOACH;
    return { ...f, lines: lines(f.line) };
  }
  const p = byKind(world.featured);
  return {
    min: p.min,
    title: p.title,
    lines: lines(firstSentence(p.blurb)),
    checks: p.checks,
    stack: p.stack,
    href: p.href,
    cta: worldCta(p.cta, world),
  };
}

function minuteLabel(world: World, min: string): string {
  return world.id === "football" ? `Minute ${min}` : worldMinute(world.id, min);
}

function isExternal(href: string): boolean {
  return href.startsWith("http");
}

function CardLink({ href, children }: { href: string; children: string }) {
  const ext = isExternal(href);
  return (
    <a href={href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
      {ext && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

function Checks({ title, checks }: { title: string; checks: readonly string[] }) {
  return (
    <div className={styles.checks}>
      <div className={`${styles.small} ${styles.checksTitle}`}>{title}</div>
      <ul className={styles.checkList}>
        {checks.map((c) => (
          <li key={c} className={styles.check}>
            <CheckIcon />
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stack({ items }: { items: readonly string[] }) {
  return (
    <ul className={styles.stack} aria-label="Stack">
      {items.map((s) => (
        <li key={s} className="chip">
          {s}
        </li>
      ))}
    </ul>
  );
}

function openPlay(game: GameId, e: MouseEvent<HTMLButtonElement>, sound: () => void) {
  sound();
  playStore.open(game, e.currentTarget);
}

/** Stands in for a game while it is open full screen, so only one copy runs. */
function OnTheBigScreen() {
  return (
    <div className={styles.away}>
      <span>Playing full screen</span>
    </div>
  );
}

/** A big two-column card: demo on the left, the story on the right. */
function FeatureCard({
  id,
  label,
  info,
  world,
  stage,
  detect,
}: {
  id: string;
  label: string;
  info: CardInfo;
  world: World;
  stage: ReactNode;
  detect: string;
}) {
  const [lead, ...rest] = info.lines;
  return (
    <article id={id} className={`${styles.motd} va-reveal`} aria-labelledby={`${id}-title`} data-detect={detect}>
      <div className={styles.motdGame}>{stage}</div>
      <div className={styles.motdInfo}>
        <div className={styles.minuteRow}>
          <span className={styles.minuteBadge} aria-label={minuteLabel(world, info.min)}>
            {worldMinute(world.id, info.min)}
          </span>
          <span className={styles.small}>{label}</span>
        </div>
        <h3 id={`${id}-title`} className={styles.motdTitle}>
          {info.title}
        </h3>
        <p className={rest.length ? styles.lead : styles.blurb}>{lead}</p>
        {rest.map((l) => (
          <p key={l} className={styles.blurb}>
            {l}
          </p>
        ))}
        <Checks title={world.review.check} checks={info.checks} />
        <Stack items={info.stack} />
        <div className={styles.links}>
          <CardLink href={info.href}>{info.cta}</CardLink>
        </div>
      </div>
    </article>
  );
}

function SnakeStage({ playing }: { playing: boolean }) {
  return (
    <>
      {playing ? <OnTheBigScreen /> : <LazyGame game="snake" mode="attract" height={CARD_GAME_H} />}
      <button
        type="button"
        className={`${styles.takeControl} va-press`}
        onClick={(e) => openPlay("snake", e, sfx.blip)}
      >
        Take control<span className="sr-only"> of the snake (opens full screen)</span>
      </button>
    </>
  );
}

const DEMOS: Record<Exclude<DemoKind, "snake">, () => ReactNode> = {
  printsafe: () => <PrintSafeDemo />,
  retrain: () => <RetrainDemo />,
  gen: () => <GenDemo />,
  fire: () => <FireDemo />,
  colorize: () => <ColorizeDemo />,
};

function ProjectCard({ p, world, snakePlaying }: { p: Project; world: World; snakePlaying: boolean }) {
  const id = `project-${p.kind}`;
  return (
    <li className={`${styles.cell} va-reveal`}>
      <article className={`${styles.card} va-card`} aria-labelledby={id} data-detect={`project 0.9${p.title.length % 10}`}>
        <div className={styles.stage}>
          {p.kind === "snake" ? <SnakeStage playing={snakePlaying} /> : DEMOS[p.kind]()}
          <span className={styles.cardMinute} aria-label={minuteLabel(world, p.min)}>
            {worldMinute(world.id, p.min)}
          </span>
        </div>
        <div className={styles.body}>
          <h3 id={id} className={styles.cardTitle}>
            {p.title}
          </h3>
          <p className={styles.blurb}>{p.blurb}</p>
          <Checks title={world.review.check} checks={p.checks} />
          <Stack items={p.stack} />
          <div className={styles.links}>
            <CardLink href={p.href}>{worldCta(p.cta, world)}</CardLink>
          </div>
        </div>
      </article>
    </li>
  );
}

export function Highlights() {
  const world = useWorld();
  const session = usePlaySession();
  const game = world.game.id;
  const printsafe = byKind("printsafe");
  const featuredKind = FEATURED_KIND[world.featured];
  const grid = PROJECTS.filter((p) => p.kind !== "printsafe" && p.kind !== featuredKind);
  const squad = world.featured === "pacecoach" ? SQUAD.filter((s) => s !== "PaceCoach") : SQUAD;
  const { kicker, title } = world.sections.highlights;

  const gameStage = (
    <>
      {session?.game === game ? <OnTheBigScreen /> : <LazyGame game={game} mode="attract" height={GAME_H} />}
      <button type="button" className={`${styles.play} va-press`} onClick={(e) => openPlay(game, e, sfx.signature)}>
        {world.game.start} · play<span className="sr-only"> (opens full screen)</span>
      </button>
    </>
  );

  return (
    <section id="highlights" aria-labelledby="hl-title" className="wrap section">
      <div className="eyebrow">{kicker}</div>
      <h2 id="hl-title" className="section-title va-reveal">
        {title}
      </h2>
      <p className={styles.lede}>Every highlight is playable. Press the buttons.</p>

      <FeatureCard
        id="printsafe"
        label={world.topLabel}
        world={world}
        detect="project 0.99"
        info={{ ...printsafe, lines: [printsafe.blurb] }}
        stage={<PrintSafeDemo height={GAME_H} />}
      />

      <FeatureCard
        id="match"
        label={world.game.kicker}
        world={world}
        detect="match 0.99"
        info={featuredCard(world)}
        stage={gameStage}
      />

      <ul className={styles.grid}>
        {grid.map((p) => (
          <ProjectCard key={p.kind} p={p} world={world} snakePlaying={session?.game === "snake"} />
        ))}
      </ul>

      <div className={`${styles.squad} va-reveal`}>
        <span className={styles.small} style={{ fontSize: 12 }}>
          Also in the squad
        </span>
        <ul>
          {squad.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>

      <PlayOverlay />
    </section>
  );
}
