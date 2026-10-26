import type { Player } from "@/content/career";

/** A line-up as stored in career.ts: front line first, goalkeeper (Python) last. */
export type Lines = ReadonlyArray<ReadonlyArray<Player>>;

/** Role per football line, front line first. Used by the character select. */
export const ROLES = ["Striker", "Mage", "Support", "Tank"] as const;
export type Role = (typeof ROLES)[number];

/** Wave labels per football line, front line first, in the order the corrals are shown. */
const WAVE_LABELS = ["Elite wave", "Wave A", "Wave B", "Pacer"] as const;
/** Football line index order for grid / select / corrals: Python first, then attack, midfield, defence. */
const SQUAD_LINE_ORDER = [3, 0, 1, 2] as const;
const WAVE_LINE_ORDER = [0, 1, 2, 3] as const;
const LAYER_XS = [12, 38, 63, 88] as const;
const LAYER_NAMES = ["input", "hidden 1", "hidden 2", "output"] as const;
const PULSE_PERIOD_S = 2.4;

export interface SquadMember extends Player {
  role: Role;
}

/** Python first, then attack, midfield, defence. */
export function squadOrder(lines: Lines): SquadMember[] {
  return SQUAD_LINE_ORDER.flatMap((li) => (lines[li] ?? []).map((p) => ({ ...p, role: ROLES[li] })));
}

export interface GridSlot extends Player {
  pos: string;
  car: string;
  /** Right-hand column sits further back on the grid. */
  staggered: boolean;
}

export function gridSlots(lines: Lines): GridSlot[] {
  return squadOrder(lines).map((p, i) => ({
    n: p.n,
    name: p.name,
    pos: `P${i + 1}`,
    car: `Car ${p.n}${i === 0 ? " · pole" : ""}`,
    staggered: i % 2 === 1,
  }));
}

export interface Character extends SquadMember {
  initials: string;
  /** The P1 cursor sits on the first character (Python). */
  selected: boolean;
}

export function initials(name: string): string {
  return name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
}

export function characters(lines: Lines): Character[] {
  return squadOrder(lines).map((p, i) => ({ ...p, initials: initials(p.name), selected: i === 0 }));
}

export interface Wave {
  label: string;
  bibs: ReadonlyArray<Player>;
}

export function waves(lines: Lines): Wave[] {
  return WAVE_LINE_ORDER.map((li) => ({ label: WAVE_LABELS[li], bibs: lines[li] ?? [] }));
}

export interface NetNode extends Player {
  /** Percent of the net's width / height. */
  x: number;
  y: number;
}
export interface NetEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Negative CSS delay (s) so the pulses are spread out from the first frame. */
  delay: number;
}
export interface Net {
  captions: ReadonlyArray<{ name: string; x: number }>;
  nodes: NetNode[];
  edges: NetEdge[];
}

/** input (Python) -> hidden 1 (data) -> hidden 2 (models) -> output (what ships), fully connected layer to layer. */
export function network(lines: Lines): Net {
  const layerPlayers = [lines[3], lines[2], lines[1], lines[0]].map((l) => l ?? []);
  const columns: NetNode[][] = layerPlayers.map((ps, li) =>
    ps.map((p, i) => ({ ...p, x: LAYER_XS[li], y: Math.round(((i + 1) / (ps.length + 1)) * 1000) / 10 })),
  );
  const edges: NetEdge[] = columns
    .slice(0, -1)
    .flatMap((col, li) => col.flatMap((a) => columns[li + 1].map((b) => ({ a, b }))))
    .map(({ a, b }, i) => ({
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      delay: -((i * 0.37) % PULSE_PERIOD_S),
    }));
  return {
    captions: LAYER_NAMES.map((name, i) => ({ name, x: LAYER_XS[i] })),
    nodes: columns.flat(),
    edges,
  };
}
