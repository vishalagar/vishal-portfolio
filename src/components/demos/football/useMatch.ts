"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { newMatch, shotPower, step, TICK_MS, type HumanInput, type MatchState } from "@/lib/engines/football";
import { mathRng } from "@/lib/engines/rng";
import { useInterval } from "@/lib/hooks/useActive";
import { EMPTY_PAD, type Pad } from "@/lib/play/pad";
import { pressed, released } from "@/components/play/padSources";
import { sfx } from "@/lib/sound";

type HoldKey = "up" | "down" | "left" | "right" | "sprint";

export interface InputQueue {
  keys: Readonly<Record<HoldKey, boolean>>;
  /** Ticks the shot button has been held, or null when it isn't. */
  charge: number | null;
  pass: boolean;
  release: boolean;
  tackle: boolean;
}

const NO_KEYS: Record<HoldKey, boolean> = { up: false, down: false, left: false, right: false, sprint: false };
export const EMPTY_INPUT: InputQueue = { keys: NO_KEYS, charge: null, pass: false, release: false, tackle: false };

/**
 * One tick of the shared controller: directions and R (sprint) are held; B queues a pass;
 * A down starts charging a shot when you have the ball (otherwise it's a tackle); A up shoots.
 */
export function readPad(q: InputQueue, pad: Pad, prev: Pad, hasBall: boolean): InputQueue {
  const keys = { up: pad.up, down: pad.down, left: pad.left, right: pad.right, sprint: pad.r };
  let next: InputQueue = { ...q, keys };
  if (pressed(pad, prev, "b")) next = { ...next, pass: true };
  if (pressed(pad, prev, "a")) next = hasBall ? { ...next, charge: next.charge ?? 0 } : { ...next, tackle: true };
  if (released(pad, prev, "a") && next.charge !== null) next = { ...next, release: true };
  return next;
}

function toHumanInput(q: InputQueue, charge: number | null): HumanInput {
  const k = q.keys;
  return {
    mx: (k.right ? 1 : 0) - (k.left ? 1 : 0),
    my: (k.down ? 1 : 0) - (k.up ? 1 : 0),
    sprint: k.sprint,
    shoot: q.release ? shotPower(charge) : null,
    pass: q.pass,
    tackle: q.tackle,
  };
}

/**
 * Owns the match loop. The authoritative state lives in a ref so the 30 Hz tick always sees the
 * latest match; React state mirrors it for rendering. In play mode the shared pad is read every tick.
 */
export function useMatch(active: boolean, human: boolean, pad: RefObject<Pad>) {
  const [view, setView] = useState(() => ({ g: newMatch(human ? "human" : "bot"), charge: null as number | null }));
  const game = useRef<MatchState>(view.g);
  const input = useRef<InputQueue>(EMPTY_INPUT);
  const prevPad = useRef<Pad>(EMPTY_PAD);

  const publish = useCallback((g: MatchState) => {
    game.current = g;
    setView({ g, charge: input.current.charge });
  }, []);

  const tick = useCallback(() => {
    const g = game.current;
    if (human) {
      const p = pad.current;
      const prev = prevPad.current;
      prevPad.current = p;
      if (g.over) {
        // A at full time: play again (the held A isn't read as a shot in the new match)
        if (pressed(p, prev, "a")) {
          input.current = EMPTY_INPUT;
          sfx.match("start");
          publish(newMatch("human"));
        }
        return;
      }
      input.current = readPad(input.current, p, prev, g.ball.owner === g.active);
    }
    if (g.over) return;
    const q = input.current;
    const charge = q.charge === null ? null : q.charge + 1;
    const out = step(g, human ? toHumanInput(q, charge) : null, mathRng);
    input.current =
      out.simulated && human
        ? { ...q, charge: q.release ? null : charge, pass: false, release: false, tackle: false }
        : { ...q, charge };
    out.events.forEach((e) => sfx.match(e));
    publish(out.g);
  }, [human, pad, publish]);

  useInterval(tick, active ? TICK_MS : null);

  return { g: view.g, charge: view.charge };
}
