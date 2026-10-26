/**
 * Grand Prix engine: pure and deterministic. State in, state out; randomness is injected.
 * Distances are in track units (one lap = LAP_LENGTH). The visitor (car 4, "VA") starts last of eight.
 * One tick = TICK_MS. Ported from design/mock-worlds/RaceGame.dc.html.
 */
import { clamp, type Rng } from "./rng";

export const TICK_MS = 33;
export const LAP_LENGTH = 900;
export const LAPS = 3;
export const TOTAL_DISTANCE = LAP_LENGTH * LAPS;
export const CARS = 8;
export const DRS_PER_RACE = 3;
export const DRS_TICKS = 60;
/** Ticks of lights before the start (five lights, 15 ticks apart, then out at 90). */
export const LIGHTS_TICKS = 90;
/** Attract mode shows the result this long before restarting the race. */
export const RESULT_TICKS = 150;
/** Track half-width as a fraction of the view width. */
export const HALF_WIDTH = 0.38;

export type RaceMode = "attract" | "play";
export type RacePhase = "lights" | "race" | "over";
export type RaceEvent = "light" | "go" | "drs" | "contact" | "lap" | "overtake" | "finish";

export interface RaceInput {
  /** -1 left .. 1 right. */
  steer: number;
  brake: boolean;
  /** Edge-triggered: true on the tick DRS is requested. */
  drs: boolean;
}

export const NO_INPUT: RaceInput = { steer: 0, brake: false, drs: false };

export interface PlayerCar {
  x: number;
  d: number;
  speed: number;
  drs: number;
  boost: number;
  bump: number;
}

export interface Rival {
  name: string;
  num: number;
  body: string;
  wing: string;
  x: number;
  d: number;
  speed: number;
  top: number;
  target: number;
  bump: number;
  /** Tick on which the car crossed the finish line, or null. */
  finishedAt: number | null;
}

export interface Flash {
  text: string;
  t: number;
}

export interface RaceState {
  mode: RaceMode;
  phase: RacePhase;
  /** Ticks since the phase began. */
  t: number;
  /** Ticks since lights out (race clock, used for finishing order). */
  clock: number;
  me: PlayerCar;
  rivals: Rival[];
  position: number;
  flash: Flash | null;
  finishPos: number;
  /** Names, first to last, fixed when the player crosses the line. */
  finishOrder: string[];
  /** What happened this tick, for sound. */
  events: RaceEvent[];
}

const TEAMS: ReadonlyArray<readonly [string, string, string, number]> = [
  ["ACE", "#1e2a78", "#ffd400", 9],
  ["BLZ", "#f2f2f2", "#111111", 21],
  ["ZIP", "#ff8000", "#111111", 12],
  ["NOV", "#7a1fa2", "#ffd400", 30],
  ["KAI", "#00594f", "#c6ff00", 51],
  ["RIO", "#00a19c", "#1e2a78", 77],
  ["TEO", "#5b5b66", "#ff8000", 2],
];

export const PLAYER_NAME = "VA";

/** Centre line of the track (0..1 of the view width) at distance d. */
export function trackCenter(d: number): number {
  return 0.5 + 0.16 * Math.sin(d / 140) + 0.06 * Math.sin(d / 47);
}

export function createRace(mode: RaceMode): RaceState {
  // the visitor starts last: overtaking is the point
  const rivals: Rival[] = TEAMS.map(([name, body, wing, num], i) => {
    const lane = i % 2 ? 0.66 : 0.34;
    return {
      name,
      num,
      body,
      wing,
      x: lane,
      d: 18 + (6 - i) * 14,
      speed: 0,
      top: 0.9 + ((i * 37) % 7) / 100,
      target: lane,
      bump: 0,
      finishedAt: null,
    };
  });
  return {
    mode,
    phase: "lights",
    t: 0,
    clock: 0,
    me: { x: 0.5, d: 0, speed: 0, drs: DRS_PER_RACE, boost: 0, bump: 0 },
    rivals,
    position: CARS,
    flash: null,
    finishPos: 0,
    finishOrder: [],
    events: [],
  };
}

/** Number of lit start lights (0..5). */
export function litLights(s: RaceState): number {
  return s.phase === "lights" ? Math.min(5, Math.floor(s.t / 15)) : 0;
}

/** The bot: aim for the side with more room, use DRS when a car is close in front. */
export function botInput(s: RaceState, rng: Rng): RaceInput {
  const ahead = s.rivals.filter((c) => c.d > s.me.d && c.d - s.me.d < 60);
  let target = 0.5;
  let nearest: (typeof ahead)[number] | null = null;
  for (const c of ahead) if (!nearest || c.d < nearest.d) nearest = c;
  if (nearest) target = nearest.x > 0.5 ? 0.3 : 0.7;
  const close = ahead.some((c) => c.d - s.me.d < 30);
  return {
    steer: clamp((target - s.me.x) * 6, -1, 1),
    brake: false,
    drs: close && s.me.drs > 0 && rng() < 0.05,
  };
}

function stepRival(c: Rival, human: boolean, rng: Rng): Rival {
  const target = rng() < 0.01 ? 0.25 + rng() * 0.5 : c.target;
  const tSpeed = c.top * (human ? 0.97 : 1);
  let speed = c.speed + (tSpeed - c.speed) * 0.02;
  let bump = c.bump;
  if (bump > 0) {
    speed *= 0.97;
    bump -= 1;
  }
  return { ...c, target, x: c.x + (target - c.x) * 0.02, speed, bump, d: c.d + speed * 2.2 };
}

function stepMe(me: PlayerCar, inp: RaceInput, events: RaceEvent[]): { me: PlayerCar; flash: Flash | null } {
  let { drs, boost } = me;
  let flash: Flash | null = null;
  if (inp.drs && drs > 0 && boost === 0) {
    drs -= 1;
    boost = DRS_TICKS;
    flash = { text: "DRS", t: 20 };
    events.push("drs");
  }
  const offTrack = Math.abs(me.x - 0.5) > 0.44;
  const top = (boost > 0 ? 1.25 : 1) * (offTrack ? 0.5 : 1);
  const target = inp.brake ? 0.35 : top;
  let speed = me.speed + (target - me.speed) * (inp.brake ? 0.08 : 0.025);
  let bump = me.bump;
  if (bump > 0) {
    speed *= 0.97;
    bump -= 1;
  }
  const x = clamp(me.x + clamp(inp.steer, -1, 1) * 0.018, 0.02, 0.98);
  return { me: { x, d: me.d + speed * 2.2, speed, drs, boost: Math.max(0, boost - 1), bump }, flash };
}

/** Whoever is behind loses speed and both cars are pushed apart. Returns new cars. */
function resolveContact(me: PlayerCar, rivals: Rival[]): { me: PlayerCar; rivals: Rival[]; hit: boolean } {
  let m = me;
  let hit = false;
  const out = rivals.map((c) => {
    const dy = c.d - m.d;
    const dx = c.x - m.x;
    if (Math.abs(dy) >= 9 || Math.abs(dx) >= 0.11) return c;
    hit = true;
    const push = Math.sign(dx || 1) * 0.03;
    const meBehind = dy > 0;
    m = {
      ...m,
      x: m.x - push,
      ...(meBehind ? { bump: 20, speed: m.speed * 0.8 } : {}),
    };
    return { ...c, x: c.x + push, ...(meBehind ? {} : { bump: 20, speed: c.speed * 0.8 }) };
  });
  return { me: m, rivals: out, hit };
}

function stepLights(s: RaceState): RaceState {
  const t = s.t + 1;
  const events: RaceEvent[] = [];
  if (t % 15 === 0 && t <= 75) events.push("light");
  if (t >= LIGHTS_TICKS) {
    return { ...s, phase: "race", t: 0, flash: { text: "Lights out", t: 30 }, events: ["go"] };
  }
  return { ...s, t, events };
}

function finishOrder(me: PlayerCar, rivals: Rival[], clock: number): string[] {
  const entries = [
    { name: PLAYER_NAME, at: clock, d: me.d },
    ...rivals.map((c) => ({ name: c.name, at: c.finishedAt ?? Infinity, d: c.d })),
  ];
  // earlier line-crossing first; cars still running are ordered by distance
  entries.sort((a, b) => (a.at === b.at ? b.d - a.d : a.at - b.at));
  return entries.map((e) => e.name);
}

function stepRace(s: RaceState, inp: RaceInput, rng: Rng): RaceState {
  const events: RaceEvent[] = [];
  const clock = s.clock + 1;
  const human = s.mode === "play";
  const mine = stepMe(s.me, inp, events);
  const moved = s.rivals.map((c) => {
    const n = stepRival(c, human, rng);
    return n.finishedAt === null && n.d >= TOTAL_DISTANCE ? { ...n, finishedAt: clock } : n;
  });
  const contact = resolveContact(mine.me, moved);
  const me = contact.me;
  const rivals = contact.rivals;

  let flash = s.flash && s.flash.t > 1 ? { ...s.flash, t: s.flash.t - 1 } : null;
  if (mine.flash) flash = mine.flash;
  if (contact.hit) {
    events.push("contact");
    if (!flash) flash = { text: "Contact", t: 16 };
  }

  const lapBefore = Math.floor(s.me.d / LAP_LENGTH);
  const lapNow = Math.floor(me.d / LAP_LENGTH);
  if (lapNow > lapBefore && lapNow < LAPS) {
    events.push("lap");
    flash = { text: `Lap ${lapNow + 1}`, t: 30 };
  }

  const position = 1 + rivals.filter((c) => c.d > me.d).length;
  if (position < s.position) {
    events.push("overtake");
    flash = { text: "Overtake", t: 18 };
  }

  if (me.d >= TOTAL_DISTANCE) {
    const order = finishOrder(me, rivals, clock);
    return {
      ...s,
      phase: "over",
      t: 0,
      clock,
      me,
      rivals,
      position,
      flash: null,
      finishPos: order.indexOf(PLAYER_NAME) + 1,
      finishOrder: order,
      events: [...events, "finish"],
    };
  }
  return { ...s, t: s.t + 1, clock, me, rivals, flash, position, events };
}

/**
 * Advance one tick. In attract mode the bot drives (pass any input; it is ignored).
 * Over: attract restarts itself after RESULT_TICKS; play waits for the caller to createRace again.
 */
export function stepRaceTick(s: RaceState, inp: RaceInput, rng: Rng): RaceState {
  if (s.phase === "over") {
    if (s.mode === "attract" && s.t >= RESULT_TICKS) return createRace("attract");
    return { ...s, t: s.t + 1, events: [] };
  }
  if (s.phase === "lights") return stepLights(s);
  const driven = s.mode === "play" ? inp : botInput(s, rng);
  return stepRace(s, driven, rng);
}

export function lapOf(s: RaceState): number {
  return Math.min(LAPS, Math.floor(s.me.d / LAP_LENGTH) + 1);
}

/** Speedometer reading, km/h. */
export function kmh(s: RaceState): number {
  return Math.round(s.me.speed * 290);
}

export function verdict(finishPos: number): string {
  if (finishPos === 1) return "Race win. From the back of the grid.";
  if (finishPos <= 3) return "Podium. Spray the champagne.";
  return "Points finish. Box, box for a better strategy.";
}

/** Fake-but-stable detection confidence label for a rival, e.g. "car 21 0.91". */
export function detectLabel(c: Rival): string {
  return `car ${c.num} 0.9${c.num % 10}`;
}
