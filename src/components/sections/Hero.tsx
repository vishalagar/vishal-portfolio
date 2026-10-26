"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Sprite, type Gaze } from "@/components/sprite/Sprite";
import { PixelBall } from "@/components/sprite/PixelBall";
import { HERO } from "@/content/site";
import type { WorldId } from "@/content/worlds";
import { LAST_FRAME } from "@/lib/hooks/unmaskMath";
import { useWorld } from "@/lib/hooks/useStores";
import { useUnmask } from "@/lib/hooks/useUnmask";
import { sfx } from "@/lib/sound";
import styles from "./Hero.module.css";

const LOOK_THRESHOLD_PX = 90;
const KICK_MS = 800;

const BASE_LABEL =
  "Pixel-art Vishal: curly black hair, round glasses, white shirt with blue elephant print. His eyes follow your cursor and he blinks.";

/** Per-world stage dressing behind the sprite (all decorative). */
function StageDecor({ id }: { id: WorldId }) {
  switch (id) {
    case "football":
      return (
        <>
          <div className={styles.halfway} aria-hidden="true" />
          <div className={styles.circle} aria-hidden="true" />
        </>
      );
    case "gp":
      return (
        <>
          <div className={styles.kerb} aria-hidden="true" />
          <div className={styles.laneDash} aria-hidden="true" />
        </>
      );
    case "gaming":
      return <div className={styles.scanlines} aria-hidden="true" />;
    case "run":
      return (
        <>
          <div className={styles.track} aria-hidden="true" />
          <div className={styles.finishPost} aria-hidden="true" />
        </>
      );
    default:
      return null;
  }
}

/** Extras shown over the stage while the review toggle is on. */
function ReviewExtras({ id }: { id: WorldId }) {
  if (id === "gp") {
    return (
      <div className={styles.gpBanner} aria-hidden="true">
        <span className={styles.gpFlag}>Race control</span>
        <span className={styles.gpNote}>Car 4 · track limits · under investigation</span>
      </div>
    );
  }
  if (id === "run") {
    return (
      <div className={styles.runStrip} aria-hidden="true">
        <span className={styles.runKm}>km 21</span>
        <span className={styles.runPace}>5:45 /km · chip #4</span>
      </div>
    );
  }
  if (id === "ai") {
    return (
      <div className={styles.aiStrip} aria-hidden="true">
        yolo · 14 ms · 1 human, 0 bugs
      </div>
    );
  }
  return null;
}

export function Hero() {
  const world = useWorld();
  const spriteRef = useRef<HTMLDivElement>(null);
  const kickTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const unmask = useUnmask(spriteRef, "hero");
  const [gaze, setGaze] = useState<Gaze | null>(null);
  const [kicking, setKicking] = useState(false);
  const [varOn, setVarOn] = useState(true);

  useEffect(() => () => clearTimeout(kickTimer.current), []);

  const costume = world.gear !== null;
  const costumeOn = costume && unmask < LAST_FRAME;
  const prop = world.hero.prop;

  const onLook = (e: PointerEvent<HTMLElement>) => {
    const el = spriteRef.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const next: Gaze = dx < -LOOK_THRESHOLD_PX ? "left" : dx > LOOK_THRESHOLD_PX ? "right" : "open";
    if (next !== gaze) setGaze(next);
  };

  const kick = () => {
    if (kicking) return;
    sfx.prop();
    setKicking(true);
    kickTimer.current = setTimeout(() => setKicking(false), KICK_MS);
  };

  // eyes follow the cursor; they glance on their own when it's away, and look at the prop when kicked
  const spriteGaze: Gaze | undefined = kicking ? "right" : (gaze ?? undefined);
  const spriteLabel = costumeOn
    ? `Pixel-art Vishal wearing his ${world.name} ${world.gear}. Scroll down and he takes it off.`
    : BASE_LABEL;

  return (
    <section
      aria-labelledby="hero-title"
      className={styles.hero}
      onPointerMove={onLook}
      onPointerLeave={() => setGaze(null)}
    >
      <div className={`${styles.text} va-hero-text`}>
        <div className={styles.textInner}>
          <div className={styles.kicker}>{world.hero.kicker}</div>
          <h1 id="hero-title" className={styles.title} data-detect="headline 0.98">
            {HERO.title}
            <span className={styles.titleAccent}>{HERO.titleAccent}</span>
          </h1>
          <p className={styles.intro}>{HERO.intro}</p>
          <div className={styles.ctas}>
            <a href={HERO.primary.href} className="btn btn-accent va-press" onClick={() => sfx.whistle()}>
              {world.hero.cta}
            </a>
            <a href={HERO.secondary.href} className="btn va-press">
              Ask the {world.assistant}
            </a>
          </div>
        </div>
      </div>

      <div className={`${styles.pitchCol} va-hero-pitch`}>
        <div className={styles.pitch}>
          <StageDecor id={world.id} />
          <div className={styles.cam} aria-hidden="true">
            {world.hero.cam}
          </div>
          <div className={styles.player} ref={spriteRef}>
            <div className={styles.bob}>
              <Sprite
                scale={6}
                gaze={spriteGaze}
                glance={{ duration: 13, delay: 0 }}
                unmask={unmask}
                label={spriteLabel}
              />
            </div>
          </div>
          {costumeOn && (
            <div className={styles.offHint} aria-hidden="true">
              Scroll · {world.gear} off
            </div>
          )}
          <button
            type="button"
            className={`${styles.ball} ${kicking ? styles.kicking : ""}`}
            onClick={kick}
            aria-label={prop.label}
          >
            <PixelBall colors={prop} />
          </button>
          {varOn && (
            <div className={styles.detect} aria-hidden="true">
              <span className={styles.detectLabel}>{costumeOn ? world.hero.box : HERO.detection}</span>
              {world.id === "gaming" && (
                <>
                  <span className={styles.reticle} />
                  <span className={styles.reticleH} />
                  <span className={styles.reticleV} />
                </>
              )}
              <span className={styles.scanline} />
            </div>
          )}
          {varOn && <ReviewExtras id={world.id} />}
          <button
            type="button"
            className={`${styles.varToggle} va-press`}
            aria-pressed={varOn}
            onClick={() => {
              sfx.blip();
              setVarOn((v) => !v);
            }}
          >
            {world.review.word}: {varOn ? "on" : "off"}
          </button>
        </div>
        <div className={styles.hint}>{prop.hint}</div>
      </div>
    </section>
  );
}
