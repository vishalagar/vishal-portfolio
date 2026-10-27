"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect } from "react";
import { playStore } from "@/components/play/playStore";
import { tracker, track } from "@/lib/analytics/track";
import { watchStores } from "@/lib/analytics/watch";
import { isSoundOn, subscribeSound } from "@/lib/sound";
import { introStore, themeStore, varStore, worldStore } from "@/lib/stores/htmlAttr";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/** Loads PostHog with everything on: pageviews, clicks, heatmaps, replays (inputs masked), vitals, errors. */
function startPostHog(): () => void {
  if (!POSTHOG_KEY) return () => {};
  let cancelled = false;
  import("posthog-js")
    .then(({ default: posthog }) => {
      if (cancelled) return;
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: "always",
        capture_pageview: "history_change",
        capture_pageleave: true,
        autocapture: true,
        enable_heatmaps: true,
        capture_dead_clicks: true,
        capture_exceptions: true,
        capture_performance: true,
        disable_session_recording: false,
        session_recording: { maskAllInputs: true, maskTextSelector: "[data-ph-mask]" },
        persistence: "localStorage+cookie",
      });
      tracker.attach({
        capture: (event, props) => posthog.capture(event, props),
        register: (props) => posthog.register(props),
      });
    })
    .catch((err: unknown) => {
      console.warn("[analytics] PostHog failed to load", err);
    });
  return () => {
    cancelled = true;
  };
}

/** One section_viewed event per section per visit, when 40% of it is on screen. */
function watchSections(): () => void {
  if (typeof IntersectionObserver === "undefined") return () => {};
  const seen = new Set<string>();
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const id = (e.target as HTMLElement).id;
        if (!e.isIntersecting || seen.has(id)) return;
        seen.add(id);
        track("section_viewed", { section: id });
      }),
    { threshold: 0.4 },
  );
  document.querySelectorAll("section[id], footer[id]").forEach((el) => io.observe(el));
  return () => io.disconnect();
}

/** Vercel Web Analytics and Speed Insights always; PostHog only when its key is set on the deployment. */
export function Analytics() {
  useEffect(() => {
    const stopPostHog = startPostHog();
    const stopStores = watchStores(
      {
        theme: themeStore,
        world: worldStore,
        intro: introStore,
        varMode: varStore,
        sound: { get: isSoundOn, subscribe: subscribeSound },
        play: playStore,
      },
      tracker,
    );
    const stopSections = watchSections();
    return () => {
      stopPostHog();
      stopStores();
      stopSections();
    };
  }, []);

  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />
    </>
  );
}
