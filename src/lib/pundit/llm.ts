import OpenAI from "openai";
import type { PunditErrorCode } from "@/content/pundit";
import type { WorldId } from "@/content/worlds";
import { PUNDIT_SYSTEM, personaFor } from "./prompt";

/** The smallest current OpenAI model; gpt-5-nano was cheaper but often returned nothing. Override with PUNDIT_MODEL. */
export const DEFAULT_PUNDIT_MODEL = "gpt-5.4-nano";
/** Hard cap on what one answer can cost: includes any reasoning tokens. */
const MAX_OUTPUT_TOKENS = 400;
/**
 * Lowest reasoning effort each model family accepts: the original GPT-5 models take "minimal",
 * later GPT-5.x take "none". PUNDIT_EFFORT overrides it.
 */
export function effortFor(model: string, override = process.env.PUNDIT_EFFORT): "minimal" | "none" | "low" {
  if (override === "minimal" || override === "none" || override === "low") return override;
  return /^gpt-5-/.test(model) ? "minimal" : "none";
}
const REFUSAL_LINE = "That one's not in my notes. Ask me about his projects or his work instead.";

export class PunditError extends Error {
  constructor(
    readonly code: PunditErrorCode,
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function toPunditError(err: unknown): PunditError {
  if (err instanceof PunditError) return err;
  if (err instanceof OpenAI.AuthenticationError || err instanceof OpenAI.PermissionDeniedError) {
    return new PunditError("not_configured", 503, `OpenAI auth failed: ${err.status}`);
  }
  if (err instanceof OpenAI.RateLimitError) return new PunditError("busy", 503, "OpenAI rate limit or quota");
  if (err instanceof OpenAI.APIConnectionError) return new PunditError("failed", 502, "OpenAI connection failed");
  if (err instanceof OpenAI.APIError) return new PunditError("failed", 502, `OpenAI API error ${err.status}`);
  return new PunditError("failed", 500, err instanceof Error ? err.message : "Unknown error");
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new PunditError("not_configured", 503, "OPENAI_API_KEY is not set");
  client ??= new OpenAI({ maxRetries: 1, timeout: 30_000 });
  return client;
}

/**
 * Ask the model and get the answer back as text chunks, in the current world's voice.
 * The first chunk is awaited by the caller so API errors become proper HTTP statuses
 * instead of a half-written stream.
 */
export async function* askPundit(question: string, world: WorldId, signal?: AbortSignal): AsyncGenerator<string> {
  const model = process.env.PUNDIT_MODEL || DEFAULT_PUNDIT_MODEL;
  const stream = await getClient().responses.create(
    {
      model,
      // shared rules and facts first (a stable prefix OpenAI can cache), the world's character last
      instructions: `${PUNDIT_SYSTEM}\n\n${personaFor(world)}`,
      input: [{ role: "user", content: question }],
      max_output_tokens: MAX_OUTPUT_TOKENS,
      // short factual answers: barely any thinking keeps cost and latency down
      reasoning: { effort: effortFor(model) },
      prompt_cache_key: "pundit",
      store: false,
      stream: true,
    },
    { signal },
  );

  let sent = false;
  for await (const event of stream) {
    if (event.type === "response.output_text.delta" && event.delta) {
      sent = true;
      yield event.delta;
    } else if (event.type === "response.failed" || event.type === "error") {
      throw new PunditError("failed", 502, `OpenAI stream ${event.type}`);
    }
  }
  if (!sent) yield REFUSAL_LINE;
}
