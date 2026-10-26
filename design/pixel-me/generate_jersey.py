"""Pixel-art back of Vishal's MIT Hockey shirt: blue speckle, gold VISHAL 4.

Writes jersey_8x.png (transparent, 8x nearest-neighbour) for the site.
"""
import random
from PIL import Image

W, H, SCALE = 40, 46, 8
BLUE, LIGHT, DARK = (33, 72, 180), (64, 104, 214), (22, 52, 140)
OUTLINE, CUFF, GOLD, GOLD_SHADE = (14, 16, 30), (17, 17, 20), (233, 210, 124), (176, 150, 70)

POLY = [(14, 2), (26, 2), (33, 5), (39.5, 15), (33.5, 19.5), (32, 14), (32, 45), (8, 45),
        (8, 14), (6.5, 19.5), (0.5, 15), (7, 5)]

GLYPHS = {
    "V": ["101", "101", "101", "010", "010"], "I": ["111", "010", "010", "010", "111"],
    "S": ["111", "100", "111", "001", "111"], "H": ["101", "101", "111", "101", "101"],
    "A": ["010", "101", "111", "101", "101"], "L": ["100", "100", "100", "100", "111"],
}
FOUR = ["....11.", "...111.", "..1.11.", ".1..11.", "1...11.", "1111111", "1111111",
        "....11.", "....11.", "....11.", "....11."]


def inside(px, py):
    hit = False
    for (x1, y1), (x2, y2) in zip(POLY, POLY[1:] + POLY[:1]):
        if (y1 > py) != (y2 > py) and px < (x2 - x1) * (py - y1) / (y2 - y1) + x1:
            hit = not hit
    return hit


def near_segment(px, py, a, b, r):
    (ax, ay), (bx, by) = a, b
    dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2 <= r * r


random.seed(4)
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
px = img.load()
for y in range(H):
    for x in range(W):
        cx, cy = x + 0.5, y + 0.5
        if not inside(cx, cy):
            continue
        roll = random.random()
        col = LIGHT if roll < 0.14 else DARK if roll < 0.24 else BLUE
        if near_segment(cx, cy, (0.5, 15), (6.5, 19.5), 1.6) or near_segment(cx, cy, (39.5, 15), (33.5, 19.5), 1.6):
            col = CUFF
        if y <= 3 and 14 <= x <= 25:
            col = CUFF
        px[x, y] = col + (255,)

# outline
filled = {(x, y) for y in range(H) for x in range(W) if px[x, y][3]}
for y in range(H):
    for x in range(W):
        if (x, y) not in filled and any((x + dx, y + dy) in filled for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            px[x, y] = OUTLINE + (255,)


def stamp(rows, x0, y0, shade=True):
    for dy, row in enumerate(rows):
        for dx, ch in enumerate(row):
            if ch == "1":
                if shade:
                    px[x0 + dx + 1, y0 + dy + 1] = GOLD_SHADE + (255,)
                px[x0 + dx, y0 + dy] = GOLD + (255,)


name = "VISHAL"
x = 8 + (24 - (len(name) * 4 - 1)) // 2
for ch in name:
    stamp(GLYPHS[ch], x, 11, shade=False)
    x += 4
stamp(FOUR, 16, 20)

img.resize((W * SCALE, H * SCALE), Image.NEAREST).save("jersey_8x.png")
preview = Image.new("RGBA", (W * SCALE + 40, H * SCALE + 40), (14, 60, 34, 255))
preview.alpha_composite(img.resize((W * SCALE, H * SCALE), Image.NEAREST), (20, 20))
preview.save("jersey_preview.png")
print("jersey", img.size)
