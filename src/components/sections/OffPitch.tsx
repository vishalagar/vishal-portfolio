"use client";

import Image from "next/image";
import { MARATHON, OFF_PITCH_CARDS, splitBars } from "@/content/offpitch";
import { useWorld } from "@/lib/hooks/useStores";
import { InViewMark } from "./InViewMark";
import { KitRoom } from "./KitRoom";
import styles from "./OffPitch.module.css";

function Marathon() {
  const bars = splitBars(MARATHON.splits);
  return (
    <div className={styles.row}>
      <div className={`${styles.marathon} va-reveal`} data-detect="runner 0.97">
        <div className={styles.race}>{MARATHON.tag}</div>
        <div className={styles.distance}>{MARATHON.distance}</div>
        <dl className={styles.stats}>
          {MARATHON.stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <dt className={styles.statLabel}>{s.label}</dt>
              <dd className={styles.statValue}>{s.value}</dd>
            </div>
          ))}
        </dl>
        <InViewMark className={styles.bars} role="img" aria-label={MARATHON.chartLabel}>
          {bars.map((b, i) => (
              <div
                key={b.label}
                title={b.label}
                className={styles.bar}
                style={{
                  height: b.height,
                  background: b.sprint ? "var(--accent)" : "var(--blue)",
                  animationDelay: `${(i * 0.06).toFixed(2)}s`,
                }}
              />
          ))}
        </InViewMark>
        <div className={styles.axis} aria-hidden="true">
          <span>km 1</span>
          <span>km 10</span>
          <span>km 21 + sprint</span>
        </div>
        <p className={styles.closing}>{MARATHON.closing}</p>
      </div>
      <div className={`${styles.medal} va-reveal`}>
        <Image src="/img/medal.jpg" alt={MARATHON.medalAlt} fill sizes="(max-width: 860px) 100vw, 400px" />
      </div>
    </div>
  );
}

export function OffPitch() {
  const { kicker, title } = useWorld().sections.offpitch;
  return (
    <section id="offpitch" aria-labelledby="off-title" className="wrap section">
      <div className="eyebrow">{kicker}</div>
      <h2 id="off-title" className="section-title va-reveal">
        {title}
      </h2>
      <Marathon />
      <KitRoom />
      <div className={`${styles.cards} va-reveal`}>
        {OFF_PITCH_CARDS.map((c) => (
          <div key={c.title} className={`${styles.card} va-card`}>
            <div className={styles.cardKicker}>{c.kicker}</div>
            <h3 className={styles.cardTitle}>{c.title}</h3>
            <p className={styles.cardBody}>{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
