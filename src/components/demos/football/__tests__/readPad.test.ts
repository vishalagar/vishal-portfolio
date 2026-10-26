import { describe, expect, it } from "vitest";
import { EMPTY_PAD } from "@/lib/play/pad";
import { EMPTY_INPUT, readPad } from "../useMatch";

const pad = (over: Partial<typeof EMPTY_PAD>) => ({ ...EMPTY_PAD, ...over });

describe("football: shared pad to match input", () => {
  it("holds directions and maps R to sprint", () => {
    const q = readPad(EMPTY_INPUT, pad({ up: true, right: true, r: true }), EMPTY_PAD, false);
    expect(q.keys).toEqual({ up: true, down: false, left: false, right: true, sprint: true });
  });

  it("B queues one pass on the press, not while held", () => {
    const q1 = readPad(EMPTY_INPUT, pad({ b: true }), EMPTY_PAD, true);
    expect(q1.pass).toBe(true);
    const q2 = readPad({ ...q1, pass: false }, pad({ b: true }), pad({ b: true }), true);
    expect(q2.pass).toBe(false);
  });

  it("A with the ball charges a shot and fires on release", () => {
    const down = readPad(EMPTY_INPUT, pad({ a: true }), EMPTY_PAD, true);
    expect(down.charge).toBe(0);
    expect(down.tackle).toBe(false);
    const up = readPad({ ...down, charge: 12 }, EMPTY_PAD, pad({ a: true }), true);
    expect(up.release).toBe(true);
    expect(up.charge).toBe(12);
  });

  it("A without the ball is a tackle, and letting go does nothing", () => {
    const down = readPad(EMPTY_INPUT, pad({ a: true }), EMPTY_PAD, false);
    expect(down.tackle).toBe(true);
    expect(down.charge).toBeNull();
    const up = readPad(down, EMPTY_PAD, pad({ a: true }), false);
    expect(up.release).toBe(false);
  });

  it("does not mutate the queue it was given", () => {
    const before = { ...EMPTY_INPUT };
    readPad(EMPTY_INPUT, pad({ a: true, b: true, left: true }), EMPTY_PAD, true);
    expect(EMPTY_INPUT).toEqual(before);
  });
});
