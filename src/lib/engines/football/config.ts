/** Engine tuning. Field is 100 × 50 units, 30 ticks per second. See tasks/portfolio-spec.md §6.5. */
export const CFG = {
  walk: 0.62,
  sprint: 0.95,
  accel: 0.22,
  carry: 2.3,
  pickR: 2.8,
  tackleR: 2.8,
  tackleP: 0.035,
  shotMin: 1.8,
  shotMax: 3.3,
  pass: 2.0,
  fric: 0.965,
  top: 19.5,
  bottom: 30.5,
  keeperY: [20.5, 29.5] as const,
  keeperSpeed: 0.38,
  saveR: 2.9,
  settle: 14,
  keeperHold: 22,
  ticksPerMinute: 30,
  /** Human mode: the CPU is slightly slower and tackles less. */
  cpuSpeedEase: 0.92,
  cpuTackleEase: 0.7,
} as const;

export const TICK_MS = 33;

/** Shot power from how many ticks the shot button was held. */
export function shotPower(charge: number | null): number {
  if (charge === null) return 0.5;
  return Math.max(0.3, Math.min(1, 0.3 + charge / 24));
}
