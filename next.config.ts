import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/**
 * PostHog goes through the site's own domain at /relay, so ad blockers (Brave Shields,
 * uBlock) don't drop the events. The client sets api_host to RELAY_PATH.
 */
const RELAY_PATH = "/relay";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const POSTHOG_ASSETS = POSTHOG_HOST.replace("://us.i.", "://us-assets.i.").replace("://eu.i.", "://eu-assets.i.");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // PostHog's endpoints end in a slash (/e/); don't redirect them
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: `${RELAY_PATH}/static/:path*`, destination: `${POSTHOG_ASSETS}/static/:path*` },
      { source: `${RELAY_PATH}/array/:path*`, destination: `${POSTHOG_ASSETS}/array/:path*` },
      { source: `${RELAY_PATH}/:path*`, destination: `${POSTHOG_HOST}/:path*` },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
