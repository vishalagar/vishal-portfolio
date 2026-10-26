import type { WorldId } from "@/content/worlds";

/** Costume sprite sheet (5 frames wide). Football is the base sprite. */
export function sheetUrl(id: WorldId): string {
  return id === "football" ? "/sprite/vishal-sheet.png" : `/sprite/vishal_${id}_sheet_8x.png`;
}
