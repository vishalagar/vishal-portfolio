# Portfolio spec: §9 Build plan, §10 Open decisions, §11 Known gaps in the mock

Part of `tasks/portfolio-spec/` (index: `README.md`).

## 9. Build plan

**Stack:** Next.js (App Router) + TypeScript, deployed on Vercel. Use CSS modules or Tailwind with the tokens above as CSS variables, plus `data-theme` on `<html>`. Keep scroll effects in CSS. Put demos in client components, one hook per engine.

**Structure:**
- `content/` holds the typed data from §5 and §7: timeline, projects, kits, Pundit Q&A, ticker. Copy edits go there, not into components.
- `lib/sound.ts` is a single WebAudio module: lazy `AudioContext`, all synths from §4, and a global mute.
- `lib/engines/` holds pure, testable functions: football `step(state, input)`, snake, retrain, gen. The UI just renders their state.

**Ask the Pundit:**
- A server route that calls Claude, with a system prompt grounded only in the §7 facts.
- Rate limiting (Upstash, which Vishal already uses for PrintSafe), a max length on questions and answers, and no data stored beyond what limiting needs.
- The API key comes from an environment variable on Vercel. Never commit `.env`.
- Model: OpenAI `gpt-5.4-nano`, 3 questions per visitor per day (see §12 in `09-analytics-and-pundit-ai.md`).

**Easter eggs:**
- Typing `VAR` anywhere turns on detection boxes across the whole page (needs a global key listener).
- The Konami code starts a penalty shootout (optional).

**Performance:**
- Pause each demo's timer when it is off screen (IntersectionObserver) or the tab is hidden (`visibilitychange`).
- Lazy-load the game.
- Preload fonts.
- Keep images small (pixel PNGs are already tiny).

**SEO and sharing:**
- Title, description, an OG image (sprite plus scorebug), a pixel-ball favicon, JSON-LD Person schema.

**Analytics:** PostHog (full tracking), Vercel Web Analytics and Speed Insights. Events and where to look: §13.

**Tests** (TDD, aiming for 80%+):
- Port the sim harnesses to unit tests:
  - mirror symmetry (both teams behave identically);
  - balance (team A vs B goals within a tolerance over N seeded matches);
  - no NaN or stuck states;
  - keeper one-attempt rule.
- Unit tests for the retrain and gen state machines and for the PrintSafe stage timeline.
- Playwright e2e: theme toggle, sound toggle, a game kick-off to full time with a mocked clock, a Pundit question with a mocked API, a kit flip.

**Pre-launch checklist** (Vishal's standard):
- Security scan.
- Analytics in place.
- iPhone Safari test (sticky and pinned sections, game touch controls, audio unlock).
- No unauthenticated data exposure.
- Environment variables set on Vercel.

---

## 10. Open decisions

1. **Scorebug wording:** keep the "VA 6 – 0 BUGS" joke, show the live score from the mini match (recommended: e.g. `LIVE · VA 2 – 1 CPU · 67'`), or show the plain name.
2. **Resume PDF** for the button. Remove the phone number from the public copy.
3. **Domain**, e.g. vishalagarwal.dev, or a vercel.app address.
4. **Snake model weights:** does the trained DQN file still exist?
5. **Official half-marathon chip time**, to replace the ≈2:16 summed from watch splits.
6. **Project screenshots:** optional, since every card now has a demo.
7. **Pundit model and monthly budget cap.** Decided 2026-10-25: a cheaper OpenAI model (Vishal has credits). Done 2026-10-27: `gpt-5.4-nano`; budget cap set on the OpenAI project.

## 11. Known gaps in the mock

- The Pundit text input does nothing (only the chips work).
- The "type VAR anywhere" and Konami easter eggs are not implemented.
- Demos keep running when off screen.
- Scroll moments need Chrome, Edge or Safari 26+. Firefox shows the static fallback.
- Not yet tested on a real iPhone. The game, retraining and image-generation logic was verified only with Node simulations and the smoke test.
