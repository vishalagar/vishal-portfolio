import { describe, expect, it } from "vitest";
import {
  aiDir,
  createSnake,
  GRID_H,
  GRID_W,
  steer,
  stepSnake,
  type SnakeState,
} from "@/lib/engines/snake";
import { constant, seeded } from "@/lib/engines/rng";

describe("snake engine", () => {
  it("starts with a three-cell snake heading right", () => {
    const s = createSnake("ai", 0);
    expect(s.snake).toEqual([
      [5, 5],
      [4, 5],
      [3, 5],
    ]);
    expect(s.dir).toEqual([1, 0]);
    expect(s.score).toBe(0);
  });

  it("moves one cell per step in the current direction", () => {
    const s = stepSnake(createSnake("human", 0), constant(0)).state;
    expect(s.snake[0]).toEqual([6, 5]);
    expect(s.snake).toHaveLength(3);
  });

  it("grows and scores when it eats, then places new food on a free cell", () => {
    const s: SnakeState = { ...createSnake("human", 0), food: [6, 5] };
    const out = stepSnake(s, constant(0));
    expect(out.state.score).toBe(1);
    expect(out.state.snake).toHaveLength(4);
    expect(out.events).toContain("eat");
    const taken = out.state.snake.map(([x, y]) => `${x},${y}`);
    expect(taken).not.toContain(`${out.state.food[0]},${out.state.food[1]}`);
  });

  it("ends a human game on hitting a wall and keeps the best score", () => {
    const s: SnakeState = {
      ...createSnake("human", 3),
      snake: [
        [GRID_W - 1, 2],
        [GRID_W - 2, 2],
        [GRID_W - 3, 2],
      ],
      score: 5,
    };
    const out = stepSnake(s, constant(0));
    expect(out.state.mode).toBe("over");
    expect(out.state.last).toBe(5);
    expect(out.state.best).toBe(5);
    expect(out.events).toContain("over");
    expect(stepSnake(out.state, constant(0)).state).toBe(out.state);
  });

  it("restarts the bot after it crashes instead of showing game over", () => {
    const s: SnakeState = {
      ...createSnake("ai", 0),
      snake: [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      dir: [0, -1],
      score: 4,
    }; // boxed into the corner: every move crashes
    const out = stepSnake(s, constant(0));
    expect(out.state.mode).toBe("ai");
    expect(out.state.best).toBe(4);
    expect(out.state.score).toBe(0);
  });

  it("ignores a steer straight back into the body", () => {
    const s = createSnake("human", 0);
    expect(steer(s, [-1, 0]).queued).toBeNull();
    expect(steer(s, [0, -1]).queued).toEqual([0, -1]);
    expect(steer(createSnake("ai", 0), [0, -1]).queued).toBeNull();
  });

  it("bot never chooses a move that crashes when a safe one exists", () => {
    const s: SnakeState = {
      ...createSnake("ai", 0),
      snake: [
        [GRID_W - 1, 4],
        [GRID_W - 2, 4],
        [GRID_W - 3, 4],
      ],
      dir: [1, 0],
      food: [0, 0],
    };
    const d = aiDir(s);
    expect(d).not.toEqual([1, 0]);
  });

  it("bot plays a decent game: it eats repeatedly before crashing", () => {
    const rng = seeded(5);
    let best = 0;
    let s = createSnake("ai", 0);
    for (let i = 0; i < 6000; i++) {
      s = stepSnake(s, rng).state;
      best = Math.max(best, s.best, s.score);
    }
    expect(best).toBeGreaterThanOrEqual(15);
    expect(
      s.snake.every(([x, y]) => x >= 0 && y >= 0 && x < GRID_W && y < GRID_H),
    ).toBe(true);
  });
});
