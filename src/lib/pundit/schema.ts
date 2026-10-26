import { z } from "zod";

export const QUESTION_MIN = 3;
export const QUESTION_MAX = 280;

// Control characters (except tab/newline) are stripped before validation.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const questionSchema = z.object({
  question: z
    .string()
    .transform((s) => s.replace(CONTROL, "").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(QUESTION_MIN).max(QUESTION_MAX)),
});

export type QuestionInput = z.infer<typeof questionSchema>;

export function parseQuestion(body: unknown): { ok: true; question: string } | { ok: false } {
  const parsed = questionSchema.safeParse(body);
  return parsed.success ? { ok: true, question: parsed.data.question } : { ok: false };
}
