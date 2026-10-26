"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/** Vercel Speed Insights always; PostHog only when its key is set on the deployment. */
export function Analytics() {
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    let cancelled = false;
    import("posthog-js")
      .then(({ default: posthog }) => {
        if (cancelled) return;
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          person_profiles: "identified_only",
          capture_pageview: true,
          autocapture: true,
          persistence: "localStorage+cookie",
        });
      })
      .catch((err: unknown) => {
        console.warn("[analytics] PostHog failed to load", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <SpeedInsights />;
}
