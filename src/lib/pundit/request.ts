import { createHash } from "node:crypto";

/**
 * The visitor's IP, hashed: the raw address is never stored, only used as a rate-limit key.
 * On Vercel, x-vercel-forwarded-for is set by the platform and can't be forged. Anywhere else
 * a client can send any header it likes, so only the last x-forwarded-for hop (appended by the
 * proxy in front of us) is trusted; leading entries are client-controlled.
 */
export function clientKey(
  headers: Headers,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const platform = env.VERCEL
    ? headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : undefined;
  const lastHop = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const ip = platform || lastHop || "unknown";
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
