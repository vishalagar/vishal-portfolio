/** Label Rush sounds. Built on the shared WebAudio primitives; silent while sound is off. */
import { gated, tone } from "@/lib/sound";

export const labelSfx = {
  correct: gated(() => tone("triangle", 660, 990, 0.08, 0.04)),
  wrong: gated(() => tone("sawtooth", 240, 80, 0.3, 0.05)),
  /** Model retrained: rising C-E-G chime. */
  retrain: gated(() => {
    tone("triangle", 523, 523, 0.1, 0.04);
    tone("triangle", 659, 659, 0.1, 0.04, 0.1);
    tone("triangle", 784, 784, 0.2, 0.04, 0.2);
  }),
  /** End of the shift: a short falling phrase. */
  gameOver: gated(() => {
    tone("square", 440, 330, 0.14, 0.035);
    tone("square", 330, 220, 0.14, 0.035, 0.14);
    tone("triangle", 220, 110, 0.4, 0.045, 0.28);
  }),
};
