import type { Rng } from "./rng";

export const GRID_W = 16;
export const GRID_H = 10;
export const SNAKE_TICK_MS = 140;

export type Cell = readonly [number, number];
export type SnakeMode = "ai" | "human" | "over";
export type SnakeEvent = "eat" | "over";

export interface SnakeState {
  snake: Cell[];
  dir: Cell;
  food: Cell;
  score: number;
  mode: SnakeMode;
  best: number;
  queued: Cell | null;
  last: number;
}

export function createSnake(mode: "ai" | "human", best: number): SnakeState {
  return { snake: [[5, 5], [4, 5], [3, 5]], dir: [1, 0], food: [11, 4], score: 0, mode, best, queued: null, last: 0 };
}

function hit(x: number, y: number, body: readonly Cell[]): boolean {
  if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return true;
  return body.some(([a, b]) => a === x && b === y);
}

/** Flood fill from `start`, capped at 60 cells: how much room the snake would have. */
function room(start: Cell, body: readonly Cell[]): number {
  const blocked = new Set(body.map(([x, y]) => `${x},${y}`));
  const seen = new Set([`${start[0]},${start[1]}`]);
  const queue: Cell[] = [start];
  let n = 0;
  while (queue.length && n < 60) {
    const [x, y] = queue.shift() as Cell;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H || blocked.has(key) || seen.has(key)) continue;
      seen.add(key);
      queue.push([nx, ny]);
      n++;
    }
  }
  return n;
}

/**
 * Heuristic stand-in for the DQN: try straight, left and right; drop crashes;
 * avoid moves that leave too little room; then head for the food, slightly preferring straight.
 */
export function aiDir(st: SnakeState): Cell {
  const [dx, dy] = st.dir;
  const options: Cell[] = [[dx, dy], [dy, -dx], [-dy, dx]];
  let best: Cell | null = null;
  let bestScore = -Infinity;
  options.forEach((d, i) => {
    const h: Cell = [st.snake[0][0] + d[0], st.snake[0][1] + d[1]];
    const eat = h[0] === st.food[0] && h[1] === st.food[1];
    const body = eat ? st.snake : st.snake.slice(0, -1);
    if (hit(h[0], h[1], body)) return;
    let s = -(Math.abs(h[0] - st.food[0]) + Math.abs(h[1] - st.food[1]));
    if (room(h, [h, ...body]) < st.snake.length + 2) s -= 100;
    if (i === 0) s += 0.3;
    if (s > bestScore) {
      bestScore = s;
      best = d;
    }
  });
  return best ?? st.dir;
}

function freeCell(snake: readonly Cell[], rng: Rng): Cell {
  const taken = new Set(snake.map(([x, y]) => `${x},${y}`));
  const free: Cell[] = [];
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (!taken.has(`${x},${y}`)) free.push([x, y]);
    }
  }
  return free[Math.floor(rng() * free.length)] ?? [0, 0];
}

export function stepSnake(st: SnakeState, rng: Rng): { state: SnakeState; events: SnakeEvent[] } {
  if (st.mode === "over") return { state: st, events: [] };
  const dir = st.mode === "ai" ? aiDir(st) : (st.queued ?? st.dir);
  const head: Cell = [st.snake[0][0] + dir[0], st.snake[0][1] + dir[1]];
  const eat = head[0] === st.food[0] && head[1] === st.food[1];
  const body = eat ? st.snake : st.snake.slice(0, -1);
  if (hit(head[0], head[1], body)) {
    const best = Math.max(st.best, st.score);
    if (st.mode === "ai") return { state: createSnake("ai", best), events: [] };
    return { state: { ...st, mode: "over", last: st.score, best }, events: ["over"] };
  }
  const snake = [head, ...body];
  return {
    state: {
      ...st,
      snake,
      dir,
      food: eat ? freeCell(snake, rng) : st.food,
      score: eat ? st.score + 1 : st.score,
      queued: null,
    },
    events: eat ? ["eat"] : [],
  };
}

/** Queue a turn for the human player. Reversing into the body is ignored. */
export function steer(st: SnakeState, d: Cell): SnakeState {
  if (st.mode !== "human") return st;
  const cur = st.queued ?? st.dir;
  if (cur[0] === -d[0] && cur[1] === -d[1]) return st;
  return { ...st, queued: d };
}
