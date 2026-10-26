import { describe, expect, it, vi } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { createLimiter, getLimiter, limitConfigFromEnv, memoryLimiter } from "@/lib/pundit/rateLimit";
import { clientKey, isSameOrigin } from "@/lib/pundit/request";
import { parseQuestion } from "@/lib/pundit/schema";
import { PunditError, toPunditError } from "@/lib/pundit/claude";
import { PUNDIT_SYSTEM } from "@/lib/pundit/prompt";

describe("question validation", () => {
  it("accepts a normal question and tidies whitespace", () => {
    expect(parseQuestion({ question: "  What   is PrintSafe?\n" })).toEqual({ ok: true, question: "What is PrintSafe?" });
  });

  it("strips control characters", () => {
    expect(parseQuestion({ question: "Hi\u0000 there\u0007" })).toEqual({ ok: true, question: "Hi there" });
  });

  it("rejects missing, too short, too long and non-string questions", () => {
    expect(parseQuestion(null).ok).toBe(false);
    expect(parseQuestion({}).ok).toBe(false);
    expect(parseQuestion({ question: "hi" }).ok).toBe(false);
    expect(parseQuestion({ question: "x".repeat(281) }).ok).toBe(false);
    expect(parseQuestion({ question: 42 }).ok).toBe(false);
  });
});

describe("rate limiting", () => {
  const cfg = { perMinute: 2, perDay: 3, globalPerDay: 5 };

  it("allows a few questions a minute, then asks the visitor to wait", async () => {
    let t = 0;
    const lim = memoryLimiter(cfg, () => t);
    expect((await lim.check("a")).ok).toBe(true);
    expect((await lim.check("a")).ok).toBe(true);
    const blocked = await lim.check("a");
    expect(blocked).toMatchObject({ ok: false, reason: "rate_limited" });
    t += 61_000;
    expect((await lim.check("a")).ok).toBe(true);
    t += 61_000;
    expect(await lim.check("a")).toMatchObject({ ok: false, reason: "rate_limited" });
  });

  it("enforces a global daily cap across visitors", async () => {
    const t = 0;
    const lim = memoryLimiter(cfg, () => t);
    for (const k of ["a", "b", "c", "d", "e"]) expect((await lim.check(k)).ok).toBe(true);
    expect(await lim.check("f")).toMatchObject({ ok: false, reason: "busy" });
  });

  it("keeps evicting the oldest visitor once the key table is full", async () => {
    const lim = memoryLimiter({ perMinute: 1, perDay: 1, globalPerDay: 100 }, () => 0, 2);
    for (const k of ["a", "b", "c", "d"]) expect((await lim.check(k)).ok).toBe(true);
    // "a" was evicted twice over, so it starts fresh; "d" is still limited
    expect((await lim.check("a")).ok).toBe(true);
    expect((await lim.check("d")).ok).toBe(false);
  });

  it("refuses typed questions in production without a shared store, unless allowed", async () => {
    const prod = { NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await createLimiter(prod).check("x")).toMatchObject({ ok: false, reason: "not_configured" });
    spy.mockRestore();
    const allowed = { NODE_ENV: "production", PUNDIT_ALLOW_MEMORY_LIMITS: "1" } as unknown as NodeJS.ProcessEnv;
    expect((await createLimiter(allowed).check("x")).ok).toBe(true);
  });

  it("reads limits from the environment with safe fallbacks", () => {
    expect(limitConfigFromEnv({ PUNDIT_PER_MINUTE: "9", PUNDIT_DAILY_CAP: "nope" } as unknown as NodeJS.ProcessEnv)).toEqual({
      perMinute: 9,
      perDay: 30,
      globalPerDay: 300,
    });
  });

  it("uses the in-memory limiter when Upstash isn't configured", async () => {
    const lim = createLimiter({} as unknown as NodeJS.ProcessEnv);
    expect((await lim.check("zzz")).ok).toBe(true);
    expect(getLimiter()).toBe(getLimiter());
  });
});

describe("request helpers", () => {
  const ON_VERCEL = { VERCEL: "1" } as unknown as NodeJS.ProcessEnv;
  const OFF_VERCEL = {} as unknown as NodeJS.ProcessEnv;

  it("hashes the client IP instead of keeping it", () => {
    const key = clientKey(new Headers({ "x-vercel-forwarded-for": "203.0.113.9" }), ON_VERCEL);
    expect(key).toMatch(/^[0-9a-f]{32}$/);
    expect(key).not.toContain("203");
  });

  it("on Vercel, keys on the platform header and ignores spoofable x-forwarded-for entries", () => {
    const real = clientKey(new Headers({ "x-vercel-forwarded-for": "198.51.100.7" }), ON_VERCEL);
    const spoofed = new Headers({ "x-vercel-forwarded-for": "198.51.100.7", "x-forwarded-for": "1.2.3.4, 9.9.9.9" });
    expect(clientKey(spoofed, ON_VERCEL)).toBe(real);
  });

  it("off Vercel, ignores platform headers a client could forge and uses the last proxy hop", () => {
    const real = clientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 198.51.100.7" }), OFF_VERCEL);
    const forged = new Headers({
      "x-vercel-forwarded-for": "10.0.0.1",
      "x-real-ip": "10.0.0.2",
      "x-forwarded-for": "1.2.3.4, 198.51.100.7",
    });
    expect(clientKey(forged, OFF_VERCEL)).toBe(real);
    expect(clientKey(new Headers({ "x-forwarded-for": "198.51.100.7" }), OFF_VERCEL)).toBe(real);
    expect(clientKey(new Headers(), OFF_VERCEL)).toMatch(/^[0-9a-f]{32}$/);
  });

  it("accepts same-origin posts only", () => {
    expect(isSameOrigin(new Headers({ origin: "https://va.dev", host: "va.dev" }))).toBe(true);
    expect(isSameOrigin(new Headers({ origin: "https://evil.example", host: "va.dev" }))).toBe(false);
    expect(isSameOrigin(new Headers({ host: "va.dev" }))).toBe(false);
    expect(isSameOrigin(new Headers({ origin: "not a url", host: "va.dev" }))).toBe(false);
  });
});

describe("error mapping", () => {
  it("maps SDK errors to visitor-facing codes", () => {
    const headers = new Headers();
    expect(toPunditError(new Anthropic.RateLimitError(429, {}, "slow", headers)).code).toBe("busy");
    expect(toPunditError(new Anthropic.AuthenticationError(401, {}, "no", headers)).code).toBe("not_configured");
    expect(toPunditError(new Anthropic.APIConnectionError({ message: "down" })).code).toBe("failed");
    expect(toPunditError(new Anthropic.InternalServerError(500, {}, "boom", headers)).status).toBe(502);
    expect(toPunditError(new Error("x")).status).toBe(500);
    const own = new PunditError("not_configured", 503, "no key");
    expect(toPunditError(own)).toBe(own);
  });
});

describe("system prompt", () => {
  it("is grounded in the facts and keeps private details out", () => {
    expect(PUNDIT_SYSTEM).toContain("Samsung Electro-Mechanics");
    expect(PUNDIT_SYSTEM).toContain("<facts>");
    expect(PUNDIT_SYSTEM).not.toMatch(/\+91|\b\d{10}\b/);
  });
});
