import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const stream = vi.fn();
const limit = vi.fn();

vi.mock("@anthropic-ai/sdk", async (orig) => {
  const real = (await orig<typeof import("@anthropic-ai/sdk")>()).default;
  class FakeAnthropic extends real {
    constructor() {
      super({ apiKey: "test-key" });
      Object.defineProperty(this, "beta", { value: { messages: { stream } } });
    }
  }
  return { default: FakeAnthropic };
});

vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    prefix: string;
    constructor(opts: { prefix: string }) {
      this.prefix = opts.prefix;
    }
    limit(key: string) {
      return limit(this.prefix, key);
    }
    static slidingWindow() {
      return {};
    }
    static fixedWindow() {
      return {};
    }
  }
  return { Ratelimit };
});

const { askPundit, DEFAULT_PUNDIT_MODEL } = await import("@/lib/pundit/claude");
const { createLimiter } = await import("@/lib/pundit/rateLimit");

function fakeStream(texts: string[], stopReason = "end_turn") {
  return {
    async *[Symbol.asyncIterator]() {
      yield { type: "message_start" };
      for (const text of texts) yield { type: "content_block_delta", delta: { type: "text_delta", text } };
    },
    finalMessage: async () => ({ stop_reason: stopReason }),
  };
}

async function collect(gen: AsyncGenerator<string>) {
  const out: string[] = [];
  for await (const t of gen) out.push(t);
  return out.join("");
}

describe("askPundit", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    stream.mockReset();
    process.env.ANTHROPIC_API_KEY = "test-key";
    delete process.env.PUNDIT_MODEL;
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("streams text deltas with low effort, a cached system prompt and refusal fallbacks", async () => {
    stream.mockReturnValue(fakeStream(["Top ", "corner."]));
    expect(await collect(askPundit("Best goal?"))).toBe("Top corner.");
    const [params] = stream.mock.calls[0];
    expect(params.model).toBe(DEFAULT_PUNDIT_MODEL);
    expect(params.output_config).toEqual({ effort: "low" });
    expect(params.fallbacks).toBe("default");
    expect(params.betas).toContain("server-side-fallback-2026-07-01");
    expect(params.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(params.messages).toEqual([{ role: "user", content: "Best goal?" }]);
  });

  it("uses PUNDIT_MODEL when set", async () => {
    process.env.PUNDIT_MODEL = "claude-sonnet-5-5";
    stream.mockReturnValue(fakeStream(["ok"]));
    await collect(askPundit("Hi there"));
    expect(stream.mock.calls[0][0].model).toBe("claude-sonnet-5-5");
  });

  it("says something polite when the model declines", async () => {
    stream.mockReturnValue(fakeStream([], "refusal"));
    expect(await collect(askPundit("Something odd"))).toMatch(/not for the studio/);
  });

  it("reports a missing API key as not configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(collect(askPundit("Hello there"))).rejects.toMatchObject({ code: "not_configured", status: 503 });
  });
});

describe("Upstash rate limiter", () => {
  const env = { UPSTASH_REDIS_REST_URL: "https://x.upstash.io", UPSTASH_REDIS_REST_TOKEN: "t" } as unknown as NodeJS.ProcessEnv;
  const soon = () => Date.now() + 30_000;

  beforeEach(() => limit.mockReset());

  it("allows a question when all three windows pass", async () => {
    limit.mockResolvedValue({ success: true, reset: soon() });
    expect(await createLimiter(env).check("abc")).toEqual({ ok: true });
    expect(limit.mock.calls.map((c) => c[0])).toEqual(["pundit:m", "pundit:d", "pundit:g"]);
  });

  it("blocks on the per-minute window", async () => {
    limit.mockResolvedValueOnce({ success: false, reset: soon() });
    const r = await createLimiter(env).check("abc");
    expect(r).toMatchObject({ ok: false, reason: "rate_limited" });
  });

  it("blocks on the daily window", async () => {
    limit.mockResolvedValueOnce({ success: true, reset: soon() }).mockResolvedValueOnce({ success: false, reset: soon() });
    expect(await createLimiter(env).check("abc")).toMatchObject({ ok: false, reason: "rate_limited" });
  });

  it("reports the global cap as busy", async () => {
    limit
      .mockResolvedValueOnce({ success: true, reset: soon() })
      .mockResolvedValueOnce({ success: true, reset: soon() })
      .mockResolvedValueOnce({ success: false, reset: soon() });
    const r = await createLimiter(env).check("abc");
    expect(r).toMatchObject({ ok: false, reason: "busy" });
    if (!r.ok) expect(r.retryAfter).toBeGreaterThan(0);
  });

  it("accepts Vercel KV-style variable names too", async () => {
    limit.mockResolvedValue({ success: true, reset: soon() });
    const kv = { KV_REST_API_URL: "https://x", KV_REST_API_TOKEN: "t" } as unknown as NodeJS.ProcessEnv;
    expect(await createLimiter(kv).check("k")).toEqual({ ok: true });
    expect(limit).toHaveBeenCalled();
  });
});
