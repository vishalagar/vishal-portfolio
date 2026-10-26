"use client";

import { useRef } from "react";
import { useUnmask } from "@/lib/hooks/useUnmask";
import { Sprite } from "./Sprite";

interface UnmaskSpriteProps {
  scale: number;
  glance: { duration: number; delay: number };
  className?: string;
  /** Accessible name for the wrapper; omit to hide it from screen readers. */
  label?: string;
}

/** A sprite that takes its costume off as it scrolls into view (Pundit and footer). */
export function UnmaskSprite({ scale, glance, className, label }: UnmaskSpriteProps) {
  const ref = useRef<HTMLDivElement>(null);
  const unmask = useUnmask(ref, "inline");
  return (
    <div
      ref={ref}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Sprite scale={scale} glance={glance} unmask={unmask} />
    </div>
  );
}
