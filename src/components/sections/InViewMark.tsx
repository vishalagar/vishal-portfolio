"use client";

import { useRef, type HTMLAttributes, type ReactNode } from "react";
import { useInView } from "@/lib/hooks/useActive";

/**
 * Wraps children in a div with data-inview="false" until it scrolls into view, then "true" (once).
 * Pair hide-until-seen styles with :root[data-js] so content stays visible without JavaScript.
 */
interface InViewMarkProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  threshold?: number;
}

export function InViewMark({ children, threshold = 0.3, ...rest }: InViewMarkProps) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { threshold, once: true });
  return (
    <div ref={ref} {...rest} data-inview={seen ? "true" : "false"}>
      {children}
    </div>
  );
}
