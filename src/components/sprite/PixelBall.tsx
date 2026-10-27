import type { PropShape } from "@/content/worlds";

export interface PropColors {
  shape?: PropShape;
  /** Main fill. */
  a: string;
  /** Detail. */
  b: string;
  /** Highlight. */
  c: string;
}

const FOOTBALL: PropColors = { shape: "ball", a: "#f3eee2", b: "#120e14", c: "#120e14" };

type Px = readonly [x: number, y: number, w: number, h: number, fill: "a" | "b" | "c"];

/** The round 8×8 silhouette the ball and tyre share. */
const ROUND: readonly Px[] = [
  [2, 0, 4, 8, "a"],
  [0, 2, 8, 4, "a"],
  [1, 1, 6, 6, "a"],
];

const ART: Record<PropShape, readonly Px[]> = {
  ball: [...ROUND, [3, 3, 2, 2, "b"], [1, 1, 1, 1, "c"], [6, 5, 1, 1, "c"]],
  tyre: [
    ...ROUND,
    [2, 1, 4, 1, "b"],
    [2, 6, 4, 1, "b"],
    [1, 2, 1, 4, "b"],
    [6, 2, 1, 4, "b"],
    [3, 3, 2, 2, "c"],
  ],
  coin: [[2, 0, 4, 8, "a"], [1, 1, 6, 6, "a"], [4, 2, 1, 4, "b"], [6, 2, 1, 4, "b"], [2, 2, 1, 3, "c"]],
  bottle: [[3, 0, 2, 1, "b"], [3, 1, 2, 1, "a"], [2, 2, 4, 6, "a"], [2, 4, 4, 2, "b"], [3, 2, 1, 2, "c"], [3, 6, 1, 1, "c"]],
  cube: [[2, 0, 6, 1, "c"], [1, 1, 6, 1, "c"], [0, 2, 6, 6, "a"], [7, 1, 1, 6, "b"], [6, 2, 1, 6, "b"]],
};

/** 8×8 pixel prop: the world's ball / tyre / coin / bottle / cube (the football by default). */
export function PixelBall({ size = 40, colors = FOOTBALL }: { size?: number; colors?: PropColors }) {
  const shape = colors.shape ?? "ball";
  return (
    <svg viewBox="0 0 8 8" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true" data-shape={shape}>
      {ART[shape].map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={colors[fill]} />
      ))}
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" aria-hidden="true" style={{ flex: "none", marginTop: 1 }}>
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

type Arrow = "up" | "down" | "left" | "right";
const ARROW_PATH: Record<Arrow, string> = {
  up: "M6 15l6-6 6 6",
  down: "M6 9l6 6 6-6",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
};

export function ArrowIcon({ dir, size = 16 }: { dir: Arrow; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d={ARROW_PATH[dir]} />
    </svg>
  );
}
