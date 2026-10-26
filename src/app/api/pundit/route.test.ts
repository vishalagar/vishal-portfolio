import { beforeEach, describe, expect, it, vi } from "vitest";

const ask = vi.fn<(q: string) => AsyncGenerator<string>>();
const check = vi.fn();

vi.mock("@/lib/pundit/claude", async (orig) => {
  const real = await orig<typeof import("@/lib/pundit/claude")>();
  return { ...real, askPundit: (q: string) => ask(q) };
});
vi.mock("@/lib/pundit/rateLimit", () => ({ getLimiter: () => ({ check }) }));

const { POST } = await import("./route");
const { PunditError } = await import("@/lib/pundit/claude");

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://va.dev/api/pundit", {
    method: "POST",
    headers: { origin: "https://va.dev", host: "va.dev", "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function* chunks(...parts: string[]) {
  for (const p of parts) yield p;
}

describe("POST /api/pundit", () => {
  beforeEach(() => {
    ask.mockReset();
    check.mockReset();
    check.mockResolvedValue({ ok: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("streams the Pundit's answer as plain text", async () => {
    ask.mockReturnValue(chunks("Top ", "corner."));
    const res = await POST(req({ question: "Best goal this season?" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(await res.text()).toBe("Top corner.");
    expect(ask).toHaveBeenCalledWith("Best goal this season?");
  });

  it("rejects cross-site requests", async () => {
    const res = await POST(req({ question: "Hello there" }, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("rejects invalid and oversized bodies", async () => {
    expect((await POST(req({ question: "x" }))).status).toBe(400);
    expect((await POST(req("not json"))).status).toBe(400);
    expect((await POST(req({ question: "a".repeat(3000) }))).status).toBe(400);
    expect(ask).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when the visitor is rate limited", async () => {
    check.mockResolvedValue({ ok: false, reason: "rate_limited", retryAfter: 42 });
    const res = await POST(req({ question: "What does he do?" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("42");
    expect(await res.json()).toEqual({ success: false, error: "rate_limited" });
  });

  it("rejects a declared oversized body before reading it", async () => {
    const res = await POST(req({ question: "What does he do?" }, { "content-length": "999999" }));
    expect(res.status).toBe(413);
  });

  it("returns 503 busy when the rate limiter is down", async () => {
    check.mockRejectedValue(new Error("redis timeout"));
    const res = await POST(req({ question: "What does he do?" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ success: false, error: "busy" });
  });

  it("returns 503 when rate limiting isn't configured in production", async () => {
    check.mockResolvedValue({ ok: false, reason: "not_configured", retryAfter: 3600 });
    const res = await POST(req({ question: "What does he do?" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ success: false, error: "not_configured" });
  });

  it("returns 503 when the API key isn't configured", async () => {
    ask.mockImplementation(async function* () {
      throw new PunditError("not_configured", 503, "no key");
    });
    const res = await POST(req({ question: "What does he do?" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ success: false, error: "not_configured" });
  });

  it("ends the stream politely if the feed drops mid-answer", async () => {
    ask.mockImplementation(async function* () {
      yield "He built";
      throw new Error("socket closed");
    });
    const res = await POST(req({ question: "What does he do?" }));
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/^He built …and we've lost the feed/);
  });
});
