/**
 * CSS variables for every world × theme, built from src/content/worlds.ts so there is one source.
 * layout.tsx inlines the result in <head>, so the saved world applies before first paint.
 * Selectors are `:root[data-world][data-theme]` and outrank the football defaults in globals.css.
 */
import { WORLD_IDS, WORLDS, type Mode, type Palette, type WorldId } from "@/content/worlds";

/** next/font variable per font family (set on <html> in layout.tsx). */
export const FONT_VARS: Record<string, string> = {
  "Barlow Condensed": "--font-display",
  Silkscreen: "--font-pixel",
  "Titillium Web": "--font-titillium",
  Orbitron: "--font-orbitron",
  Anton: "--font-anton",
  "Chakra Petch": "--font-chakra",
  "Share Tech Mono": "--font-sharetech",
};

function fontStack(family: string, fallback: string): string {
  const v = FONT_VARS[family];
  return `${v ? `var(${v}), ` : ""}"${family}", ${fallback}`;
}

export function paletteVars(p: Palette): Record<string, string> {
  return {
    "--bg": p.bg,
    "--surface": p.surface,
    "--surface2": p.surface2,
    "--line": p.line,
    "--ink": p.ink,
    "--muted": p.muted,
    "--pitch-a": p.pitchA,
    "--pitch-b": p.pitchB,
    "--chalk": p.chalk,
    "--shadow": p.shadow,
    "--blue": p.blue,
    "--red": p.red,
    "--green": p.green,
    "--accent": p.accent,
    "--on-accent": p.onAccent,
    "--accent-text": p.accentText,
    "--live-bg": p.liveBg,
    "--live-ink": p.liveInk,
    "--stage-bg": p.stage,
    "--formation-bg": p.formation,
    "--shirt-bg": p.shirt.bg,
    "--shirt-ink": p.shirt.ink,
    "--shirt-line": p.shirt.line,
    "--shirt-radius": p.shirt.radius,
    "--tag-bg": p.shirt.tagBg,
    "--tag-ink": p.shirt.tagInk,
    "--shell-body": p.shell.body,
    "--shell-bezel": p.shell.bezel,
    "--shell-bezel-ink": p.shell.bezelInk,
    "--shell-ink": p.shell.ink,
    "--shell-btn": p.shell.btn,
    "--shell-btn-ink": p.shell.btnInk,
    "--shell-dpad": p.shell.dpad,
    "--shell-pill": p.shell.pill,
    "--shell-grille": p.shell.grille,
  };
}

function block(selector: string, vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  return `${selector}{${body}}`;
}

function worldVars(id: WorldId): Record<string, string> {
  const w = WORLDS[id];
  return {
    "--display": fontStack(w.fonts.display, "system-ui, sans-serif"),
    "--pixel": fontStack(w.fonts.label, "ui-monospace, monospace"),
    "--display-scale": String(w.fonts.scale),
    "--world-swatch": w.swatch,
    "--prop-a": w.hero.prop.a,
    "--prop-b": w.hero.prop.b,
    "--prop-c": w.hero.prop.c,
  };
}

export function buildWorldCss(): string {
  const out: string[] = [];
  for (const id of WORLD_IDS) {
    // football is also the no-JS / server default, so it applies to bare :root too
    const root = id === "football" ? `:root,:root[data-world="${id}"]` : `:root[data-world="${id}"]`;
    out.push(block(root, worldVars(id)));
    for (const mode of ["night", "day"] as const satisfies readonly Mode[]) {
      const sel =
        id === "football"
          ? `:root[data-theme="${mode}"]:not([data-world]),:root[data-world="${id}"][data-theme="${mode}"]`
          : `:root[data-world="${id}"][data-theme="${mode}"]`;
      out.push(block(sel, paletteVars(WORLDS[id].modes[mode])));
    }
  }
  return out.join("\n");
}
