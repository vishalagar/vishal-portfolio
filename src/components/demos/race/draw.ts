/** Canvas drawing for the Grand Prix game. Pure functions of (context, state, size, theme). */
import type { Palette } from "@/content/worlds";
import {
  CARS,
  detectLabel,
  HALF_WIDTH,
  kmh,
  LAP_LENGTH,
  LAPS,
  lapOf,
  litLights,
  PLAYER_NAME,
  trackCenter,
  type RaceState,
} from "@/lib/engines/race";

const VIEW_BACK = 40;
const VIEW_FWD = 200;
const SPAN = VIEW_BACK + VIEW_FWD;
const SLICES = 30;
const GRASS_A = "#2f7440";
const GRASS_B = "#2a6a3a";
const INK = "#111111";
const WHITE = "#ffffff";
const YOU = "#ffd400";

export interface DrawOpts {
  width: number;
  height: number;
  palette: Palette;
  /** Resolved CSS font stacks (canvas can't read var()). */
  fonts: { pixel: string; display: string };
  /** Attract mode shows "AI driving"; play mode labels the car "you". */
  human: boolean;
}

interface View {
  gx: number;
  gw: number;
  h: number;
  s: number;
  meD: number;
}

/** Distance to screen y: the player sits near the bottom, VIEW_FWD ahead is the top. */
const yOf = (v: View, d: number): number => (1 - (d - (v.meD - VIEW_BACK)) / SPAN) * v.h;
const xOf = (v: View, d: number, lane = 0.5): number => v.gx + (trackCenter(d) + (lane - 0.5) * HALF_WIDTH * 2) * v.gw;

function drawGrass(ctx: CanvasRenderingContext2D, v: View, w: number): void {
  const band = 18 * v.s;
  ctx.fillStyle = GRASS_B;
  ctx.fillRect(0, 0, w, v.h);
  ctx.fillStyle = GRASS_A;
  const shift = (v.meD * 4 * v.s) % (band * 2);
  for (let y = shift - band * 2; y < v.h; y += band * 2) ctx.fillRect(0, y, w, band);
}

function drawTrack(ctx: CanvasRenderingContext2D, v: View, p: Palette): void {
  const kerbW = Math.max(3, 4 * v.s);
  const sliceH = SPAN / SLICES;
  for (let i = 0; i < SLICES; i++) {
    const d0 = v.meD - VIEW_BACK + sliceH * i;
    const c = trackCenter(d0);
    const left = v.gx + (c - HALF_WIDTH) * v.gw;
    const width = HALF_WIDTH * 2 * v.gw;
    const top = yOf(v, d0 + sliceH);
    const hh = v.h / SLICES + 1;
    ctx.fillStyle = p.pitchA;
    ctx.fillRect(left, top, width, hh);
    ctx.fillStyle = Math.floor(d0 / 12) % 2 ? p.red : p.chalk;
    ctx.fillRect(left, top, kerbW, hh);
    ctx.fillRect(left + width - kerbW, top, kerbW, hh);
  }
  for (let k = 0; k <= LAPS; k++) {
    const d = k * LAP_LENGTH;
    if (d <= v.meD - VIEW_BACK || d >= v.meD + VIEW_FWD) continue;
    const left = v.gx + (trackCenter(d) - HALF_WIDTH) * v.gw;
    const width = HALF_WIDTH * 2 * v.gw;
    const cell = 8 * v.s;
    const y = yOf(v, d);
    for (let x = 0; x < width; x += cell) {
      ctx.fillStyle = Math.floor(x / cell) % 2 ? INK : WHITE;
      ctx.fillRect(left + x, y, Math.min(cell, width - x), 10 * v.s);
    }
  }
}

interface CarLook {
  x: number;
  y: number;
  body: string;
  wing: string;
  box: string;
  boxW: number;
  tagBg: string;
  label: string;
}

function drawCar(ctx: CanvasRenderingContext2D, v: View, c: CarLook, pixel: string): void {
  const s = v.s;
  const r = (x: number, y: number, w: number, h: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.fillRect(c.x + x * s, c.y + y * s, w * s, h * s);
  };
  // top-down car, 18x32 around the origin
  r(-9, -14, 18, 4, c.wing);
  r(-8, -10, 4, 7, INK);
  r(4, -10, 4, 7, INK);
  r(-3, -13, 6, 26, INK);
  r(-2, -12, 4, 24, c.body);
  r(-2, -3, 4, 5, INK);
  r(-9, 3, 4, 8, INK);
  r(5, 3, 4, 8, INK);
  r(-8, 12, 16, 4, c.wing);
  // detection box + tag
  ctx.strokeStyle = c.box;
  ctx.lineWidth = c.boxW;
  ctx.strokeRect(c.x - 14 * s, c.y - 21 * s, 28 * s, 42 * s);
  const fs = Math.max(8, 9 * s);
  ctx.font = `${fs}px ${pixel}`;
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(c.label).width + 6;
  ctx.fillStyle = c.tagBg;
  ctx.fillRect(c.x - 14 * s, c.y - 21 * s - fs - 5, tw, fs + 4);
  ctx.fillStyle = INK;
  ctx.fillText(c.label, c.x - 14 * s + 3, c.y - 21 * s - fs / 2 - 3);
}

function drawCars(ctx: CanvasRenderingContext2D, v: View, st: RaceState, o: DrawOpts): void {
  const visible = st.rivals.filter((c) => c.d > v.meD - VIEW_BACK - 10 && c.d < v.meD + VIEW_FWD + 10);
  for (const c of visible) {
    drawCar(ctx, v, { x: xOf(v, c.d, c.x), y: yOf(v, c.d), body: c.body, wing: c.wing, box: "#ffffffaa", boxW: 2, tagBg: WHITE, label: detectLabel(c) }, o.fonts.pixel);
  }
  const me = st.me;
  drawCar(
    ctx,
    v,
    { x: xOf(v, me.d, me.x), y: yOf(v, me.d), body: o.palette.red, wing: WHITE, box: YOU, boxW: 3, tagBg: YOU, label: o.human ? "you · 4" : `${PLAYER_NAME} · 4` },
    o.fonts.pixel,
  );
}

function tag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, o: DrawOpts, align: "left" | "right" = "left"): void {
  ctx.font = `${size}px ${o.fonts.pixel}`;
  ctx.textBaseline = "middle";
  const w = ctx.measureText(text).width + 14;
  const left = align === "left" ? x : x - w;
  ctx.fillStyle = INK;
  ctx.fillRect(left, y, w, size + 6);
  ctx.fillStyle = WHITE;
  ctx.fillText(text, left + 7, y + (size + 6) / 2 + 1);
}

function drawHud(ctx: CanvasRenderingContext2D, v: View, st: RaceState, o: DrawOpts): void {
  const s = Math.min(1.4, Math.max(0.85, v.s));
  const x = v.gx + 10;
  let y = 10;
  const bh = 24 * s;
  const disp = `900 ${18 * s}px ${o.fonts.display}`;
  ctx.textBaseline = "middle";
  ctx.font = disp;
  const pos = `P${st.position}`;
  const pw = ctx.measureText(pos).width + 14;
  const tw = ctx.measureText(`/ ${CARS}`).width + 14;
  ctx.font = `${11 * s}px ${o.fonts.pixel}`;
  const lap = `Lap ${lapOf(st)}/${LAPS}`;
  const lw = ctx.measureText(lap).width + 14;
  ctx.fillStyle = WHITE;
  ctx.fillRect(x, y, pw, bh);
  ctx.fillStyle = INK;
  ctx.fillRect(x + pw, y, tw, bh);
  ctx.fillStyle = o.palette.red;
  ctx.fillRect(x + pw + tw, y, lw, bh);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, pw + tw + lw, bh);
  ctx.font = disp;
  ctx.fillStyle = o.palette.red;
  ctx.fillText(pos, x + 7, y + bh / 2 + 1);
  ctx.fillStyle = WHITE;
  ctx.fillText(`/ ${CARS}`, x + pw + 7, y + bh / 2 + 1);
  ctx.font = `${11 * s}px ${o.fonts.pixel}`;
  ctx.fillText(lap, x + pw + tw + 7, y + bh / 2 + 1);
  y += bh + 4;
  tag(ctx, `${kmh(st)} km/h · DRS ${st.me.drs}`, x, y, 10 * s, o);
  y += 10 * s + 6 + 6;
  // timing tower
  const order = [{ name: PLAYER_NAME, d: st.me.d, color: o.palette.red, you: true }, ...st.rivals.map((c) => ({ name: c.name, d: c.d, color: c.body, you: false }))].sort((a, b) => b.d - a.d);
  const rowH = 12 * s;
  ctx.font = `${9 * s}px ${o.fonts.pixel}`;
  order.forEach((e, i) => {
    const ry = y + i * (rowH + 1);
    ctx.fillStyle = e.you ? YOU : "#111111cc";
    ctx.fillRect(x, ry, 84 * s, rowH);
    ctx.fillStyle = e.you ? INK : WHITE;
    ctx.fillText(`P${i + 1}`, x + 5, ry + rowH / 2 + 1);
    ctx.fillStyle = e.color;
    ctx.fillRect(x + 28 * s, ry + rowH / 2 - 4 * s, 8 * s, 8 * s);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 28 * s, ry + rowH / 2 - 4 * s, 8 * s, 8 * s);
    ctx.fillStyle = e.you ? INK : WHITE;
    ctx.fillText(e.name, x + 40 * s, ry + rowH / 2 + 1);
  });
  if (!o.human) tag(ctx, `AI driving · tracking ${CARS} cars`, v.gx + v.gw - 10, 10, 10 * s, o, "right");
}

function drawLights(ctx: CanvasRenderingContext2D, v: View, st: RaceState): void {
  const lit = litLights(st);
  const r = 9 * v.s;
  const gap = 6 * v.s;
  const w = 5 * r * 2 + 4 * gap + 20;
  const x = v.gx + v.gw / 2 - w / 2;
  const y = v.h * 0.22;
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, w, r * 2 + 16);
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, r * 2 + 16);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(x + 10 + r + i * (2 * r + gap), y + 8 + r, r, 0, Math.PI * 2);
    ctx.fillStyle = i < lit ? "#ff1e1e" : "#2a2a2a";
    ctx.fill();
    ctx.strokeStyle = "#333333";
    ctx.stroke();
  }
}

function drawFlash(ctx: CanvasRenderingContext2D, v: View, st: RaceState, o: DrawOpts): void {
  if (!st.flash || st.phase === "over") return;
  const size = (st.flash.text.length > 8 ? 30 : 44) * Math.min(1.4, v.s);
  ctx.font = `italic 900 ${size}px ${o.fonts.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const text = st.flash.text.toUpperCase();
  const cx = v.gx + v.gw / 2;
  const cy = v.h * 0.42;
  ctx.fillStyle = INK;
  ctx.fillText(text, cx + 4, cy + 4);
  ctx.fillStyle = WHITE;
  ctx.fillText(text, cx, cy);
  ctx.textAlign = "left";
}

/** Draw one frame. `width`/`height` are CSS pixels; the caller has already scaled the context by devicePixelRatio. */
export function drawRace(ctx: CanvasRenderingContext2D, st: RaceState, o: DrawOpts): void {
  const gw = Math.min(o.width, o.height * 0.75);
  const v: View = { gx: (o.width - gw) / 2, gw, h: o.height, s: Math.min(2.4, Math.max(0.7, gw / 270)), meD: st.me.d };
  ctx.clearRect(0, 0, o.width, o.height);
  drawGrass(ctx, v, o.width);
  drawTrack(ctx, v, o.palette);
  drawCars(ctx, v, st, o);
  if (st.phase === "lights") drawLights(ctx, v, st);
  drawHud(ctx, v, st, o);
  drawFlash(ctx, v, st, o);
}
