"use client";

import { useSoundOn } from "@/lib/hooks/useStores";
import { setSoundOn } from "@/lib/sound";
import styles from "./Header.module.css";

export function SoundToggle() {
  const on = useSoundOn();
  return (
    <button
      type="button"
      className={`${styles.toggle} va-press`}
      onClick={() => setSoundOn(!on)}
      aria-pressed={on}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {on ? (
          <path d="M17 9c1.2 1.6 1.2 4.4 0 6" />
        ) : (
          <path d="M17 9l5 6M22 9l-5 6" />
        )}
      </svg>
      <span className={styles.toggleText}>{on ? "Sound on" : "Sound off"}</span>
      <span className="sr-only">: stadium sound</span>
    </button>
  );
}
