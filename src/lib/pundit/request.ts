import { createHash } from "node:crypto";

/**
 * The visitor's IP, hashed: the raw address is never stored, only used as a rate-limit key.
 * Prefers headers the platform sets itself (Vercel overwrites these), since a client can
 * prepend fake entries to x-forwarded-for on hosts that only append to it.
 */
export function clientKey(headers: Headers): string {
  const trusted = headers.get("x-vercel-forwarded-for") ?? headers.get("x-real-ip");
  const forwarded = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const ip = trusted?.split(",")[0]?.trim() || forwarded || "unknown";
  return createHash("sha256").update(`pundit:${ip}`).digest("hex").slice(0, 32);
}

/** Only accept POSTs sent by this site's own pages. Missing Origin (curl, server-side) is rejected. */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
