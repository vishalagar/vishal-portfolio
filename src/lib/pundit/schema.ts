import { z } from "zod";
import { DEFAULT_WORLD, WORLD_IDS, type WorldId } from "@/content/worlds";

export const QUESTION_MIN = 3;
export const QUESTION_MAX = 280;

// Control characters (except tab/newline) are stripped before validation.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const questionSchema = z.object({
  question: z
    .string()
    .transform((s) => s.replace(CONTROL, "").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(QUESTION_MIN).max(QUESTION_MAX)),
  /** Which world the visitor is in: picks the assistant's voice. */
  world: z.enum(WORLD_IDS).optional(),
});

export type QuestionInput = z.infer<typeof questionSchema>;

export function parseQuestion(body: unknown): { ok: true; question: string; world: WorldId } | { ok: false } {
  const parsed = questionSchema.safeParse(body);
  return parsed.success ? { ok: true, question: parsed.data.question, world: parsed.data.world ?? DEFAULT_WORLD } : { ok: false };
}
