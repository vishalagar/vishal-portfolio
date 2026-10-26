import { describe, expect, it } from "vitest";
import {
  createGen,
  GEN_SIZE,
  GEN_STEPS,
  GEN_TARGETS,
  genPixels,
  hashNoise,
  nextSample,
  stepGen,
  targetPixel,
  type GenState,
} from "@/lib/engines/gen";
import { hexLine, stageAt, stageView, STAGE_COPY } from "@/lib/engines/printsafe";

describe("image generation demo engine", () => {
  it("denoises over 20 steps and signals when the image is done", () => {
    let s = createGen();
    const events: string[] = [];
    for (let i = 0; i < GEN_STEPS; i++) {
      const out = stepGen(s);
      s = out.state;
      events.push(...out.events);
    }
    expect(s.t).toBe(0);
    expect(events).toEqual(["done"]);
  });

  it("renders the exact target colours once finished", () => {
    const done: GenState = { ...createGen(), t: 0 };
    const px = genPixels(done);
    expect(px).toHaveLength(GEN_SIZE * GEN_SIZE);
    expect(px[5 * GEN_SIZE + 11]).toEqual(targetPixel(0, 11, 5));
  });

  it("starts from noise, not the target", () => {
    const px = genPixels(createGen());
    const same = px.filter((p, i) => {
      const t = targetPixel(0, i % GEN_SIZE, Math.floor(i / GEN_SIZE));
      return p[0] === t[0] && p[1] === t[1] && p[2] === t[2];
    });
    expect(same.length).toBeLessThan(10);
  });

  it("holds the finished image for 22 ticks, then alternates crack and clean", () => {
    let s: GenState = { ...createGen(), t: 0 };
    for (let i = 0; i < 22; i++) s = stepGen(s).state;
    expect(s.hold).toBe(22);
    s = stepGen(s).state;
    expect(s.t).toBe(GEN_STEPS);
    expect(s.cls).toBe(1);
    expect(nextSample(s).cls).toBe(0);
    expect(GEN_TARGETS[1].rows.join("")).not.toContain("K");
  });

  it("hash noise is deterministic and in range", () => {
    expect(hashNoise(123)).toBe(hashNoise(123));
    for (let i = 0; i < 100; i++) {
      const v = hashNoise(i * 977);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("PrintSafe demo timeline", () => {
  it("maps elapsed time to stages", () => {
    expect(stageAt(0)).toBe(1);
    expect(stageAt(1399)).toBe(1);
    expect(stageAt(1400)).toBe(2);
    expect(stageAt(3400)).toBe(3);
    expect(stageAt(4700)).toBe(4);
    expect(stageAt(6000)).toBe(5);
    expect(stageAt(99999)).toBe(5);
  });

  it("shows the right pieces at each stage", () => {
    expect(stageView(0)).toMatchObject({ showButton: true, showDoc: true, locked: false });
    expect(stageView(2)).toMatchObject({ showLink: true, locked: true });
    expect(stageView(3)).toMatchObject({ printed: true, showLink: true });
    expect(stageView(4)).toMatchObject({ shredding: true, showDoc: false });
    expect(stageView(5)).toMatchObject({ gone: true, showButton: true });
    expect(STAGE_COPY[5].button).toBe("Run it again");
  });

  it("scrambles lines into grouped hex, deterministically", () => {
    const line = hexLine(0, 7);
    expect(line).toMatch(/^([0-9a-f]{4} ){4}$/);
    expect(hexLine(0, 7)).toBe(line);
    expect(hexLine(0, 8)).not.toBe(line);
  });
});
