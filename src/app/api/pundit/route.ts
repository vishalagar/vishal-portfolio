import { NextResponse } from "next/server";
import type { PunditErrorCode } from "@/content/pundit";
import { askPundit, toPunditError } from "@/lib/pundit/claude";
import { getLimiter } from "@/lib/pundit/rateLimit";
import { clientKey, isSameOrigin } from "@/lib/pundit/request";
import { parseQuestion } from "@/lib/pundit/schema";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BODY_BYTES = 2048;

function fail(code: PunditErrorCode, status: number, headers?: HeadersInit) {
  return NextResponse.json({ success: false, error: code }, { status, headers });
}

async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!isSameOrigin(req.headers)) return fail("invalid", 403);
  // reject oversized bodies before buffering them
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return fail("invalid", 413);

  const parsed = parseQuestion(await readJson(req));
  if (!parsed.ok) return fail("invalid", 400);

  let limit;
  try {
    limit = await getLimiter().check(clientKey(req.headers));
  } catch (err) {
    console.error("[pundit] rate limiter unavailable", { message: err instanceof Error ? err.message : String(err) });
    return fail("busy", 503);
  }
  if (!limit.ok) {
    const status = limit.reason === "not_configured" ? 503 : 429;
    return fail(limit.reason, status, { "Retry-After": String(limit.retryAfter) });
  }

  const chunks = askPundit(parsed.question, req.signal);
  let first: IteratorResult<string>;
  try {
    first = await chunks.next();
  } catch (err) {
    const e = toPunditError(err);
    console.error("[pundit] request failed", { code: e.code, message: e.message });
    return fail(e.code, e.status);
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encoder.encode(first.value));
        for await (const text of chunks) controller.enqueue(encoder.encode(text));
      } catch (err) {
        // the visitor navigated away or asked something else: nothing to report
        if (req.signal.aborted) return;
        const e = toPunditError(err);
        console.error("[pundit] stream interrupted", { code: e.code, message: e.message });
        controller.enqueue(encoder.encode(" …and we've lost the feed. Try again in a moment."));
      } finally {
        if (!req.signal.aborted) controller.close();
      }
    },
    async cancel() {
      await chunks.return(undefined);
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
