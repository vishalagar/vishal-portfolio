# Worlds — spec for the real build

The approved "Choose your world" mock, written down so it can be ported to the Next.js site. Same content in every world; each world changes the look, the sound, the wording, the line-up layout and the featured game.

- **Mock (never delete):** https://claude.ai/artifact/XGXN81pFWpSf4rW7ndv7CC (version 26, 2026-10-26)
- **Mock source:** `design/mock-worlds/` (`Main.dc.html` is the page; one `.dc.html` per demo/game; checks in `sim/`)
- **Single-world reference:** `design/mock/` (the original football-only mock, also kept)
- **Base spec:** `tasks/portfolio-spec.md` still holds content, facts, privacy rules and engine tuning. This file only covers what the worlds add or change.

---

## 1. The five worlds

| id | Name | Display font | Label font | Costume (headgear) | Section names (XI / timeline / highlights / off the pitch) | Assistant name | Review overlay |
|---|---|---|---|---|---|---|---|
| `football` | Football | Barlow Condensed | Silkscreen | none (the base sprite) | Starting XI / Career so far / Goals & VAR reviews / Match fitness | Pundit | VAR |
| `gp` | Grand Prix | Titillium Web | Silkscreen | racing helmet (visor up) + race suit | Starting grid / Career laps / Overtakes & steward reviews / Driver fitness | Race Engineer | Review |
| `gaming` | Gaming | Orbitron | Silkscreen | headset with mic boom | Character select / Story so far / Boss fights & replays / Real-life stats | Guide | Aim assist |
| `run` | Running | Anton | Silkscreen | headband + singlet with No. 4 bib | Start corrals / Career splits / PBs & photo finishes / Race day | Coach | Chip timing |
| `ai` | AI | Chakra Petch | Share Tech Mono | neon visor + dark jacket | Architecture / Career epochs / Evals & ablations / Human mode | Agent | Inference |

Per world the mock also swaps: the scorebug text, the hero kicker, the camera label, the detection-box label, the kickable prop (ball / tyre / coin / water bottle / cube), timeline units (minutes / laps / levels / km / epochs) and the event tags. All of this lives in `worldDefs()` in `Main.dc.html`; port it as typed content (e.g. `src/content/worlds.ts`), not into components.

Timeline units stop at the finish: laps cap at L58 and km at 21.1, so stoppage and extra time never run past the race.

Brand names stay generic: no F1, PlayStation or Game Boy marks, and the rival drivers are invented.

## 2. Start screen: "Choose your world"

- Full-screen dialog on load, with five tiles. Each tile uses its world's colours and font and shows the costume sprite blinking.
- Visitors click a tile or press 1–5. "Surprise me" or Esc picks a random world.
- **If nobody picks within 8 seconds, a random world is picked.** The countdown bar pauses while the pointer is over the tiles or a tile has keyboard focus.
- The world wipe then shows "Welcome to <World>" or "Random pick / <World>".
- The start screen has its own sound toggle, and clicking it unlocks audio.
- A prop (`intro`, default on) turns the start screen off.
- Real site: a returning visitor skips the start screen and goes straight to their last world (localStorage `va-world`). Decided 2026-10-26.

The header keeps the small world switcher, so visitors can change world at any time.

## 3. Light and dark in every world

The theme toggle shows in every world; night is the default (as in CLAUDE.md, `prefers-color-scheme` is ignored).

| World | Dark (label) | bg / surface / ink | Light (label) | bg / surface / ink | Accent (dark / light) | Accent text (dark / light) |
|---|---|---|---|---|---|---|
| Football | Floodlights on | `#08130e` / `#0f1f17` / `#eef3ea` | Day match | `#eef2e8` / `#ffffff` / `#0d1f16` | `#f5d547` | `#f5d547` / `#7a5f00` |
| Grand Prix | Night race (carbon) | `#0e0e12` / `#17171d` / `#f4f4f6` | Day race (white paddock) | `#f4f4f1` / `#ffffff` / `#15151a` | `#e10600` / `#c8102e` | `#ff4d42` / `#b00d28` |
| Gaming | Lights off (black console) | `#0d0e13` / `#16171f` / `#e8eaf2` | Lights on (grey console) | `#c3c4c9` / `#d9dade` / `#15161c` | `#5b84ff` / `#2346b8` | `#8aa6ff` / `#1d3a9e` |
| Running | Night run (race-day blue) | `#1d4fbf` / `#2459cf` / `#ffffff` | Morning run | `#f2f5fb` / `#ffffff` / `#0b2a6b` | `#d8ff3a` | `#d8ff3a` / `#1d4fbf` |
| AI | Dark mode (cyberpunk) | `#0a0614` / `#140c26` / `#efeaff` | Light mode (clean lab) | `#f5f3fb` / `#ffffff` / `#140c26` | `#2de2e6` | `#2de2e6` / `#6a2cd8` |

- Every combination passes WCAG AA for ink, muted text, accent text and text on accent (`design/mock-worlds/sim/contrast.mjs`).
- The old all-red Grand Prix page was dropped because it was neither a light nor a dark mode. Red is now the accent.
- Each world also has day and night variants of the formation background, the "shirt" colours used in the line-up and the phone controller shell. Full values are in `worldDefs()`: the base keys are one mode, and the `alt` keys override them for the other.

## 4. Costume off on scroll

The hero sprite takes the headgear off as you scroll down and changes back into the elephant shirt, ending as the plain football avatar. The Pundit and footer sprites do the same as they come into view. Scrolling back up puts the costume on again.

- **Frames:** 8 per world, generated by `design/pixel-me/generate_unmask.py`, which writes `design/pixel-me/worlds/vishal_<world>_unmask_8x.png` (3072 × 448).
  - Frame 0 is the full costume.
  - The headgear lifts up and off the top over frames 1–6, while the outfit changes back row by row.
  - Frame 7 is the base bust.
- **Hero:** the animation starts once the sprite is fully on screen and runs over 280 px of scroll.
- **Pundit and footer:** the animation starts when the sprite's top reaches 92% of the viewport height, and runs over 160 px.
- **Layering:** at frame 0 the normal costume layers show (gaze and blink still work). At frames 1–6 the strip frame shows. At frame 7 the base layers show (blinks work again).
- **Detection label:** switches to "vishal 0.99" once the costume is off.
- **Hint:** a small "Scroll · helmet off" tag shows on the hero stage until the costume is off.
- **Sound:** with sound on, there's a gear-off sound when the animation starts and a gear-on sound when it goes back to 0.
- **Reduced motion:** a straight swap at 50% progress, with no in-between frames.

## 5. Sound

Off by default; turned on by the header button or the start-screen toggle.

**Levels:** everything on the page runs through a master gain of 0.55. Looping background sound plays at 0.45 of that, so it sits in the background (`this.vol` in the mock). The mini-games still use their own volume.

**Mix bus (GP, Running, AI):** a compressor, a generated 2.4 s stereo reverb and a filtered 0.23 s echo. Football and Gaming are unchanged from the first mock, on purpose: Vishal likes them as they are.

| World | Opening sound | Background loop | Button blip | Prop | Gear off / on |
|---|---|---|---|---|---|
| Football | referee whistle | crowd noise bed | square blip | ball thud | — |
| Grand Prix | engine blips on the grid, five start-light beeps, lights out, launch up through the gears with a pan | cars passing every 2.6–5.2 s with a doppler pitch drop, left-to-right pan and opening filter | team-radio squelch + beep | tyre thump + squeal | visor clack + chin strap + whoosh |
| Gaming | chiptune start jingle | chiptune bassline | coin-style square | coin "ba-ding" | headset pop |
| Running | starting pistol (crack, body, building echo), then crowd cheer + claps | crowd bed, footsteps at 170 spm with breathing every 2 steps, a cheer swell every 6–10 s | sports-watch beep | bottle squeeze, bubbles, gulp | elastic stretch + snap |
| AI | detuned pad chord opening up, echoing arpeggio, FM bell | evolving detuned pad with slow filter sweep and random pentatonic plucks | soft triangle pluck with echo | FM bell ping | power-down sweep + glitch blips (reverse on) |

**Engine voice:** two detuned saws, a saw an octave up and a square sub, through a tanh waveshaper and a low-pass that follows the revs.

**Crowd:** noise through three formant band-passes (480 / 1150 / 2600 Hz), each one wobbling.

**Checks:** the levels were measured by an offline render in headless Chromium (`sim/render_audio.mjs`). Nothing clips, there are no NaNs, and the levels are close to football's. Exceptions are checked with a fake audio context (`sim/soundsmoke.mjs`).

**Real site:** port this into `src/lib/sound.ts` as per-world sound sets. Keep `sfx.*` as no-ops while muted, and keep timers behind `useActive` / the ambient stop.

## 6. Line-up per world (same eleven technologies)

| World | Layout |
|---|---|
| Football | 4-3-3 on a striped pitch (as before) |
| Grand Prix | Starting grid two cars wide: P1 P2 / P3 P4 / … The right column is staggered back. White grid-box brackets, "Car n" and a name tag. Python is on pole. Five red start lights sit above the grid. Max width 760 px; still two wide on phones. |
| Gaming | Character select. Cards are as many per row as fit (min 104 px). The P1 cursor is on Python and blinks. Each card has a role (Striker / Mage / Support / Tank, from the football lines) and there's one locked "next unlock" slot (11 of 12). No invented levels or stats. |
| Running | Start corrals with race bibs: Elite wave (attack), Wave A (midfield), Wave B (defence), Pacer (Python). The bib number is the shirt number. Two waves sit side by side on desktop. |
| AI | Neural net: input (Python) → hidden 1 (NumPy, MySQL, Pandas, Azure) → hidden 2 (OpenCV, PyTorch, FastAPI) → output (YOLOv8, Next.js, TypeScript). Every node in one layer connects to every node in the next (25 connections), with signal pulses moving along them. |

Bench labels per world: Bench / Reserve drivers / Inventory / Waitlist / Fine-tuning pool.

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

## 8. Phone

The Game Boy-style play mode from v1 is unchanged: the screen is the top half and the controller the bottom half, with Select to exit and Start to restart. The controller shell takes each world's colours in both modes.

## 9. Porting checklist (real site)

- [x] `src/content/worlds.ts`: per-world copy, palettes (both modes), fonts, units, tags and line-up layout data.
- [x] Rename Football Vision → Sports Detection in `src/content`, the timeline, the ticker and the Pundit facts.
- [x] Add PaceCoach as a project, using only the facts above.
- [x] Reorder highlights: PrintSafe featured first, then the world's game card, then the grid without duplicates.
- [x] Start screen with the random fallback after 8 s, plus the `localStorage` decision for returning visitors.
- [x] `data-world` on `<html>` next to `data-theme`. Apply the saved world before paint in `BOOT_SCRIPT`.
- [x] Theme toggle in every world (the existing store already holds night/day).
- [x] Sprite assets: copy `design/pixel-me/worlds/*_sheet_8x.png` and `*_unmask_8x.png` to `public/sprite/`.
- [x] Costume-off scroll hook shared by the hero, Pundit and footer sprites, with a reduced-motion swap.
- [x] Sound: per-world sets, master and ambient volumes in `src/lib/sound.ts`, and unit tests (an offline-render test like `sim/render_audio.mjs` if feasible).
- [x] Line-up components per world (grid, character select, corrals, network).
- [x] Games: Race, Pace run and Label Rush as engines in `src/lib/engines/`, with deterministic tests like the football engine; Snake already exists.
- [x] e2e: pick a world, the random pick, a theme toggle per world, the costume-off frames on scroll, and the PrintSafe card first in every world.

Port notes (what was built, how it was verified, and known gaps): `tasks/state.md`, entry 2026-10-26.
