/** PrintSafe demo: one click runs encrypt → link → print → shred → gone. */
export type PrintSafeStage = 0 | 1 | 2 | 3 | 4 | 5;

/** When each stage starts, in ms after "Encrypt & create link" is pressed. */
export const STAGE_STARTS: ReadonlyArray<readonly [PrintSafeStage, number]> = [
  [1, 0],
  [2, 1400],
  [3, 3400],
  [4, 4700],
  [5, 6000],
];

export const SCRAMBLE_MS = 90;

export const STAGE_COPY: Record<PrintSafeStage, { head: string; sub: string; button: string }> = {
  0: { head: "Share privately. Delete automatically.", sub: "A visa file is about to go to a print shop.", button: "Encrypt & create link" },
  1: { head: "Encrypting in your browser", sub: "AES-256-GCM. The server only ever sees this.", button: "" },
  2: { head: "One-time link ready", sub: "The key sits after the #, so it never reaches the server.", button: "" },
  3: { head: "Shop opens it once", sub: "Decrypted on their screen, sent to the printer.", button: "" },
  4: { head: "Viewed. Shredding.", sub: "Ciphertext deleted from storage.", button: "" },
  5: { head: "Gone. Zero trace.", sub: "Nothing left on anyone’s phone.", button: "Run it again" },
};

/** Stage shown `ms` after the run started. */
export function stageAt(ms: number): PrintSafeStage {
  let stage: PrintSafeStage = 1;
  for (const [s, start] of STAGE_STARTS) if (ms >= start) stage = s;
  return stage;
}

export function stageView(stage: PrintSafeStage) {
  return {
    showButton: stage === 0 || stage === 5,
    showDoc: stage <= 3,
    locked: stage >= 1 && stage <= 3,
    printed: stage === 3,
    shredding: stage === 4,
    gone: stage === 5,
    showLink: stage === 2 || stage === 3,
  };
}

/** One line of fake ciphertext: 16 hex digits in groups of four. Deterministic per (line, seed). */
export function hexLine(i: number, seed: number): string {
  let n = (i + 1) * 2654435761 + seed * 40503;
  let out = "";
  for (let k = 0; k < 16; k++) {
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    out += ((n >>> 0) % 16).toString(16);
    if (k % 4 === 3) out += " ";
  }
  return out;
}
