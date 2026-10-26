"use client";

import type { AnchorHTMLAttributes } from "react";
import { sfx } from "@/lib/sound";

/** A link that blows the whistle (if sound is on) when clicked. */
export function WhistleLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      onClick={(e) => {
        sfx.whistle();
        props.onClick?.(e);
      }}
    />
  );
}
