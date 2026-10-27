"use client";

import type { CSSProperties } from "react";
import { PixelBall } from "@/components/sprite/PixelBall";
import { BENCH, TIMELINE, type EventTag } from "@/content/career";
import { TEAM_TALK } from "@/content/site";
import { worldMinute, type World } from "@/content/worlds";
import { useWorld } from "@/lib/hooks/useStores";
import { CharacterSelect } from "./lineup/CharacterSelect";
import { Corrals } from "./lineup/Corrals";
import { Formation } from "./lineup/Formation";
import { NeuralNet } from "./lineup/NeuralNet";
import { StartingGrid } from "./lineup/StartingGrid";
import styles from "./Story.module.css";

export function TeamTalk() {
  const world = useWorld();
  return (
    <section className={styles.stmt} aria-label="What I do">
      <div className={styles.stmtPin}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>
          {world.talk}
        </div>
        <p className={styles.words}>
          {TEAM_TALK.map((w, i) => (
            <span key={i} className={w.accent ? styles.accent : undefined} style={{ "--i": i } as CSSProperties}>
              {w.word}{" "}
            </span>
          ))}
        </p>
        <div className={styles.stmtBall} aria-hidden="true">
          <PixelBall colors={world.hero.prop} />
        </div>
      </div>
    </section>
  );
}

function LineupLayoutView({ layout }: { layout: World["sections"]["lineup"]["layout"] }) {
  switch (layout) {
    case "grid":
      return <StartingGrid />;
    case "select":
      return <CharacterSelect />;
    case "corrals":
      return <Corrals />;
    case "network":
      return <NeuralNet />;
    default:
      return <Formation />;
  }
}

export function Lineup() {
  const { sections } = useWorld();
  const l = sections.lineup;
  return (
    <section id="lineup" aria-labelledby="lineup-title" className="wrap section">
      <div className="eyebrow">{l.kicker}</div>
      <h2 id="lineup-title" className="section-title va-reveal">
        {l.title} <span style={{ color: "var(--muted)", fontSize: 28 }}>{l.sub}</span>
      </h2>
      <div className={`${styles.formation} va-reveal`} data-detect="formation 0.96">
        <LineupLayoutView layout={l.layout} />
      </div>
      <ul className={styles.bench} aria-label={l.bench}>
        <li className={styles.benchLabel} aria-hidden="true">
          {l.bench}
        </li>
        {BENCH.map((b) => (
          <li key={b} className={styles.benchItem}>
            {b}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Tag colours from the mock; "Goal" is gold in Grand Prix and Gaming, the world accent elsewhere. */
function tagColors(worldId: World["id"]): Record<EventTag, string> {
  return {
    Goal: worldId === "gaming" || worldId === "gp" ? "#ffd43b" : "var(--accent)",
    "Sub on": "#8fb0d9",
    Promoted: "#6fd08c",
    "Kick-off": "#eef3ea",
  };
}

export function Timeline() {
  const world = useWorld();
  const colors = tagColors(world.id);
  const long = world.id !== "football";
  return (
    <section id="timeline" className={styles.tl} aria-labelledby="timeline-title">
      <div className={styles.tlPin}>
        <div className={`wrap ${styles.tlHead}`}>
          <div className="eyebrow">{world.sections.timeline.kicker}</div>
          <h2 id="timeline-title" className="section-title" style={{ marginBottom: 20 }}>
            {world.sections.timeline.title}
          </h2>
          <div className={styles.tlBar} aria-hidden="true">
            <div className={styles.tlFill} />
          </div>
        </div>
        <ol className={styles.tlTrack}>
          {TIMELINE.map((e) => (
            <li key={e.min}>
              <article className={styles.event} data-detect={`${e.tag.toLowerCase()} 0.9${e.min.length}`}>
                <div className={styles.eventTop}>
                  <span className={styles.tag} style={{ background: colors[e.tag] }}>
                    {world.tags[e.tag]}
                  </span>
                  <span className={styles.when}>{e.when}</span>
                </div>
                <span className={`${styles.minute} ${long ? styles.minuteLong : ""}`}>
                  {worldMinute(world.id, e.min)}
                </span>
                <h3 className={styles.eventTitle} style={{ fontFamily: "var(--body)", textTransform: "none" }}>
                  {e.title}
                </h3>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
