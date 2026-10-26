"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { WORLD_IDS, WORLDS, type WorldId } from "@/content/worlds";
import { mathRng, type Rng } from "@/lib/engines/rng";
import { useIntro, useSoundOn } from "@/lib/hooks/useStores";
import { setSoundOn } from "@/lib/sound";
import { introStore } from "@/lib/stores/htmlAttr";
import { enterWorld, randomWorld } from "@/lib/worlds/switch";
import { fontStack } from "./fonts";
import { sheetUrl } from "./spriteSheet";
import styles from "./StartScreen.module.css";

export const INTRO_MS = 8000;
const TICK_MS = 100;
const FOCUSABLE = "button:not([disabled])";

/** Both themes' colours go on the tile as variables, so the right one shows with no flash or hydration wait. */
function tileVars(id: WorldId): CSSProperties {
  const w = WORLDS[id];
  const vars: Record<string, string> = {
    "--t-font": fontStack(w.fonts.display),
    "--t-scale": String(w.fonts.scale),
  };
  for (const [key, mode] of [["n", w.modes.night], ["d", w.modes.day]] as const) {
    vars[`--t-${key}-bg`] = mode.bg;
    vars[`--t-${key}-ink`] = mode.ink;
    vars[`--t-${key}-muted`] = mode.muted;
    vars[`--t-${key}-accent`] = mode.accent;
    vars[`--t-${key}-stage`] = mode.stage;
  }
  return vars as CSSProperties;
}

function useInertBehind(open: boolean, dialog: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = dialog.current;
    if (!open || !el) return;
    const touched: HTMLElement[] = [];
    for (let node: HTMLElement = el; node.parentElement; node = node.parentElement) {
      for (const sib of Array.from(node.parentElement.children)) {
        if (sib !== node && sib instanceof HTMLElement && !sib.inert) {
          sib.inert = true;
          touched.push(sib);
        }
      }
    }
    return () => touched.forEach((n) => (n.inert = false));
  }, [open, dialog]);
}

/**
 * "Choose your world" (spec §2). Always server-rendered; CSS shows it only for
 * `:root[data-js][data-intro="on"]`, so there is no flash and no-JS visitors never see it.
 */
export function StartScreen({ rng = mathRng }: { rng?: Rng }) {
  const open = useIntro() === "on";
  const sound = useSoundOn();
  const dialog = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(INTRO_MS);
  const [held, setHeld] = useState(false);
  const heldRef = useRef(false);
  const leftRef = useRef(INTRO_MS);

  const hold = useCallback((on: boolean) => {
    heldRef.current = on;
    setHeld(on);
  }, []);

  const close = useCallback(
    (id: WorldId, random: boolean) => {
      if (introStore.get() !== "on") return;
      introStore.set("off");
      enterWorld(id, random ? "Random pick" : "Welcome to");
    },
    [],
  );
  const surprise = useCallback(() => close(randomWorld(rng), true), [close, rng]);

  useInertBehind(open, dialog);

  useEffect(() => {
    if (!open) return;
    dialog.current?.focus();
    const timer = setInterval(() => {
      if (heldRef.current) return;
      leftRef.current -= TICK_MS;
      setLeft(Math.max(0, leftRef.current));
      if (leftRef.current <= 0) surprise();
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [open, surprise]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      surprise();
    } else if (/^[1-5]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      close(WORLD_IDS[Number(e.key) - 1], false);
    } else if (e.key === "Tab") {
      const items = Array.from(dialog.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === dialog.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const secs = Math.ceil(left / 1000);
  return (
    <div
      ref={dialog}
      className={styles.root}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div className={styles.inner}>
        <div className={styles.top}>
          <div>
            <p className={styles.kicker}>Vishal Agarwal · AI engineer · Live</p>
            <h1 id="intro-title" className={styles.title}>Choose your world</h1>
            <p className={styles.lede}>Same story, five ways to watch it. Each world has its own look, sound and game.</p>
          </div>
          <button type="button" className={`${styles.sound} va-press`} aria-pressed={sound} onClick={() => setSoundOn(!sound)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 9h4l5-4v14l-5-4H4z" />
              {sound ? <path d="M17 9c1.2 1.6 1.2 4.4 0 6" /> : <path d="M17 9l5 6M22 9l-5 6" />}
            </svg>
            {sound ? "Sound on" : "Sound off"}
          </button>
        </div>
        <div
          role="group"
          aria-label="Worlds"
          className={styles.tiles}
          onPointerEnter={() => hold(true)}
          onPointerLeave={() => hold(false)}
          onFocus={() => hold(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) hold(false);
          }}
        >
          {WORLD_IDS.map((id, i) => {
            const w = WORLDS[id];
            return (
              <button
                key={id}
                type="button"
                className={`${styles.tile} va-press`}
                style={tileVars(id)}
                onClick={() => close(id, false)}
                aria-label={`${w.name}: ${w.intro.tag}. ${w.intro.blurb} Press ${i + 1}.`}
              >
                <span className={styles.stage} aria-hidden="true">
                  <span className={styles.me} style={{ backgroundImage: `url(${sheetUrl(id)})` }} />
                </span>
                <span className={styles.body}>
                  <span className={styles.tag}>{i + 1} · {w.intro.tag}</span>
                  <span className={styles.name}>{w.name}</span>
                  <span className={styles.blurb}>{w.intro.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className={styles.foot}>
          <button type="button" className={`${styles.surprise} va-press`} onClick={surprise}>
            Surprise me
          </button>
          <div className={styles.count}>
            <span role="status">{held ? "Take your time" : `Random pick in ${secs}s`}</span>
            <span className={styles.track} aria-hidden="true">
              <span className={styles.fill} style={{ transform: `scaleX(${left / INTRO_MS})` }} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
