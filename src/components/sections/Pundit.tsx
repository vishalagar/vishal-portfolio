"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Sprite } from "@/components/sprite/Sprite";
import { PUNDIT_COPY, PUNDIT_QA, type PunditErrorCode } from "@/content/pundit";
import { track } from "@/lib/analytics/track";
import { useReducedMotion, useWorld } from "@/lib/hooks/useStores";
import { useUnmask } from "@/lib/hooks/useUnmask";
import { QUESTION_MAX, QUESTION_MIN } from "@/lib/pundit/schema";
import { sfx } from "@/lib/sound";
import styles from "./Pundit.module.css";

type Exchange = { q: string; a: string; status: "typing" | "streaming" | "done" | "error"; chip: number | null };

const TYPE_MS = 14;
const CLIENT_TIMEOUT_MS = 35_000;
const ERROR_CODES = new Set<string>(Object.keys(PUNDIT_COPY.errors));

function errorCode(value: unknown): PunditErrorCode {
  return typeof value === "string" && ERROR_CODES.has(value) ? (value as PunditErrorCode) : "failed";
}

async function readError(res: Response): Promise<PunditErrorCode> {
  try {
    const body: unknown = await res.json();
    return errorCode((body as { error?: unknown })?.error);
  } catch {
    return "failed";
  }
}

export function Pundit() {
  const calm = useReducedMotion();
  const world = useWorld();
  const monitorRef = useRef<HTMLDivElement>(null);
  const unmask = useUnmask(monitorRef, "inline");
  const [ex, setEx] = useState<Exchange>({ q: PUNDIT_QA[0].q, a: PUNDIT_QA[0].a, status: "done", chip: 0 });
  const [draft, setDraft] = useState("");
  const abort = useRef<AbortController | null>(null);
  const typer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(
    () => () => {
      abort.current?.abort();
      clearInterval(typer.current);
    },
    [],
  );

  const stopAll = () => {
    abort.current?.abort();
    abort.current = null;
    clearInterval(typer.current);
  };

  /** Canned answers type out quickly, like the live feed. */
  const pick = (i: number) => {
    stopAll();
    sfx.blip();
    const { q, a } = PUNDIT_QA[i];
    track("pundit_asked", { question: q, canned: true });
    if (calm) {
      setEx({ q, a, status: "done", chip: i });
      return;
    }
    let n = 0;
    setEx({ q, a: "", status: "typing", chip: i });
    typer.current = setInterval(() => {
      n = Math.min(a.length, n + 3);
      setEx({ q, a: a.slice(0, n), status: n >= a.length ? "done" : "typing", chip: i });
      if (n >= a.length) clearInterval(typer.current);
    }, TYPE_MS);
  };

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    const q = draft.replace(/\s+/g, " ").trim();
    stopAll();
    track("pundit_asked", { question: q.slice(0, QUESTION_MAX), canned: false, length: q.length });
    if (q.length < QUESTION_MIN || q.length > QUESTION_MAX) {
      track("pundit_answered", { status: "error", error: "invalid" });
      setEx({ q: q || "…", a: PUNDIT_COPY.errors.invalid, status: "error", chip: null });
      return;
    }
    sfx.blip();
    setDraft("");
    setEx({ q, a: "", status: "streaming", chip: null });
    const ctrl = new AbortController();
    abort.current = ctrl;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch("/api/pundit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, world: world.id }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const code = await readError(res);
        track("pundit_answered", { status: "error", error: code, http: res.status });
        setEx({ q, a: PUNDIT_COPY.errors[code], status: "error", chip: null });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setEx({ q, a: answer, status: "streaming", chip: null });
      }
      track("pundit_answered", { status: answer.trim() ? "done" : "error", length: answer.trim().length });
      setEx({ q, a: answer.trim() || PUNDIT_COPY.errors.failed, status: answer.trim() ? "done" : "error", chip: null });
    } catch (err) {
      // aborted because the visitor asked something else: nothing to show
      if ((err as Error).name === "AbortError" && !timedOut) return;
      track("pundit_answered", { status: "error", error: timedOut ? "timeout" : "failed" });
      setEx({ q, a: PUNDIT_COPY.errors.failed, status: "error", chip: null });
    } finally {
      clearTimeout(timeout);
      if (abort.current === ctrl) abort.current = null;
    }
  };

  const busy = ex.status === "streaming";

  return (
    <section id="pundit" aria-labelledby="pundit-title" className="wrap section">
      <div className="eyebrow">{world.sections.pundit.kicker}</div>
      <h2 id="pundit-title" className="section-title va-reveal">
        Ask the {world.assistant}
      </h2>
      <div className={`${styles.studio} va-reveal`} data-detect="pundit 0.94">
        <div className={styles.desk}>
          <div className={styles.monitor} ref={monitorRef}>
            <div className={styles.bob}>
              <Sprite scale={3} glance={{ duration: 15, delay: -4 }} unmask={unmask} />
            </div>
          </div>
          <div className={styles.name}>The {world.assistant}</div>
          <div className={styles.blurb}>{PUNDIT_COPY.intro}</div>
        </div>

        <div className={styles.chat} data-ph-mask>
          <div className={styles.chips} role="group" aria-label="Suggested questions">
            {PUNDIT_QA.map((x, i) => (
              <button
                key={x.q}
                type="button"
                className={`${styles.chip} va-press`}
                aria-pressed={ex.chip === i}
                onClick={() => pick(i)}
              >
                {x.q}
              </button>
            ))}
          </div>
          <div className={styles.question}>{ex.q}</div>
          {/* screen readers get the finished answer once, not every typed or streamed chunk */}
          <p className="sr-only" aria-live="polite">
            {ex.status === "done" || ex.status === "error" ? ex.a : busy ? PUNDIT_COPY.thinking : ""}
          </p>
          <div className={`${styles.answer} ${ex.status === "error" ? styles.answerError : ""}`} aria-busy={busy}>
            <div className={styles.answerLabel}>{world.assistant} · live</div>
            <div>
              {ex.a || (busy ? PUNDIT_COPY.thinking : "")}
              <span className={styles.cursor} aria-hidden="true" />
            </div>
          </div>
          <form className={styles.form} onSubmit={ask}>
            <label htmlFor="pundit-q" className="sr-only">
              {PUNDIT_COPY.label}
            </label>
            <input
              id="pundit-q"
              type="text"
              value={draft}
              maxLength={QUESTION_MAX}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={PUNDIT_COPY.placeholder}
              className={styles.input}
              autoComplete="off"
              enterKeyHint="send"
            />
            <button type="submit" className={`btn btn-accent va-press ${styles.ask}`} disabled={busy}>
              {PUNDIT_COPY.ask}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
