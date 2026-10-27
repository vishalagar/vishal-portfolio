# Worlds — spec for the real build

The approved "Choose your world" mock, written down so it can be ported to the Next.js site. Same content in every world; each world changes the look, the sound, the wording, the line-up layout and the featured game.

- **Mock (never delete):** https://claude.ai/artifact/XGXN81pFWpSf4rW7ndv7CC (version 27, 2026-10-27: adds World 6 "Golden Hour", the dog world with Cookie and Street Rescue; standalone version in `design/mock-golden/`)
- **Mock source:** `design/mock-worlds/` (`Main.dc.html` is the page; one `.dc.html` per demo/game; checks in `sim/`)
- **Single-world reference:** `design/mock/` (the original football-only mock, also kept)
- **Base spec:** `tasks/portfolio-spec/` still holds content, facts, privacy rules and engine tuning. This file only covers what the worlds add or change.

---

## Files (one per group of sections; section numbers unchanged)

- `01-worlds-start-theme-costume.md` — §1 Five worlds, §2 Start screen, §3 Light/dark, §4 Costume off
- `02-sound-and-lineup.md` — §5 Sound, §6 Line-up per world
- `03-highlights-and-pacecoach.md` — §7 Highlights, PaceCoach facts and pace run
- `04-phone-and-checklist.md` — §8 Phone, §9 Porting checklist
