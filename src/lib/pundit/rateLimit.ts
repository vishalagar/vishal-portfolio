import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type LimitResult =
  | { ok: true }
  | { ok: false; reason: "rate_limited" | "busy" | "not_configured"; retryAfter: number };

export interface Limiter {
  check(clientKey: string): Promise<LimitResult>;
}

export interface LimitConfig {
  perMinute: number;
  perDay: number;
  /** Total questions per day across all visitors: the hard spend cap. */
  globalPerDay: number;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export function limitConfigFromEnv(env: NodeJS.ProcessEnv = process.env): LimitConfig {
  const num = (v: string | undefined, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  };
  return {
    perMinute: num(env.PUNDIT_PER_MINUTE, 5),
    perDay: num(env.PUNDIT_PER_DAY, 30),
    globalPerDay: num(env.PUNDIT_DAILY_CAP, 300),
  };
}

/**
 * In-memory sliding windows. Used for local dev and as a fallback when Upstash isn't configured.
 * Per serverless instance only, so the global cap is approximate there; set Upstash in production.
 */
export function memoryLimiter(cfg: LimitConfig, now: () => number = Date.now, maxKeys = 5000): Limiter {
  const hits = new Map<string, number[]>();
  let globalHits: number[] = [];
  const recent = (list: number[] | undefined, windowMs: number, t: number) => (list ?? []).filter((x) => t - x < windowMs);

  return {
    async check(clientKey) {
      const t = now();
      globalHits = recent(globalHits, DAY, t);
      if (globalHits.length >= cfg.globalPerDay) {
        return { ok: false, reason: "busy", retryAfter: Math.ceil((DAY - (t - globalHits[0])) / 1000) };
      }
      const mine = recent(hits.get(clientKey), DAY, t);
      const lastMinute = mine.filter((x) => t - x < MINUTE);
      if (lastMinute.length >= cfg.perMinute) {
        return { ok: false, reason: "rate_limited", retryAfter: Math.ceil((MINUTE - (t - lastMinute[0])) / 1000) };
      }
      if (mine.length >= cfg.perDay) {
        return { ok: false, reason: "rate_limited", retryAfter: Math.ceil((DAY - (t - mine[0])) / 1000) };
      }
      if (!hits.has(clientKey) && hits.size >= maxKeys) {
        const oldest = hits.keys().next().value;
        if (oldest !== undefined) hits.delete(oldest);
      }
      hits.set(clientKey, [...mine, t]);
      globalHits = [...globalHits, t];
      return { ok: true };
    },
  };
}

/** Refuses every question. Used in production when no shared store is configured, so spend stays capped. */
function closedLimiter(): Limiter {
  return { check: async () => ({ ok: false, reason: "not_configured", retryAfter: 3600 }) };
}

function upstashLimiter(redis: Redis, cfg: LimitConfig): Limiter {
  const prefix = "pundit";
  const minute = new Ratelimit({ redis, prefix: `${prefix}:m`, limiter: Ratelimit.slidingWindow(cfg.perMinute, "1 m") });
  const day = new Ratelimit({ redis, prefix: `${prefix}:d`, limiter: Ratelimit.fixedWindow(cfg.perDay, "1 d") });
  const global = new Ratelimit({ redis, prefix: `${prefix}:g`, limiter: Ratelimit.fixedWindow(cfg.globalPerDay, "1 d") });
  const wait = (reset: number) => Math.max(1, Math.ceil((reset - Date.now()) / 1000));

  return {
    async check(clientKey) {
      const m = await minute.limit(clientKey);
      if (!m.success) return { ok: false, reason: "rate_limited", retryAfter: wait(m.reset) };
      const d = await day.limit(clientKey);
      if (!d.success) return { ok: false, reason: "rate_limited", retryAfter: wait(d.reset) };
      const g = await global.limit("all");
      if (!g.success) return { ok: false, reason: "busy", retryAfter: wait(g.reset) };
      return { ok: true };
    },
  };
}

/** Upstash when its REST credentials are set (either naming), otherwise in-memory. */
export function createLimiter(env: NodeJS.ProcessEnv = process.env): Limiter {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  const cfg = limitConfigFromEnv(env);
  if (url && token) return upstashLimiter(new Redis({ url, token }), cfg);
  // In-memory limits reset per serverless instance, so they can't enforce the daily spend cap in
  // production. Fail closed unless explicitly allowed (e.g. a single long-running server).
  if (env.NODE_ENV === "production" && env.PUNDIT_ALLOW_MEMORY_LIMITS !== "1") {
    console.error("[pundit] Upstash isn't configured: typed questions are disabled. Set UPSTASH_REDIS_REST_URL/TOKEN.");
    return closedLimiter();
  }
  return memoryLimiter(cfg);
}

let shared: Limiter | null = null;

export function getLimiter(): Limiter {
  shared ??= createLimiter();
  return shared;
}
