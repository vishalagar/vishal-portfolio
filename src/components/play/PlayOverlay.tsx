"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { PLAY, type PlayDef } from "@/content/worlds";
import { useWorld } from "@/lib/hooks/useStores";
import { padKeyFor, type Pad, type PadKey } from "@/lib/play/pad";
import { sfx } from "@/lib/sound";
import { Controller, type PadHandlers } from "./Controller";
import { GAMES } from "./games";
import { NO_SOURCES, padFromSources, pressSource, releaseKeys, releaseSource, type PadSources } from "./padSources";
import { playStore, usePlaySession, type PlaySession } from "./playStore";
import { fitBox } from "./sizing";
import { useContentSize, usePhoneLayout } from "./usePlayLayout";
import { usePageLock } from "./usePageLock";
import styles from "./Play.module.css";

/** How long a pointer-less click (screen reader, switch) holds a pad button. */
const TAP_MS = 140;
const TITLE_ID = "play-title";
const FOCUSABLE = 'button:not([tabindex="-1"]):not([disabled]), a[href], [tabindex="0"]';

/** Full-screen Play mode (worlds-spec §8). Renders nothing until a card opens it. */
export function PlayOverlay() {
  const session = usePlaySession();
  if (!session) return null;
  return createPortal(<Overlay session={session} />, document.body);
}

/** The pad state, fed by keys and fingers; cleared when focus or the tab goes away. */
function usePadSources() {
  const [sources, setSources] = useState<PadSources>(NO_SOURCES);
  const taps = useRef(new Set<ReturnType<typeof setTimeout>>());
  const press = useCallback((id: string, keys: readonly PadKey[]) => setSources((s) => pressSource(s, id, keys)), []);
  const release = useCallback((id: string) => setSources((s) => releaseSource(s, id)), []);
  const clear = useCallback(() => setSources(NO_SOURCES), []);
  const clearKeys = useCallback(() => setSources(releaseKeys), []);
  const tap = useCallback(
    (key: PadKey) => {
      const id = `tap:${key}`;
      press(id, [key]);
      const t = setTimeout(() => {
        taps.current.delete(t);
        release(id);
      }, TAP_MS);
      taps.current.add(t);
    },
    [press, release],
  );

  useEffect(() => {
    const pending = taps.current;
    const onHidden = () => document.hidden && clear();
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", onHidden);
      pending.forEach(clearTimeout);
    };
  }, [clear]);

  const pad = useMemo(() => padFromSources(sources), [sources]);
  return { pad, press, release, tap, clear, clearKeys };
}

/** Tab and Shift+Tab stay inside the dialog. */
function trapTab(e: KeyboardEvent<HTMLDivElement>): void {
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (!items.length) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const here = document.activeElement;
  if (e.shiftKey && (here === first || here === e.currentTarget)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && here === last) {
    e.preventDefault();
    first.focus();
  }
}

const keySource = (e: KeyboardEvent) => `key:${e.code || e.key}`;

function Overlay({ session }: { session: PlaySession }) {
  const world = useWorld();
  const def = PLAY[session.game];
  const phone = usePhoneLayout();
  const root = useRef<HTMLDivElement>(null);
  const { pad, press, release, tap, clear, clearKeys } = usePadSources();
  usePageLock(root, playStore.takeOpener);

  const exit = useCallback(() => playStore.close(), []);
  const restart = useCallback(() => {
    clear();
    sfx.blip();
    playStore.restart();
  }, [clear]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      exit();
      return;
    }
    if (e.key === "Tab") {
      trapTab(e);
      return;
    }
    // Enter / Space on a focused button (Exit, Restart…) activate that button, not the game
    if ((e.key === "Enter" || e.key === " ") && e.target instanceof HTMLButtonElement) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (!e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) restart();
      return;
    }
    const k = padKeyFor(e);
    if (!k) return;
    e.preventDefault();
    press(keySource(e), [k]);
  };
  const onKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (padKeyFor(e)) e.preventDefault();
    release(keySource(e));
  };
  /** Keys held when focus leaves never get a keyup; fingers on the pad are still down. */
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) clearKeys();
  };

  const view = { def, pad, session };
  return (
    <div
      ref={root}
      className={`${styles.overlay} ${phone ? styles.isPhone : styles.isDesk}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      tabIndex={-1}
      data-game="play"
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={onBlur}
    >
      {phone ? (
        <Handheld
          {...view}
          brand={`VA-4 · ${world.name}`}
          handlers={{ press, release, tap }}
          onExit={exit}
          onRestart={restart}
        />
      ) : (
        <Theatre {...view} onExit={exit} />
      )}
    </div>
  );
}

interface ViewProps {
  def: PlayDef;
  pad: Pad;
  session: PlaySession;
}

/** The game, sized to the biggest box of its aspect that fits the slot. */
function Screen({ def, pad, session, aspect, className }: ViewProps & { aspect: number; className: string }) {
  const slot = useRef<HTMLDivElement>(null);
  const size = useContentSize(slot, aspect);
  const box = size && fitBox(size.w, size.h, aspect);
  const Game = GAMES[session.game];
  return (
    <div ref={slot} className={styles.slot}>
      {box && (
        <div className={className} style={{ width: box.w, height: box.h }}>
          <Game mode="play" pad={pad} playKey={session.key} height={box.gameH} />
        </div>
      )}
      <span className="sr-only">{def.legend.map((l) => `${l.key}: ${l.does}`).join(". ")}</span>
    </div>
  );
}

/** Laptop: the page is hidden, the game is big, keys are listed underneath. */
function Theatre({ onExit, ...view }: ViewProps & { onExit: () => void }) {
  const { def } = view;
  return (
    <div className={styles.theatre}>
      <div className={styles.bar}>
        <div className={styles.heading}>
          <span className={styles.kicker}>{def.kicker}</span>
          <h2 id={TITLE_ID} className={styles.title}>
            {def.title}
          </h2>
        </div>
        <button type="button" className={`${styles.exit} va-press`} onClick={onExit}>
          Exit · Esc
        </button>
      </div>
      <div className={styles.stage}>
        <Screen {...view} aspect={def.desk} className={styles.box} />
      </div>
      <ul className={styles.legend} aria-hidden="true">
        {def.legend.map((l) => (
          <li key={l.key}>
            <kbd className={styles.key}>{l.key}</kbd>
            {l.does}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface HandheldProps extends ViewProps {
  brand: string;
  handlers: PadHandlers;
  onExit: () => void;
  onRestart: () => void;
}

/** Phone: screen on top, controller below, in the world's shell colours. */
function Handheld({ brand, handlers, onExit, onRestart, ...view }: HandheldProps) {
  const { def, pad } = view;
  return (
    <div className={styles.handheld}>
      <div className={styles.screenHalf}>
        <div className={styles.bezel}>
          <div className={styles.bezelBar}>
            <span className={styles.power}>
              <span className={styles.led} aria-hidden="true" />
              {def.kicker}
            </span>
            <h2 id={TITLE_ID} className={styles.bezelTitle}>
              {def.title}
            </h2>
          </div>
          <Screen {...view} aspect={def.phone} className={styles.lcd} />
        </div>
      </div>
      <div className={styles.padHalf}>
        <Controller def={def} pad={pad} brand={brand} onExit={onExit} onRestart={onRestart} {...handlers} />
      </div>
    </div>
  );
}
