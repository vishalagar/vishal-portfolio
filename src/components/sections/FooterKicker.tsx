"use client";

import { useWorld } from "@/lib/hooks/useStores";

/** Footer eyebrow in the current world's wording. */
export function FooterKicker() {
  return <div className="eyebrow">{useWorld().footerKicker}</div>;
}
