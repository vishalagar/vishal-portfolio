export interface PropColors {
  a: string;
  b: string;
  c: string;
}

const FOOTBALL: PropColors = { a: "#f3eee2", b: "#120e14", c: "#120e14" };

/** 8×8 pixel prop: the football by default, or any world's ball / tyre / coin / bottle / cube via `colors`. */
export function PixelBall({ size = 40, colors = FOOTBALL }: { size?: number; colors?: PropColors }) {
  return (
    <svg viewBox="0 0 8 8" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      <rect x="2" y="0" width="4" height="8" fill={colors.a} />
      <rect x="0" y="2" width="8" height="4" fill={colors.a} />
      <rect x="1" y="1" width="6" height="6" fill={colors.a} />
      <rect x="3" y="3" width="2" height="2" fill={colors.b} />
      <rect x="1" y="1" width="1" height="1" fill={colors.c} />
      <rect x="6" y="5" width="1" height="1" fill={colors.c} />
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
