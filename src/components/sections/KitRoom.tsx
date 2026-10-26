"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { KIT_ROOM, KITS } from "@/content/offpitch";
import { useReducedMotion } from "@/lib/hooks/useStores";
import { sfx } from "@/lib/sound";
import styles from "./KitRoom.module.css";

const FIRST_LIGHT_MS = 500;
const LIGHT_GAP_MS = 420;
const ALL_OFF = [false, false, false, false];
const ALL_ON = [true, true, true, true];

/** Dark showroom: spotlights switch on one by one the first time the room scrolls into view. */
export function KitRoom() {
  const room = useRef<HTMLDivElement>(null);
  // a stable bag, so effect cleanups always see the latest timers
  const timers = useRef({ ids: [] as ReturnType<typeof setTimeout>[] });
  const calm = useReducedMotion();
  const [lit, setLit] = useState<boolean[]>(ALL_OFF);
  const [back, setBack] = useState<boolean[]>(ALL_ON);
  const [flashKey, setFlashKey] = useState(0);

  const lightsUp = () => {
    timers.current.ids.forEach(clearTimeout);
    setLit(ALL_OFF);
    setFlashKey((k) => k + 1);
    timers.current.ids = KITS.map((_, i) =>
      setTimeout(() => {
        sfx.spotlight(i);
        setLit((prev) => prev.map((v, j) => (j === i ? true : v)));
      }, FIRST_LIGHT_MS + i * LIGHT_GAP_MS),
    );
  };

  useEffect(() => {
    const el = room.current;
    if (!el || calm || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        lightsUp();
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    const bag = timers.current;
    return () => {
      io.disconnect();
      bag.ids.forEach(clearTimeout);
    };
  }, [calm]);

  const isLit = (i: number) => calm || lit[i];

  return (
    <div ref={room} className={`${styles.room} va-reveal`} data-detect="kit room 0.95">
      <div className={styles.head}>
        <div>
          <div className={styles.kicker}>{KIT_ROOM.kicker}</div>
          <h3 className={styles.title}>{KIT_ROOM.title}</h3>
        </div>
        <div className={styles.headRight}>
          <p className={styles.intro}>{KIT_ROOM.intro}</p>
          {!calm && (
            <button type="button" className={`${styles.again} va-press`} onClick={lightsUp}>
              Lights again
            </button>
          )}
        </div>
      </div>

      <ul className={styles.rail}>
        {KITS.map((k, i) => {
          const on = isLit(i);
          const showingBack = back[i];
          return (
            <li key={k.id} className={styles.slot}>
              <div className={styles.lamp} aria-hidden="true">
                <span style={{ background: on ? "#fff3c4" : "#3a3f3c" }} />
              </div>
              <div className={styles.cone} style={{ opacity: on ? 1 : 0 }} aria-hidden="true" />
              <div className={styles.hanger} aria-hidden="true" />
              <button
                type="button"
                className={styles.shirt}
                style={{ animationDuration: `${k.sway}s` }}
                aria-label={`${k.title} shirt, showing the ${showingBack ? "back with VISHAL and number 4" : "front"}. Turn it round.`}
                onClick={() => {
                  sfx.whoosh();
                  setBack((prev) => prev.map((v, j) => (j === i ? !v : v)));
                }}
              >
                {/* perspective, brightness and flash live here; never on the spinner, or 3D flattens */}
                <div
                  key={on ? `lit-${flashKey}` : "dark"}
                  className={`${styles.stage} ${on ? styles.flash : styles.dim}`}
                >
                  <div className={styles.spinner} style={{ transform: showingBack ? "rotateY(0deg)" : "rotateY(180deg)" }}>
                    <Image src={`/kits/${k.id}-back.png`} alt="" width={192} height={240} unoptimized className={`${styles.face} pixelated`} />
                    <Image
                      src={`/kits/${k.id}-front.png`}
                      alt=""
                      width={192}
                      height={240}
                      unoptimized
                      className={`${styles.face} ${styles.faceFront} pixelated`}
                    />
                  </div>
                </div>
              </button>
              <div className={styles.glow} style={{ opacity: on ? 1 : 0 }} aria-hidden="true" />
              <div className={styles.caption}>
                <div className={styles.kitTitle}>{k.title}</div>
                <div className={styles.result} style={{ background: k.result === "Winners" ? "#f5d547" : "#c9d1d6" }}>
                  {k.result}
                </div>
                <div className={styles.note}>{k.note}</div>
                <div className={styles.side} aria-hidden="true">
                  {showingBack ? "back · tap to turn" : "front · tap to turn"}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
