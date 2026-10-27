# Worlds spec: §5 Sound, §6 Line-up per world

Part of `tasks/worlds-spec/` (index: `README.md`).

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
