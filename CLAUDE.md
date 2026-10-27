@AGENTS.md

# Vishal Agarwal portfolio: "Live Coverage"

A football-broadcast portfolio where every project is playable. Built from the approved mock in `design/mock/` and the spec in `tasks/portfolio-spec/` (the source of truth for copy, facts, tokens, motion and engine tuning). Session log: `tasks/state.md`.

**Never delete** `design/mock/`, `design/mock-worlds/` or the Claude Design mock artifact (https://claude.ai/artifact/XGXN81pFWpSf4rW7ndv7CC), including artboards that are no longer on the page (e.g. Bug Hunt). The worlds version is specified in `tasks/worlds-spec/`.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · CSS Modules + CSS variables (no Tailwind) · Vitest · Playwright · OpenAI API (`openai`, gpt-5.4-nano) · Upstash rate limiting · Vercel.

## Commands

```bash
npm run dev            # local dev
npm run build          # production build
npm test               # unit tests (Vitest)
npm run test:coverage  # coverage, 80% thresholds
npm run test:e2e       # Playwright (builds and starts the app on :3100)
npm run lint && npm run typecheck
```

Playwright needs its browser once: `npx playwright install chromium` (or set `PW_CHROMIUM_PATH` to an existing Chromium).

## Layout

- `src/content/` — all copy and facts (typed). Edit text here, not in components. `worlds.ts` holds every per-world value (copy, fonts, palettes, units, line-up layouts, play defs). `pundit.ts` holds the canned answers and the facts block the Pundit is grounded in.
- `src/lib/worlds/` — `css.ts` builds the CSS variables per world × theme (inlined in `<head>`); `switch.ts` has `enterWorld`, wipe timing, `randomWorld`.
- `src/lib/engines/` — pure, tested game/demo logic: `football/` (2v2 match), `snake`, `retrain`, `gen`, `printsafe`, `race`, `pace`, `labelrush`. Randomness is injected (`rng.ts`) so tests are deterministic.
- `src/lib/play/pad.ts` — the shared `Pad` and `GameProps` type every game takes.
- `src/lib/sound/` — every sound, synthesised with WebAudio (`core`, `bus`, `basics`, `worlds`, `ambient`, per-game `race`/`pace`/`label`; `index` is the public API). Off by default; `sfx.*` no-ops while muted.
- `src/lib/stores/htmlAttr.ts` — theme (`data-theme` night/day), world (`data-world`), start screen (`data-intro`) and VAR easter egg (`data-var`) as attributes on `<html>`. `BOOT_SCRIPT` applies the saved theme and world before paint and sets `data-js`.
- `src/lib/hooks/` — shared hooks (`useStores.ts`: `useWorld`, `useWorldId`, `usePalette`, `useIntro`; `useUnmask` + `unmaskMath.ts` for the costume-off sprite).
- `src/lib/pundit/` + `src/app/api/pundit/route.ts` — "Ask the Pundit": zod validation, same-origin check, rate limits (3 questions per visitor per day, global daily cap), streamed OpenAI answer in the current world's voice (`voice` in `worlds.ts`).
- `src/lib/analytics/` + `src/components/Analytics.tsx` — PostHog (through the same-origin `/relay` rewrite in `next.config.ts`, so ad blockers don't drop events), Vercel Analytics and Speed Insights. Report interactions with `track()`; events and dashboard: `tasks/portfolio-spec/09-analytics-and-pundit-ai.md`.
- `src/components/` — `header/` (incl. world switcher), `sections/` (`lineup/` holds the per-world line-ups), `demos/` (one client component per demo; `football/`, `race/`, `pace/`, `label/` are the game folders), `play/` (PlayOverlay, handheld controller, page lock), `worlds/` (start screen, world wipe), `sprite/`.

## Rules that are easy to break

- **Docs ship with the code:** before replying on any code change, update every affected `.md` (README, this file, `tasks/portfolio-spec/`, `tasks/worlds-spec/`, `tasks/state.md`) and commit them together. Never wait to be asked.
- **Content and privacy (spec §2):** no real photos of Vishal (pixel sprite only; the medal photo is the one real image). No phone numbers, recommenders, LinkedIn analytics, heart-rate data, "open to work" or grad-school plans. Shirt number is always 4. No invented numbers.
- **Night (dark) is the default theme** here, deliberately overriding the usual light-default convention. `prefers-color-scheme` is ignored.
- **CSS Modules scope `@keyframes` names.** A module class can't use keyframes from `globals.css`; define a local copy in the module. Inline `style={{ animation }}` uses the global ones.
- **Kit room 3D flip:** never put `filter`, `opacity < 1` or `overflow` on the element with `transform-style: preserve-3d`; it flattens 3D and the back shows mirrored.
- **Hide-until-revealed styles** must be gated on `:root[data-js]` so the page works without JavaScript.
- **Scroll effects** live in CSS inside `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`; other browsers get a static page.
- **Demos pause off screen** (`useActive`): keep new timers behind it.
- **Football AI thinks in a team-relative frame** (fixes a CPU bias). The mirror test covers the first half only, because the CPU always kicks off the second half.
- Accent text on theme backgrounds uses `--accent-text` (deep gold in day mode, for contrast); accent backgrounds keep `--accent`.
- **Worlds:** all per-world values live in `src/content/worlds.ts` and reach CSS through the variables from `src/lib/worlds/css.ts`. Never hardcode world colours in components. Big display font sizes multiply by `var(--display-scale)`.
- **Games** take `GameProps` and read the shared `Pad`. The overlay (`src/components/play/`) owns keyboard and touch input; games don't bind their own.
- **Nothing from one world leaks into another:** props, labels and easter eggs come from `worlds.ts` or are limited to their world (VAR is football-only and switches off on a world change).
- **e2e** must load `/?world=<id>` (or handle the start screen). Every new tab gets the start screen; returning visitors see their last world marked.
- **`next/font` calls** need literal options (no spread).

## Environment variables (set on Vercel, never commit `.env*`)

See `.env.example`. The site works without any of them: the Pundit then answers only the four canned questions and tells visitors the live mic is off.
