import type { Palette } from "@/content/worlds";
import { TARGET, fmtPace, isOnPace, kmOf, paceOf, type PaceState, type Rival } from "@/lib/engines/pace";

/** Scenery stays blue in both themes (the Running world is blue); text and accents come from the palette. */
const SKY_TOP = "#7fb4ff";
const SKY_BOTTOM = "#bcd8ff";
const BUILDING = "#3a6fd8";
const BUILDING_EDGE = "#1d4fbf";
const ROAD = "#4b4f5c";
const WARN = "#ff9f6b";
const LOW = "#ff6b6b";
const SKIN = "#c98a5c";
const SKIN_DARK = "#a3653f";
const OUTLINE = "#120e14";
const WATER = "#7fd3ff";
const SCALE = 1.6; // % of width per unit
const LANE_Y = [0.64, 0.77, 0.9] as const;
const SKYLINE = Array.from({ length: 12 }, (_, i) => ({ x: i * 9 + ((i * 13) % 5), w: 5 + ((i * 7) % 4), h: 35 + ((i * 29) % 60) }));

export interface Fonts {
  pixel: string;
  display: string;
}

export interface Frame {
  w: number;
  h: number;
  /** Elements scale with the box: 1 at the mock's 720 x 360. */
  k: number;
  fonts: Fonts;
  pal: Palette;
  human: boolean;
}

export function frameScale(w: number, h: number): number {
  return Math.max(0.75, Math.min(2, Math.min(w / 720, h / 360)));
}

const font = (f: Frame, px: number, family: "pixel" | "display") => `${Math.round(px * f.k)}px ${f.fonts[family]}`;

function strokeRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lw: number, color: string) {
  c.lineWidth = lw;
  c.strokeStyle = color;
  c.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw);
}

function drawScenery(c: CanvasRenderingContext2D, s: PaceState, f: Frame) {
  const { w, h } = f;
  const g = c.createLinearGradient(0, 0, 0, h * 0.46);
  g.addColorStop(0, SKY_TOP);
  g.addColorStop(1, SKY_BOTTOM);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h * 0.46);
  c.fillStyle = SKY_BOTTOM;
  c.fillRect(0, h * 0.46, w, h * 0.54);
  const top = h * 0.12;
  const sh = h * 0.34;
  for (const b of SKYLINE) {
    const left = ((((b.x - s.me.d * 0.08) % 110) + 110) % 110) - 5;
    const bh = (b.h / 100) * sh;
    const bw = (b.w / 100) * w;
    c.fillStyle = BUILDING;
    c.fillRect((left / 100) * w, top + sh - bh, bw, bh);
    strokeRect(c, (left / 100) * w, top + sh - bh, bw, bh, 2, BUILDING_EDGE);
  }
  // barrier: white and blue stripes that slide with the runner
  const by = h * 0.46;
  const bh = h * 0.08;
  const shift = (s.me.d * 6) % 28;
  for (let x = -28 - shift; x < w; x += 28) {
    c.fillStyle = "#f2f2f2";
    c.fillRect(x, by, 14, bh);
    c.fillStyle = BUILDING_EDGE;
    c.fillRect(x + 14, by, 14, bh);
  }
  c.fillStyle = f.pal.line;
  c.fillRect(0, by, w, 2);
  c.fillRect(0, by + bh - 2, w, 2);
  // road
  c.fillStyle = ROAD;
  c.fillRect(0, h * 0.54, w, h * 0.46);
  const lane = (s.me.d * 9) % 36;
  c.fillStyle = "#ffffff";
  for (const frac of [0.33, 0.66]) {
    const y = h * 0.54 + h * 0.46 * frac;
    for (let x = -36 - lane; x < w; x += 36) c.fillRect(x, y, 18, 2);
  }
  c.fillStyle = f.pal.accent;
  c.fillRect(0, h * 0.54, w, 3);
}

const xOf = (s: PaceState, f: Frame, d: number) => (0.3 + ((d - s.me.d) * SCALE) / 100) * f.w;

function drawMarkers(c: CanvasRenderingContext2D, s: PaceState, f: Frame) {
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = font(f, 10, "pixel");
  for (let k = Math.floor((s.me.d - 30) / 100); k <= Math.floor((s.me.d + 60) / 100) + 1; k++) {
    if (k < 1 || k > 21) continue;
    const x = xOf(s, f, k * 100);
    const y = f.h * 0.36;
    c.fillStyle = f.pal.line;
    c.fillRect(x - 1, y, 3, 60 * f.k);
    const bw = 48 * f.k;
    const bh = 15 * f.k;
    c.fillStyle = k === 21 ? f.pal.accent : "#ffffff";
    c.fillRect(x - bw / 2, y - 6 * f.k, bw, bh);
    strokeRect(c, x - bw / 2, y - 6 * f.k, bw, bh, 2, f.pal.line);
    c.fillStyle = f.pal.line;
    c.fillText(k === 21 ? "Finish" : `km ${k}`, x, y + 1.5 * f.k);
  }
}

function drawWater(c: CanvasRenderingContext2D, s: PaceState, f: Frame) {
  for (const w of s.waters) {
    const x = xOf(s, f, w.d);
    if (w.taken || x < -5 || x > f.w + 5) continue;
    const bw = 10 * f.k;
    const bh = 14 * f.k;
    const y = LANE_Y[w.lane] * f.h - bh;
    c.fillStyle = WATER;
    c.fillRect(x - bw / 2, y, bw, bh);
    strokeRect(c, x - bw / 2, y, bw, bh, 2, f.pal.line);
  }
}

interface Look {
  x: number;
  lane: number;
  phase: number;
  shirt: string;
  band: string;
  label: string;
  mine: boolean;
}

function drawRunner(c: CanvasRenderingContext2D, f: Frame, r: Look) {
  const k = f.k;
  const swing = (Math.sin(r.phase) * 28 * Math.PI) / 180;
  c.save();
  c.translate(r.x, LANE_Y[r.lane] * f.h);
  c.scale(k, k);
  const px = (x: number, y: number, w: number, h: number, fill: string, edge?: string) => {
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
    if (edge) strokeRect(c, x, y, w, h, 1, edge);
  };
  const leg = (x: number, a: number, fill: string) => {
    c.save();
    c.translate(x + 1.5, -30 + 18);
    c.rotate(a);
    c.fillStyle = fill;
    c.fillRect(-1.5, 0, 3, 11);
    c.restore();
  };
  leg(-6 + 3, swing, SKIN);
  leg(-6 + 6, -swing, SKIN_DARK);
  px(-6 + 3, -30, 6, 6, SKIN, OUTLINE);
  px(-6 + 3, -29, 6, 2, r.band);
  px(-6 + 2, -30 + 7, 8, 10, r.shirt, OUTLINE);
  px(-6 + 4, -30 + 9, 4, 4, "#ffffff");
  // detection box + id tag, like the sports-detection overlay
  strokeRect(c, -10, -35, 20, 38, r.mine ? 3 : 2, r.mine ? f.pal.accent : "#ffffffaa");
  c.font = `8px ${f.fonts.pixel}`;
  c.textAlign = "left";
  c.textBaseline = "middle";
  const tw = c.measureText(r.label).width + 4;
  px(-10, -48, tw, 11, r.mine ? f.pal.accent : "#ffffff");
  c.fillStyle = f.pal.line;
  c.fillText(r.label, -8, -42);
  c.restore();
}

function drawRunners(c: CanvasRenderingContext2D, s: PaceState, f: Frame) {
  const rivals: Look[] = s.rivals
    .filter((r: Rival) => xOf(s, f, r.d) > -0.08 * f.w && xOf(s, f, r.d) < 1.08 * f.w)
    .map((r) => ({ x: xOf(s, f, r.d), lane: r.lane, phase: r.phase, shirt: r.shirt, band: r.shirt, label: `runner #${r.id} 0.9${r.id % 10}`, mine: false }));
  const me: Look = { x: xOf(s, f, s.me.d), lane: s.me.lane, phase: s.me.step * 1.6, shirt: "#1d4fbf", band: f.pal.accent, label: f.human ? "you · #4" : "VA · #4", mine: true };
  // lower lanes are nearer the camera; the runner is on top of anyone in their lane
  [...rivals, me].sort((a, b) => a.lane - b.lane || Number(a.mine) - Number(b.mine)).forEach((r) => drawRunner(c, f, r));
}

function pill(c: CanvasRenderingContext2D, f: Frame, x: number, y: number, text: string, bg: string, ink: string, size = 9): number {
  c.font = font(f, size, "pixel");
  c.textAlign = "left";
  c.textBaseline = "middle";
  const w = c.measureText(text).width + 14 * f.k;
  const h = size * f.k + 7 * f.k;
  c.fillStyle = bg;
  c.fillRect(x, y, w, h);
  c.fillStyle = ink;
  c.fillText(text, x + 7 * f.k, y + h / 2 + 0.5);
  return h;
}

function drawHud(c: CanvasRenderingContext2D, s: PaceState, f: Frame) {
  const pad = 10 * f.k;
  const pal = f.pal;
  let y = pad;
  // target + km
  const head = `Target ${fmtPace(TARGET)}`;
  c.font = font(f, 18, "display");
  const hw = c.measureText(head).width + 14 * f.k;
  const km = `${kmOf(s.me.d).toFixed(1)} km`;
  const kw = c.measureText(km).width + 14 * f.k;
  const hh = 18 * f.k + 8 * f.k;
  c.fillStyle = pal.accent;
  c.fillRect(pad, y, hw, hh);
  c.fillStyle = pal.line;
  c.fillRect(pad + hw, y, kw, hh);
  c.textBaseline = "middle";
  c.textAlign = "left";
  c.fillStyle = pal.onAccent;
  c.fillText(head, pad + 7 * f.k, y + hh / 2 + 1);
  c.fillStyle = "#ffffff";
  c.fillText(km, pad + hw + 7 * f.k, y + hh / 2 + 1);
  strokeRect(c, pad, y, hw + kw, hh, 2, pal.line);
  y += hh + 4 * f.k;
  // stamina
  const sh = 9 * f.k + 7 * f.k;
  c.font = font(f, 9, "pixel");
  const label = "stamina";
  const lw = c.measureText(label).width;
  const bar = 60 * f.k;
  c.fillStyle = pal.line;
  c.fillRect(pad, y, lw + bar + 26 * f.k, sh);
  c.fillStyle = "#ffffff";
  c.fillText(label, pad + 7 * f.k, y + sh / 2 + 0.5);
  const bx = pad + 7 * f.k + lw + 6 * f.k;
  c.fillStyle = "#22417e";
  c.fillRect(bx, y + sh / 2 - 3 * f.k, bar, 6 * f.k);
  c.fillStyle = s.me.stamina > 0.3 ? pal.accent : LOW;
  c.fillRect(bx, y + sh / 2 - 3 * f.k, bar * s.me.stamina, 6 * f.k);
  y += sh + 4 * f.k;
  // live pace, coloured by the band
  const pace = paceOf(s.me.speed);
  const off = pace - TARGET;
  const good = !pace || isOnPace(pace);
  const note = !pace ? "start" : good ? "on target" : off < 0 ? "too fast" : "too slow";
  const txt = `pace ${pace ? fmtPace(pace) : "--:--"} /km · ${note}${s.drafting ? " · drafting" : ""}`;
  y += pill(c, f, pad, y, txt, good ? pal.accent : WARN, pal.onAccent) + 4 * f.k;
  pill(c, f, pad, y, `on pace ${s.onTarget} of ${s.judged} km`, pal.line, "#ffffff");
}

function drawBadge(c: CanvasRenderingContext2D, f: Frame) {
  const full = `PaceCoach pacer · holding ${fmtPace(TARGET)} /km`;
  c.font = font(f, 10, "pixel");
  // the HUD takes the left ~220 px; drop to the short label on a phone
  const text = c.measureText(full).width + 14 * f.k + 230 * f.k < f.w ? full : "PaceCoach pacer";
  const w = c.measureText(text).width + 14 * f.k;
  pill(c, f, f.w - w - 10 * f.k, 10 * f.k, text, f.pal.line, "#ffffff", 10);
}

function drawFlash(c: CanvasRenderingContext2D, s: PaceState, f: Frame) {
  const fl = s.flash;
  if (!fl || s.phase === "over") return;
  const ink = fl.kind === "bad" ? WARN : f.pal.accent;
  c.font = font(f, 40, "display");
  c.textAlign = "center";
  c.textBaseline = "middle";
  const cx = f.w / 2;
  const cy = f.h * 0.3;
  const text = fl.text.toUpperCase();
  c.fillStyle = f.pal.line;
  c.fillText(text, cx + 3, cy + 3);
  c.fillStyle = ink;
  c.fillText(text, cx, cy);
  if (fl.sub) {
    c.font = font(f, 11, "pixel");
    const w = c.measureText(fl.sub).width + 14 * f.k;
    const h = 11 * f.k + 7 * f.k;
    const y = cy + 28 * f.k;
    c.fillStyle = f.pal.line;
    c.fillRect(cx - w / 2, y, w, h);
    c.fillStyle = "#ffffff";
    c.fillText(fl.sub, cx, y + h / 2 + 0.5);
  }
}

/** Paint one frame. Pure drawing; no state is kept here. */
export function drawPace(c: CanvasRenderingContext2D, s: PaceState, f: Frame): void {
  c.clearRect(0, 0, f.w, f.h);
  drawScenery(c, s, f);
  drawMarkers(c, s, f);
  drawWater(c, s, f);
  drawRunners(c, s, f);
  drawHud(c, s, f);
  if (!f.human) drawBadge(c, f);
  drawFlash(c, s, f);
}
