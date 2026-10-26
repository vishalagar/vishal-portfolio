"""Costume-off strips: Vishal takes the world's headgear off and changes back into his own shirt.

For each world, splits the costume (open-eyes frame) from the base bust:
  headgear = costume pixels above the collar (row 44), lifted up and off the top
  outfit   = costume pixels from row 44 down, swapped back to the elephant shirt row by row
Frame 0 = full costume, frame 7 = the plain football bust, so the site can drive it from scroll.
Writes worlds/vishal_<world>_unmask_8x.png (8 frames, 3072x448) and worlds/unmask_preview.png.
"""
from PIL import Image

from generate_worlds import H, W, WORLDS, VISOR, grid, put, to_image

SCALE = 8
COLLAR = 44
LIFT = [0, 2, 5, 10, 17, 26, 40, None]   # headgear offset per frame, None = gone
OUTFIT = [0, 0, 0, 0.25, 0.5, 0.75, 1, 1]  # share of the outfit rows already changed back


def layers(world):
    base = grid("open")
    costume = WORLDS[world]("open")
    head, body = {}, {}
    for y in range(H):
        for x in range(W):
            if costume[y][x] != base[y][x]:
                (head if y < COLLAR else body)[(x, y)] = costume[y][x]
    if world == "gp":
        # the visor opening shows the face while worn; once lifted it's tinted glass
        y0, y1, x0, x1 = VISOR
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                head[(x, y)] = "7" if y < y0 + 2 else "6"
    return base, head, body


def frame(world, i):
    if LIFT[i] == 0 and OUTFIT[i] == 0:
        return WORLDS[world]("open")
    base, head, body = layers(world)
    rows = [r[:] for r in base]
    changed_until = COLLAR + round(OUTFIT[i] * (H - COLLAR))
    for (x, y), c in body.items():
        if y >= changed_until:
            rows[y][x] = c
    if LIFT[i] is not None:
        for (x, y), c in head.items():
            put(rows, x, y - LIFT[i], c)
    return rows


def main():
    previews = []
    for world in WORLDS:
        frames = [to_image(frame(world, i)) for i in range(len(LIFT))]
        sheet = Image.new("RGBA", (W * len(frames), H), (0, 0, 0, 0))
        for i, im in enumerate(frames):
            sheet.paste(im, (i * W, 0))
        sheet.resize((sheet.width * SCALE, sheet.height * SCALE), Image.NEAREST).save(f"worlds/vishal_{world}_unmask_8x.png")
        previews.append(sheet)
    prev = Image.new("RGBA", (W * len(LIFT), H * len(previews)), (40, 40, 40, 255))
    for i, s in enumerate(previews):
        prev.paste(s, (0, i * H), s)
    prev.resize((prev.width * 3, prev.height * 3), Image.NEAREST).save("worlds/unmask_preview.png")
    print("wrote", ", ".join(f"worlds/vishal_{w}_unmask_8x.png" for w in WORLDS))


if __name__ == "__main__":
    main()
