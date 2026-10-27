# Portfolio spec: §6.5–6.7 Football match, kit room, sprite

Part of `tasks/portfolio-spec/` (index: `README.md`).

### 6.5 Football match (Match of the day)

**Format:** 2v2 plus keepers. VA (Vishal #4 and #9) vs CPU (#3 and #5). A 90-second match where one second is one minute, with a half-time whistle at 45' and a full-time result screen.

**Controls:**
- Keyboard: arrows or WASD to move, Shift to sprint (uses stamina), X or K to pass, hold Space to charge a shot (release to shoot), tap Space to tackle while defending.
- Touch: d-pad plus Sprint, Pass and Shoot buttons.
- The player you control switches automatically to whichever of #4 and #9 has the ball or is nearer to it.

**Rules:**
- Throw-ins, corners (ball last touched by a defender), goal kicks.
- After a goal, the team that conceded kicks off.
- Every player and the ball wears a detection box with an ID, which is the link to Football Vision.

**Engine tuning** (field is 100 × 50 units, 30 ticks per second):

| Parameter | Value |
|---|---|
| Speed (walk / sprint) | 0.62 / 0.95 |
| Acceleration | 0.22 |
| Stamina | −0.011 per tick while sprinting, +0.004 otherwise |
| Ball carry distance | 2.3 (×1.3 when sprinting) |
| Pick-up radius | 2.8 |
| Fast-ball control chance | 0.3 per tick (0.85 for the intended receiver) |
| Tackle | radius 2.8, chance 0.035 per tick (×1.4 against a sprinting carrier), 55% win the ball / 45% poke it loose |
| Settle window | 14 ticks with no tackles after a change of possession |
| Shot | speed 1.8–3.3 by power; power = 0.3 + charge/24 (max 1) |
| Shot spread | `3.2·(0.35 + p²)·(0.6 + dist/40)` |
| Pass | speed 2.0 × (0.7 + dist/45), max 1.4×; aimed 10 ticks ahead of the receiver |
| Ball friction | 0.965 |
| Goal mouth | y 19.5–30.5 |
| Keeper | range y 20.5–29.5, speed 0.38 (×1.5 on a fast shot), re-reads the play every 4 ticks (a reaction delay) |
| Save | radius 2.9, one attempt per shot; chance `clamp(1.3 − 0.22·speed − 0.1·|Δy|, 0.3, 0.94)`; catches if speed < 2.3, otherwise parries |
| Keeper distribution | holds for 22 ticks, then passes to the teammate with the most space |
| Human-mode easing | CPU speed ×0.92, CPU tackle chance ×0.7 |

**AI:**
- Carrier: shoot when within 26 units of goal and under pressure, or within 15 of goal (aiming at the corner away from the keeper). Otherwise pass with 18% chance per tick when pressed and a teammate is open ahead. Otherwise dribble toward goal, sidestepping 9 units away from the nearest opponent.
- Teammate of the carrier: supporting run 15 units ahead, on the opposite side.
- Defenders: the nearer one chases the ball; the other marks the most dangerous attacker, 4 units goal-side.
- **The AI thinks in a team-relative frame** (its own team always attacks to the right). This fixed a 60/40 CPU bias that mirrored, deterministic simulations exposed. Keep it.
- Bot-vs-bot simulations average about 4–5 goals a match, with no NaN values and no stuck balls.

### 6.6 Kit room

- A dark showroom panel holding four pixel shirts on hangers, swaying gently. Tap a shirt to spin it 180° (0.6s) between back and front, with the whoosh sound.
- **3D flip structure** (this matters): the button sways; an inner wrapper carries `perspective`, the brightness `filter` and the flash animation; inside it, the spinner has `transform-style: preserve-3d` and the `rotateY`; the two faces use `backface-visibility: hidden` (plus the `-webkit-` prefix for Safari). Never put `filter`, `opacity < 1` or `overflow` on the spinner itself: CSS flattens 3D there, and the turned shirt shows the back mirrored.
- Each lamp hangs about 78px above its hanger and casts a 400px cone down over the shirt.
- **Reveal:** an IntersectionObserver (45% threshold) fires once. The shirts start dimmed (`brightness(.25)`). Spotlights switch on one by one at 500ms + i × 420ms: the lamp bulb lights, a light cone and floor glow fade in, the shirt flashes (brightness 2.4 → 1 over 0.7s), and the clunk plays.
- "Lights again" replays the sequence.

| Shirt | Back | Front | Caption (confirmed) |
|---|---|---|---|
| MIT Hockey (blue speckle) | gold VISHAL, big 4 | gold shoulder stripes, MIT HOCKEY, crest | Revels · **Runners-up** |
| MIT Manipal (grey, black sleeves) | black MIT / MANIPAL, 4, VISHAL underneath | side panels, crest | Inter-MAHE · medal + Certificate of Merit · **Winners** |
| MIT Manipal (purple / white) | white MIT / MANIPAL, 4 | white diagonal chest band, crest | Inter-MAHE · **Winners** |
| MIT Hockey (black, yellow lines) | yellow VISHAL 4 | MIT HOCKEY, crests | Revels '23 · **Runners-up** |

Each shirt shows a result badge: gold for Winners, silver (`#c9d1d6`) for Runners-up.

Crests are generic stand-ins. Do not reproduce the real MIT/MAHE logo.

### 6.7 The sprite

- A 48×56 bust: curly black hair with warm highlights, thin round glasses, open brown eyes, white shirt with a blue elephant block print.
- A sheet of 5 frames: open, look-left, look-right, half-closed, closed.
- Two layers: a gaze layer (cursor-driven in the hero, otherwise a 13s glance cycle) and a lids layer for blinks.
- Blinks follow an 11s `step-end` cycle: blinks at 7%, 39.5% and 42.4% (a double blink) and 77.5%; half → closed → half takes about 200ms.
- The Pundit and footer copies use 9.3s and 13.7s cycles with offsets, so they never blink in sync.
- The eyes follow the cursor when it is more than 90px left or right of the sprite, and look right when the ball is kicked.
- **Real build:** randomise blinks in JS (every 2–6s, about 150ms each).

---
