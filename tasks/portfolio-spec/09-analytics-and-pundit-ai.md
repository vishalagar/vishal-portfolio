# Portfolio spec: §12 Ask the Pundit (AI), §13 Analytics

Part of `tasks/portfolio-spec/` (index: `README.md`). Live since 2026-10-27.

## 12. Ask the Pundit: how the AI knows about Vishal

The model knows nothing about Vishal on its own. Every question is sent with:

1. **The facts:** `PUNDIT_FACTS` in `src/content/pundit.ts` (job, projects, education, running, contact). This is the whole record; the prompt says to use nothing else and never invent.
2. **The rules:** `PUNDIT_SYSTEM` in `src/lib/pundit/prompt.ts`: 2–3 sentences, only questions about Vishal, one-line in-character refusal for anything else, no private details, ignore prompt injection.
3. **The character:** the current world's `assistant` name and `voice` in `src/content/worlds.ts` (Pundit, Race Engineer, Guide, Coach, Agent).

**To teach it something new:** add a line to `PUNDIT_FACTS`, commit, push. Vercel redeploys and the next answer uses it. Never add phone numbers, recommenders, LinkedIn analytics, heart-rate data, "open to work" or grad-school plans (spec §2).

**Model and cost:**
- `gpt-5.4-nano`, reasoning off, at most 400 output tokens (`src/lib/pundit/llm.ts`). `gpt-5-nano` often returned nothing; `gpt-4.1-nano` is retired.
- Limits: 3 questions per visitor per day, 200 per day across the site (`PUNDIT_PER_DAY`, `PUNDIT_DAILY_CAP`).
- No Upstash yet, so limits live in each server instance (`PUNDIT_ALLOW_MEMORY_LIMITS=1`). The OpenAI project budget is the hard spending stop.
- The four question chips are canned answers and never call the API.

**Vercel env:** `OPENAI_API_KEY` (sensitive), `PUNDIT_ALLOW_MEMORY_LIMITS=1`, optional `PUNDIT_MODEL`, `PUNDIT_EFFORT`.

## 13. Analytics: what is tracked and where to look

Code: `src/components/Analytics.tsx`, `src/lib/analytics/`. PostHog project "Personal Websitr" (US cloud), plus Vercel Web Analytics and Speed Insights. The footer tells visitors about it.

**Automatic (PostHog):** pageviews, page leave with scroll depth, every click, heatmaps, dead clicks, web vitals, JS errors, session replays (typed text and the Pundit chat are masked). Every visitor gets a person profile: country/city, device, browser, referrer. Anonymous unless they identify themselves.

**Custom events** (each also carries `world`, `theme`, `sound`):

| Event | Properties |
|---|---|
| `world_changed` | `from`, `to` |
| `theme_changed` | `to` |
| `sound_toggled` | `on` |
| `var_easter_egg` | `on` |
| `start_screen_closed` | |
| `section_viewed` | `section` (once per section per visit) |
| `game_opened` / `game_restarted` | `game` |
| `game_closed` | `game`, `seconds`, `restarts` |
| `pundit_asked` | `question`, `canned`, `length` |
| `pundit_answered` | `status`, `error`, `http`, `length` |

**Where to look in PostHog (us.posthog.com):**
- **Activity → Live events:** everything as it happens.
- **Web analytics:** visitors, top pages, referrers, countries, devices.
- **Session replay:** watch individual visits.
- **Heatmaps:** Toolbar → open the site → Heatmap.
- **Persons:** one row per visitor, with their full event history.
- **Product analytics → New insight:** charts from the custom events, e.g. `world_changed` by `to`, or `pundit_asked` question text.

**Vercel:** Analytics tab (needs Enable once) for visitors and pages; Speed Insights tab for performance.
