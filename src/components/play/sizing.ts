/** Play-mode layout maths (worlds-spec §8, mock `boxW` / `boxH` / `gameH`). */

/** Phones and small touch tablets get the handheld split; laptops get the theatre. */
export const PHONE_QUERY = "(max-width: 699px), (max-width: 999px) and (pointer: coarse)";

export function isPhoneLayout(width: number, coarse: boolean): boolean {
  return width < 700 || (width < 1000 && coarse);
}

/** The theatre box never grows past the page's own content width. */
export const THEATRE_MAX_W = 1280;
/** The game box has a 2 px border on every side. */
export const BOX_BORDER = 2;

export interface Box {
  w: number;
  h: number;
  /** CSS height handed to the game (inside the border). */
  gameH: string;
}

/**
 * The biggest box of the game's aspect (width / height) that fits the space, in whole pixels.
 * Returns null until there is room for a playable game.
 */
export function fitBox(availW: number, availH: number, aspect: number, maxW = THEATRE_MAX_W): Box | null {
  if (!(aspect > 0) || !(availW > 0) || !(availH > 0)) return null;
  const w = Math.floor(Math.min(availW, maxW, availH * aspect));
  const h = Math.floor(w / aspect);
  const inner = h - BOX_BORDER * 2;
  if (w < 40 || inner < 40) return null;
  return { w, h, gameH: `${inner}px` };
}
