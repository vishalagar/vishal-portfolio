# Worlds spec: §1 Five worlds, §2 Start screen, §3 Light/dark, §4 Costume off

Part of `tasks/worlds-spec/` (index: `README.md`).

## 1. The five worlds

| id | Name | Display font | Label font | Costume (headgear) | Section names (XI / timeline / highlights / off the pitch) | Assistant name | Review overlay |
|---|---|---|---|---|---|---|---|
| `football` | Football | Barlow Condensed | Silkscreen | none (the base sprite) | Starting XI / Career so far / Goals & VAR reviews / Match fitness | Pundit | VAR |
| `gp` | Grand Prix | Titillium Web | Silkscreen | racing helmet (visor up) + race suit | Starting grid / Career laps / Overtakes & steward reviews / Driver fitness | Race Engineer | Review |
| `gaming` | Gaming | Orbitron | Silkscreen | headset with mic boom | Character select / Story so far / Boss fights & replays / Real-life stats | Guide | Aim assist |
| `run` | Running | Anton | Silkscreen | headband + singlet with No. 4 bib | Start corrals / Career splits / PBs & photo finishes / Race day | Coach | Chip timing |
| `ai` | AI | Chakra Petch | Share Tech Mono | neon visor + dark jacket | Architecture / Career epochs / Evals & ablations / Human mode | Agent | Inference |

Per world the mock also swaps: the scorebug text, the hero kicker, the camera label, the detection-box label, the kickable prop (ball / tyre / coin / water bottle / cube; each its own 8×8 shape, `hero.prop.shape`, drawn in `PixelBall.tsx` and also shown under the team talk), timeline units (minutes / laps / levels / km / epochs) and the event tags. All of this lives in `worldDefs()` in `Main.dc.html`; port it as typed content (e.g. `src/content/worlds.ts`), not into components.

Timeline units stop at the finish: laps cap at L58 and km at 21.1, so stoppage and extra time never run past the race.

Brand names stay generic: no F1, PlayStation or Game Boy marks, and the rival drivers are invented.

## 2. Start screen: "Choose your world"

- Full-screen dialog on load, with five tiles. Each tile uses its world's colours and font and shows the costume sprite blinking.
- Visitors click a tile or press 1–5. "Surprise me" or Esc picks a random world.
- **If nobody picks within 8 seconds, a random world is picked.** The countdown bar pauses while the pointer is over the tiles or a tile has keyboard focus.
- The world wipe then shows "Welcome to <World>" or "Random pick / <World>".
- The start screen has its own sound toggle, and clicking it unlocks audio.
- A prop (`intro`, default on) turns the start screen off.
- Real site: the start screen shows once per visit. A returning visitor sees it again over their last world (localStorage `va-world`), with that tile marked "Last time"; the countdown and Esc go back to it instead of a random pick. Reloads in the same tab and `?world=` links skip it (sessionStorage `va-seen`). Changed 2026-10-28 at Vishal's request (was: returning visitors skip it).
- The "type VAR" easter egg is football-only (its labels are football words) and switches off on any world change.

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

The hero sprite takes the headgear off as you scroll down and changes back into the elephant shirt, ending as the plain football avatar. The Pundit sprite does the same as it comes into view. The footer sprite is always the plain avatar, with no costume and no transition. Scrolling back up puts the costume on again.

- **Frames:** 8 per world, generated by `design/pixel-me/generate_unmask.py`, which writes `design/pixel-me/worlds/vishal_<world>_unmask_8x.png` (3072 × 448).
  - Frame 0 is the full costume.
  - The headgear lifts up and off the top over frames 1–6, while the outfit changes back row by row.
  - Frame 7 is the base bust.
- **Hero:** the animation starts once the sprite is fully on screen and runs over 280 px of scroll.
- **Pundit:** the animation starts when the sprite's top reaches 92% of the viewport height, and runs over 160 px.
- **Layering:** at frame 0 the normal costume layers show (gaze and blink still work). At frames 1–6 the strip frame shows. At frame 7 the base layers show (blinks work again).
- **Detection label:** switches to "vishal 0.99" once the costume is off.
- **Hint:** a small "Scroll · helmet off" tag shows on the hero stage until the costume is off.
- **Sound:** with sound on, there's a gear-off sound when the animation starts and a gear-on sound when it goes back to 0.
- **Reduced motion:** a straight swap at 50% progress, with no in-between frames.
