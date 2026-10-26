export type Team = "A" | "B";
export type Role = "out" | "gk";
export type Mode = "bot" | "human";

export interface Point {
  x: number;
  y: number;
}

export interface Player extends Point {
  vx: number;
  vy: number;
  /** Facing direction (unit vector). */
  fx: number;
  fy: number;
  team: Team;
  role: Role;
  num: number;
  /** Ticks before this player can touch the ball again. */
  cool: number;
  stamina: number;
  sprinting: boolean;
}

export interface Ball extends Point {
  vx: number;
  vy: number;
  owner: number | null;
  last: Team;
  shotBy: Team | null;
  speed: number;
  intended: number | null;
  /** Keepers that have already tried to save this shot. */
  tried: number[];
  /** Ticks with no tackles after a change of possession. */
  settle: number;
}

export interface Flash {
  text: string;
  t: number;
}

export type Pending =
  | { type: "kickoff"; team: Team }
  | { type: "end" }
  | { type: "set"; team: Team; keeper: true }
  | { type: "set"; team: Team; keeper?: false; x: number; y: number };

export interface MatchState {
  mode: Mode;
  score: Record<Team, number>;
  tick: number;
  over: boolean;
  halfDone: boolean;
  flash: Flash | null;
  players: Player[];
  ball: Ball;
  /** Index of the player the human controls. */
  active: number;
  freeze: number;
  pending: Pending | null;
  /** Ticks a keeper has held the ball. */
  hold: number;
  /** Where each keeper is heading: [team A, team B]. */
  kTarget: [number, number];
}

/** What one player wants to do this tick. */
export interface Intent {
  mx: number;
  my: number;
  sprint: boolean;
  shoot: number | null;
  pass: boolean;
  /** Slow down on arrival instead of running through the target. */
  arrive: boolean;
  aimY?: number;
}

/** The human player's controls for one tick. */
export interface HumanInput {
  mx: number;
  my: number;
  sprint: boolean;
  /** Shot power 0.3–1 when the shot button is released this tick. */
  shoot: number | null;
  pass: boolean;
  tackle: boolean;
}

export type MatchEvent = "kick" | "pass" | "tackle" | "save" | "goal" | "whistle" | "end";

export interface StepResult {
  g: MatchState;
  events: MatchEvent[];
  /** False while the match is frozen for a restart or over. Queued human input is only consumed when true. */
  simulated: boolean;
}
