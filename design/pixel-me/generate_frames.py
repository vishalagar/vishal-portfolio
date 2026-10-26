"""Build eye-animation frames for the approved pixel bust.

Reads vishal_bust.json (approved v1), repaints only the eye pixels inside the
glasses, and writes:
  vishal_frames.json   palette + rows for each frame
  vishal_sheet_8x.png  frames side by side, 8x nearest-neighbour (for the site)
  frames_preview.png   quick visual check
Frame order: open, look-left, look-right, half, closed.
"""
import json
from PIL import Image

SCALE = 8
FRAMES = ["open", "left", "right", "half", "closed"]
EYE_COLS = (19, 28)          # left-most column of each 4px-wide eye
EYE_PALETTE = {"O": "#d8c6b1", "I": "#3b2418"}
FACE_CX = 24

base = json.load(open("vishal_bust.json"))
palette = {**base["palette"], **EYE_PALETTE}
base_rows = [list(r) for r in base["rows"]]


def skin_at(x, y):
    if x + 0.5 > FACE_CX + 6:
        return "s"
    if x + 0.5 < FACE_CX - 5 and 29 <= y <= 35:
        return "L"
    return "S"


def eye_pixels(frame):
    """Rows 28-30 for one 4px eye, as {(dx, dy): colour}."""
    lid = {(dx, 0): "E" for dx in range(4)}
    shapes = {
        "open": {**lid, (0, 1): "O", (1, 1): "g", (2, 1): "I", (3, 1): "O",
                 (0, 2): "O", (1, 2): "I", (2, 2): "I", (3, 2): "O"},
        "left": {**lid, (0, 1): "g", (1, 1): "I", (2, 1): "O", (3, 1): "O",
                 (0, 2): "I", (1, 2): "I", (2, 2): "O", (3, 2): "O"},
        "right": {**lid, (0, 1): "O", (1, 1): "O", (2, 1): "g", (3, 1): "I",
                  (0, 2): "O", (1, 2): "O", (2, 2): "I", (3, 2): "I"},
        "half": {**{(dx, 0): "d" for dx in range(4)}, **{(dx, 1): "E" for dx in range(4)},
                 (0, 2): "O", (1, 2): "I", (2, 2): "I", (3, 2): "O"},
        "closed": {**{(dx, 1): "d" for dx in range(4)}, **{(dx, 2): "E" for dx in range(4)}},
    }
    return shapes[frame]


def build(frame):
    rows = [r[:] for r in base_rows]
    for c0 in EYE_COLS:
        # clear the old eye area back to skin, keeping glasses, glints and brows
        for y in range(27, 32):
            for x in range(c0 - 2, c0 + 6):
                if rows[y][x] not in ("G", "g", "b", "K"):
                    rows[y][x] = skin_at(x, y)
        for (dx, dy), col in eye_pixels(frame).items():
            rows[28 + dy][c0 + dx] = col
    return ["".join(r) for r in rows]


def to_image(rows):
    w, h = len(rows[0]), len(rows)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != ".":
                px[x, y] = tuple(int(palette[ch][i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    return img


frames = {name: build(name) for name in FRAMES}
json.dump({"palette": palette, "order": FRAMES, "frames": frames}, open("vishal_frames.json", "w"), indent=1)

imgs = [to_image(frames[n]) for n in FRAMES]
w, h = imgs[0].size
sheet = Image.new("RGBA", (w * len(imgs), h), (0, 0, 0, 0))
for i, im in enumerate(imgs):
    sheet.paste(im, (i * w, 0))
sheet.resize((sheet.width * SCALE, sheet.height * SCALE), Image.NEAREST).save("vishal_sheet_8x.png")

# preview: face crop at 10x on pitch green
crop = [im.crop((10, 14, 38, 42)).resize((280, 280), Image.NEAREST) for im in imgs]
prev = Image.new("RGBA", (len(crop) * 290, 280), (14, 60, 34, 255))
for i, im in enumerate(crop):
    prev.alpha_composite(im, (i * 290, 0))
prev.save("frames_preview.png")
print("frames:", FRAMES, "sheet:", sheet.size)
