# Worlds spec: §8 Phone, §9 Porting checklist

Part of `tasks/worlds-spec/` (index: `README.md`).

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
- [x] Costume-off scroll hook shared by the hero and Pundit sprites (footer is always plain), with a reduced-motion swap.
- [x] Sound: per-world sets, master and ambient volumes in `src/lib/sound.ts`, and unit tests (an offline-render test like `sim/render_audio.mjs` if feasible).
- [x] Line-up components per world (grid, character select, corrals, network).
- [x] Games: Race, Pace run and Label Rush as engines in `src/lib/engines/`, with deterministic tests like the football engine; Snake already exists.
- [x] e2e: pick a world, the random pick, a theme toggle per world, the costume-off frames on scroll, and the PrintSafe card first in every world.

Port notes (what was built, how it was verified, and known gaps): `tasks/state.md`, entry 2026-10-26.
