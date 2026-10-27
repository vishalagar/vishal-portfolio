import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
const limit = vi.fn();

vi.mock("openai", async (orig) => {
  const real = (await orig<typeof import("openai")>()).default;
  class FakeOpenAI extends real {
    constructor() {
      super({ apiKey: "test-key" });
      Object.defineProperty(this, "responses", { value: { create } });
    }
  }
  return { default: FakeOpenAI };
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

const { askPundit, effortFor, DEFAULT_PUNDIT_MODEL } = await import("@/lib/pundit/llm");
const { createLimiter } = await import("@/lib/pundit/rateLimit");

function fakeStream(texts: string[], fail = false) {
  return {
    async *[Symbol.asyncIterator]() {
      yield { type: "response.created" };
      for (const delta of texts) yield { type: "response.output_text.delta", delta };
      if (fail) yield { type: "response.failed" };
    },
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
    create.mockReset();
    process.env.OPENAI_API_KEY = "test-key";
    delete process.env.PUNDIT_MODEL;
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("streams text deltas from the cheapest model with capped output and the world's voice", async () => {
    create.mockResolvedValue(fakeStream(["Top ", "corner."]));
    expect(await collect(askPundit("Best goal?", "football"))).toBe("Top corner.");
    const [params] = create.mock.calls[0];
    expect(params.model).toBe(DEFAULT_PUNDIT_MODEL);
    expect(DEFAULT_PUNDIT_MODEL).toBe("gpt-5.4-nano");
    expect(params.reasoning).toEqual({ effort: "none" });
    expect(params.max_output_tokens).toBeLessThanOrEqual(400);
    expect(params.stream).toBe(true);
    expect(params.store).toBe(false);
    expect(params.instructions).toMatch(/Only answer questions about Vishal/);
    expect(params.instructions).toMatch(/Your character: you are "Pundit"/);
    expect(params.input).toEqual([{ role: "user", content: "Best goal?" }]);
  });

  it("talks in each world's voice", async () => {
    create.mockResolvedValue(fakeStream(["Copy."]));
    await collect(askPundit("Fastest lap?", "gp"));
    expect(create.mock.calls[0][0].instructions).toMatch(/Race Engineer.*race engineer on team radio/);
  });

  it("picks the lowest reasoning effort each model accepts", () => {
    expect(effortFor("gpt-5-nano", undefined)).toBe("minimal");
    expect(effortFor("gpt-5.4-nano", undefined)).toBe("none");
    expect(effortFor("gpt-5.4-nano", "low")).toBe("low");
    expect(effortFor("gpt-5.4-nano", "bogus")).toBe("none");
  });

  it("uses PUNDIT_MODEL when set", async () => {
    process.env.PUNDIT_MODEL = "gpt-4.1-nano";
    create.mockResolvedValue(fakeStream(["ok"]));
    await collect(askPundit("Hi there", "ai"));
    expect(create.mock.calls[0][0].model).toBe("gpt-4.1-nano");
  });

  it("says something polite when the model returns no text", async () => {
    create.mockResolvedValue(fakeStream([]));
    expect(await collect(askPundit("Something odd", "run"))).toMatch(/not in my notes/);
  });

  it("turns a failed stream into an error", async () => {
    create.mockResolvedValue(fakeStream(["Half"], true));
    await expect(collect(askPundit("Hello there", "football"))).rejects.toMatchObject({ code: "failed" });
  });

  it("reports a missing API key as not configured", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(collect(askPundit("Hello there", "football"))).rejects.toMatchObject({ code: "not_configured", status: 503 });
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
