# Worlds spec: §7 Highlights, PaceCoach facts and pace run

Part of `tasks/worlds-spec/` (index: `README.md`).

## 7. Highlights: PrintSafe first, then the game that fits the world

1. **PrintSafe, featured in every world.** It's a large card with the live demo (`PrintSafeDemo` takes a `height` prop; at 300 px and up it uses a bigger layout). Its label per world is Goal of the season, Race win of the season, Main quest, Season PB or Flagship model.
2. **The world's game card.** It's tied to the real project that game belongs to:

| World | Project | Game | Card link |
|---|---|---|---|
| Football | **Sports Detection** (renamed from Football Vision) | 2v2 match | Code (`football-analysis` repo; update when renamed) |
| Grand Prix | **Sports Detection** ("it works on any sport") | Race game | Code |
| Gaming | **Snake DQN** | Snake: the bot plays, then you take over | Code (`RL-Project`) |
| Running | **PaceCoach** | PaceCoach pace run | Code (`RunningCoach`) |
| AI | **Autonomous Retraining** | Label Rush (you are the annotator) | Ask the Agent |

3. **The project grid.** PrintSafe and the world's featured project are left out, so nothing shows twice. In Running, PaceCoach is also left out of "Also in the squad".

Bug Hunt is no longer on the page, but it is kept: `design/mock-worlds/BugHuntGame.dc.html` and its own artboard on the canvas ("Bug Hunt (kept, not on the page)").

### PaceCoach facts (from github.com/vishalagar/RunningCoach)

- An AI running coach built for OpenAI Build Week (July 2026): set a race, log or import runs, and the plan adapts after every one.
- GPT-5.6 vision reads screenshots of past runs from any app. The runner reviews the rows before they're saved.
- Versioned plans, a conservative finish-time estimate and a coach note explaining every re-plan.
- Weather-aware via Open-Meteo. Reporting pain switches to a rest-only week.
- Stack: FastAPI, React, SQLite, GPT-5.6, Open-Meteo.
- Not deployed, so the card links to the code.

### PaceCoach pace run (`MarathonGame.dc.html`)

- **Goal:** hold the coach's target of 6:20/km, within 15 s, for 21.1 km (about 50 s of play).
- **Controls:** alternate left and right (A and B on a phone) to run, ↑ ↓ to change lane, water at km 7 and 14 refills stamina, and running behind someone drafts.
- **Each km is scored:** the game flashes "On pace", "Too fast" or "Too slow", with that km's split.
- **HUD:** target, km, live pace (coloured by the band) and "on pace n of k km".
- **Finish screen:** km on pace out of 21, the time and a coach verdict. The verdicts are game copy, not claims.
- **Tuning:** `BOOST` = 0.26 per step. Holding the target takes about 5–6 alternating steps a second.
- **Demo bot:** steps only when it drops below the target, and holds pace for 20 of 21 km (`sim/pacesim.mjs`).
- **Pace maths:** min/km = 9 / speed (a unit is 10 m and a tick is 5.4 s of race time).
