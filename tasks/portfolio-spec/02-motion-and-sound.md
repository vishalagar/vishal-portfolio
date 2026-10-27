# Portfolio spec: §4 Motion and sound

Part of `tasks/portfolio-spec/` (index: `README.md`).

## 4. Motion and sound

### Global

- Respect `prefers-reduced-motion`: turn off every animation and transition, and the kit room goes straight to "lit".
- Sound is **off by default** and toggled from the header. Every sound is synthesised in the browser with WebAudio; there are no audio files.

### Scroll moments

These use CSS scroll-driven animations inside `@supports (animation-timeline: view())`. Unsupported browsers (currently Firefox) get a normal static page.

| Moment | How it works |
|---|---|
| Progress bar | Fixed 4px accent bar, `scaleX` tied to `scroll(root)` |
| Hero exit | The text lifts away and fades (`exit 0% → 75%`) while the pitch zooms to 1.14x |
| Half-time team talk | A 240vh section with a sticky inner panel. 14 words light up one by one (word i covers `contain i·80/14%` to that value + 10%). A pixel ball rolls across underneath. |
| Career timeline | A 300vh section, pinned. The card track slides sideways with `translateX(calc(-100% + 100vw))` over `contain 5% → 95%`, and the progress bar fills in step. |
| Reveals | Section titles, cards and panels rise 70px and fade in over `entry 0% → cover 28%` |

### Timed animations

- Live dot pulse; scrolling news ticker (38s loop).
- Sprite bob, which is stepped to feel pixel-like; ball dribble and kick.
- Detection-box scan line.
- Black-and-white to colour wipe on the colorization card.
- Marathon pace bars grow in, staggered 60ms apart.
- Pundit typing cursor.
- Kit room sway (2.9–3.7s, ±1.6°).

### Sounds

| Trigger | Sound |
|---|---|
| Sound on | Referee whistle, plus a low crowd hum (looping band-passed brown noise with a slow LFO) |
| "Watch highlights" / "Email" | Whistle |
| Ball kick, shot | Low thud |
| Buttons, Pundit questions, VAR toggle | Short square-wave blip |
| Theme to night | Three electrical clunks plus a rising hum |
| Theme to day | Falling hum plus a clunk |
| Kit room spotlight on | Clunk, click and short hum, pitched slightly differently for each light |
| Shirt flip | Cloth whoosh: band-pass noise sweeping from 450 to 2600 Hz over 0.35s |
| PrintSafe demo | Blips per stage; a high-passed noise burst when the file is shredded |
| Retraining demo | Two-tone alert on an accuracy drop; rising three-note arpeggio on deploy |
| Image generator | Two-note chime when an image finishes |
| Snake | Blip on eating; falling saw tone on game over |
| Football | Thud on shots, softer thud on passes, short whistle at set pieces, goal crowd roar plus whistle, three whistles at half-time and full time |

---
