"use client";

import type { MouseEvent, PointerEvent } from "react";
import { ArrowIcon } from "@/components/sprite/PixelBall";
import type { PlayDef } from "@/content/worlds";
import type { Pad, PadKey } from "@/lib/play/pad";
import { dpadKeys } from "./padSources";
import styles from "./Controller.module.css";

export interface PadHandlers {
  press: (source: string, keys: readonly PadKey[]) => void;
  release: (source: string) => void;
  /** A short press for clicks that come without a pointer (screen readers, switch access). */
  tap: (key: PadKey) => void;
}

interface Props extends PadHandlers {
  def: PlayDef;
  pad: Pad;
  brand: string;
  onExit: () => void;
  onRestart: () => void;
}

const ARMS = [
  { key: "up", label: "Up", cls: styles.up },
  { key: "left", label: "Left", cls: styles.left },
  { key: "right", label: "Right", cls: styles.right },
  { key: "down", label: "Down", cls: styles.down },
] as const;

const src = (e: PointerEvent) => `ptr:${e.pointerId}`;

function capture(e: PointerEvent<HTMLElement>): void {
  e.preventDefault(); // keeps focus on the overlay and stops text selection / emulated mouse events
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {
    // capture can fail for a pointer that already ended; the button still works without it
  }
}

/** Keyboard or assistive-tech activation has no pointer behind it (detail 0). */
const isVirtualClick = (e: MouseEvent) => e.detail === 0;

/** The d-pad is one surface: a finger can roll between arms and onto diagonals. */
function DPad({ pad, press, release, tap }: PadHandlers & { pad: Pad }) {
  const read = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    press(src(e), dpadKeys(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2), r.width / 2));
  };
  return (
    <div
      className={styles.dpad}
      role="group"
      aria-label="Direction pad"
      onPointerDown={(e) => {
        capture(e);
        read(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) read(e);
      }}
      onPointerUp={(e) => release(src(e))}
      onPointerCancel={(e) => release(src(e))}
      onLostPointerCapture={(e) => release(src(e))}
    >
      {ARMS.map((a) => (
        <button
          key={a.key}
          type="button"
          tabIndex={-1}
          className={`${styles.arm} ${a.cls}`}
          aria-label={a.label}
          data-on={pad[a.key] || undefined}
          onClick={(e) => isVirtualClick(e) && tap(a.key)}
        >
          <ArrowIcon dir={a.key} size={20} />
        </button>
      ))}
      <span className={styles.hub} aria-hidden="true" />
    </div>
  );
}

function HoldButton({
  k,
  label,
  className,
  children,
  pad,
  press,
  release,
  tap,
}: PadHandlers & { k: PadKey; label: string; className: string; children: string; pad: Pad }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className={className}
      aria-label={label}
      data-on={pad[k] || undefined}
      onPointerDown={(e) => {
        capture(e);
        press(src(e), [k]);
      }}
      onPointerUp={(e) => release(src(e))}
      onPointerCancel={(e) => release(src(e))}
      onLostPointerCapture={(e) => release(src(e))}
      onClick={(e) => isVirtualClick(e) && tap(k)}
    >
      {children}
    </button>
  );
}

/** Bottom half of the handheld: d-pad, A/B, R when the game uses it, Select (exit) and Start (restart). */
export function Controller({ def, pad, brand, onExit, onRestart, ...handlers }: Props) {
  const hold = { pad, ...handlers };
  return (
    <div className={styles.controller} onContextMenu={(e) => e.preventDefault()}>
      <div className={styles.top}>
        <span className={styles.brand}>{brand}</span>
        {def.r && (
          <HoldButton k="r" label={`R: ${def.r}`} className={styles.shoulder} {...hold}>
            {`R · ${def.r}`}
          </HoldButton>
        )}
      </div>

      <div className={styles.middle}>
        <DPad {...hold} />
        <div className={styles.face}>
          {def.b && (
            <div className={`${styles.faceBtn} ${styles.bPos}`}>
              <HoldButton k="b" label={`B: ${def.b}`} className={styles.round} {...hold}>
                B
              </HoldButton>
              <span className={styles.faceLabel} aria-hidden="true">
                {def.b}
              </span>
            </div>
          )}
          {def.a && (
            <div className={`${styles.faceBtn} ${styles.aPos}`}>
              <HoldButton k="a" label={`A: ${def.a}`} className={styles.round} {...hold}>
                A
              </HoldButton>
              <span className={styles.faceLabel} aria-hidden="true">
                {def.a}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.pills}>
        <div className={styles.pillWrap}>
          <button type="button" className={styles.pill} onClick={onExit}>
            <span className={styles.pillFace}>Exit</span>
          </button>
          <span className={styles.pillLabel} aria-hidden="true">
            Select
          </span>
        </div>
        <div className={styles.pillWrap}>
          <button type="button" className={styles.pill} onClick={onRestart}>
            <span className={styles.pillFace}>Restart</span>
          </button>
          <span className={styles.pillLabel} aria-hidden="true">
            Start
          </span>
        </div>
      </div>

      <div className={styles.grille} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
