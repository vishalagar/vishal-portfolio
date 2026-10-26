import Anthropic from "@anthropic-ai/sdk";
import type { PunditErrorCode } from "@/content/pundit";
import { PUNDIT_SYSTEM } from "./prompt";

/** Override per deployment with PUNDIT_MODEL. */
export const DEFAULT_PUNDIT_MODEL = "claude-opus-5-5";
const MAX_TOKENS = 1024;
const REFUSAL_LINE = "That one's not for the studio, I'm afraid. Ask me about his projects or his work instead.";

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
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new PunditError("not_configured", 503, `Anthropic auth failed: ${err.status}`);
  }
  if (err instanceof Anthropic.RateLimitError) return new PunditError("busy", 503, "Anthropic rate limit");
  if (err instanceof Anthropic.APIConnectionError) return new PunditError("failed", 502, "Anthropic connection failed");
  if (err instanceof Anthropic.APIError) return new PunditError("failed", 502, `Anthropic API error ${err.status}`);
  return new PunditError("failed", 500, err instanceof Error ? err.message : "Unknown error");
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new PunditError("not_configured", 503, "ANTHROPIC_API_KEY is not set");
  client ??= new Anthropic({ maxRetries: 1, timeout: 30_000 });
  return client;
}

/**
 * Ask Claude and get the answer back as text chunks.
 * The first chunk is awaited by the caller so API errors become proper HTTP statuses
 * instead of a half-written stream.
 */
export async function* askPundit(question: string, signal?: AbortSignal): AsyncGenerator<string> {
  const stream = getClient().beta.messages.stream(
    {
      model: process.env.PUNDIT_MODEL || DEFAULT_PUNDIT_MODEL,
      max_tokens: MAX_TOKENS,
      // short, factual chat answers: low effort is plenty and keeps cost and latency down
      output_config: { effort: "low" },
      // if a safety classifier declines, the API re-runs the request on a fallback model
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: PUNDIT_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: question }],
    },
    { signal },
  );

  let sent = false;
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta" && event.delta.text) {
      sent = true;
      yield event.delta.text;
    }
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal" && !sent) yield REFUSAL_LINE;
}
