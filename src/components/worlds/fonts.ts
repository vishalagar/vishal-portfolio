import { FONT_VARS } from "@/lib/worlds/css";

/** CSS font-family value for a world font, via the next/font variable with a named fallback. */
export function fontStack(family: string, fallback = "sans-serif"): string {
  const v = FONT_VARS[family];
  return `${v ? `var(${v}), ` : ""}"${family}", ${fallback}`;
}
