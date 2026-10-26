"use client";

import { useEffect, useState } from "react";
import { sfx } from "@/lib/sound";
import { varStore } from "@/lib/stores/htmlAttr";

const SECRET = "var";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target.closest("[data-game]")) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Type V-A-R anywhere (outside a text field or game) to put detection boxes on the whole page. */
export function EasterEggs() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let typed = "";
    let hide: ReturnType<typeof setTimeout> | undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1 || isTyping(e.target)) return;
      typed = (typed + e.key.toLowerCase()).slice(-SECRET.length);
      if (typed !== SECRET) return;
      typed = "";
      const on = varStore.get() !== "on";
      varStore.set(on ? "on" : "off");
      sfx.blip();
      setToast(on ? "VAR mode on: every element gets checked. Type VAR again to switch off." : "VAR mode off.");
      clearTimeout(hide);
      hide = setTimeout(() => setToast(null), 3200);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(hide);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 20,
        transform: "translateX(-50%)",
        zIndex: 70,
        maxWidth: "calc(100vw - 32px)",
        padding: toast ? "10px 14px" : 0,
        background: "var(--accent)",
        color: "var(--on-accent)",
        border: toast ? "2px solid var(--fixed-dark)" : 0,
        boxShadow: toast ? "4px 4px 0 var(--fixed-dark)" : "none",
        fontFamily: "var(--pixel)",
        fontSize: 12,
        pointerEvents: "none",
      }}
    >
      {toast}
    </div>
  );
}
