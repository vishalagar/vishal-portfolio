/** PaceCoach pace run sounds (from the mock): synthesised, and silent while site sound is off. */
import { gated, tone } from "@/lib/sound";

export const paceSfx = {
  /** Soft footfall; played every second step. */
  footstep: gated(() => tone("sine", 120, 80, 0.04, 0.05)),
  /** Km on pace: rising beep. */
  kmGood: gated(() => tone("triangle", 660, 990, 0.12, 0.04)),
  /** Km too fast or too slow: low falling buzz. */
  kmBad: gated(() => tone("square", 330, 250, 0.12, 0.025)),
  /** Water gulp. */
  water: gated(() => tone("triangle", 660, 990, 0.15, 0.04)),
  /** Finish: two rising notes. */
  finish: gated(() => {
    tone("sine", 523, 523, 0.15, 0.05);
    tone("sine", 784, 784, 0.35, 0.05, 0.15);
  }),
};
