"""Pixel-art shirts for the kit room: four kits, front and back, all No. 4.

Writes kits/<kit>_<side>_8x.png (transparent) and kits_preview.png.
"""
import os
import random
from PIL import Image

W, H, SCALE = 48, 60, 8
OUT = "kits"
POLY = [(16.8, 2.4), (31.2, 2.4), (39.6, 6), (47.4, 18), (40.2, 23.4), (38.4, 16.8), (38.4, 58),
        (9.6, 58), (9.6, 16.8), (7.8, 23.4), (0.6, 18), (8.4, 6)]
CUFFS = [((0.6, 18), (7.8, 23.4)), ((47.4, 18), (40.2, 23.4))]
OUTLINE = (14, 16, 30)

FONT = {
    "V": ["101", "101", "101", "010", "010"], "I": ["111", "010", "010", "010", "111"],
    "S": ["111", "100", "111", "001", "111"], "H": ["101", "101", "111", "101", "101"],
    "A": ["010", "101", "111", "101", "101"], "L": ["100", "100", "100", "100", "111"],
    "M": ["101", "111", "111", "101", "101"], "T": ["111", "010", "010", "010", "010"],
    "N": ["110", "101", "101", "101", "101"], "P": ["110", "101", "110", "100", "100"],
    "O": ["010", "101", "101", "101", "010"], "C": ["011", "100", "100", "100", "011"],
    "K": ["101", "101", "110", "101", "101"], "E": ["111", "100", "110", "100", "111"],
    "Y": ["101", "101", "010", "010", "010"],
}
FOUR = ["....11.", "...111.", "..1.11.", ".1..11.", "1...11.", "1111111", "1111111",
        "....11.", "....11.", "....11.", "....11."]


def inside(px, py):
    hit = False
    for (x1, y1), (x2, y2) in zip(POLY, POLY[1:] + POLY[:1]):
        if (y1 > py) != (y2 > py) and px < (x2 - x1) * (py - y1) / (y2 - y1) + x1:
            hit = not hit
    return hit


def near(px, py, a, b, r):
    (ax, ay), (bx, by) = a, b
    dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2 <= r * r


class Shirt:
    def __init__(self):
        self.img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        self.px = self.img.load()
        self.cells = [(x, y) for y in range(H) for x in range(W) if inside(x + 0.5, y + 0.5)]

    def fill(self, colour_at):
        for x, y in self.cells:
            self.px[x, y] = colour_at(x, y) + (255,)

    def put(self, x, y, c):
        if (x, y) in set(self.cells) or self.px[x, y][3]:
            self.px[x, y] = c + (255,)

    def text(self, s, y, colour, scale=1, cx=24):
        width = (len(s) * 4 - 1) * scale
        x = cx - width // 2
        for ch in s:
            for dy, row in enumerate(FONT[ch]):
                for dx, bit in enumerate(row):
                    if bit == "1":
                        for sy in range(scale):
                            for sx in range(scale):
                                self.put(x + dx * scale + sx, y + dy * scale + sy, colour)
            x += 4 * scale

    def number(self, y, colour, shade=None, scale=2, cx=24):
        x0 = cx - (7 * scale) // 2
        for dy, row in enumerate(FOUR):
            for dx, bit in enumerate(row):
                if bit == "1":
                    for sy in range(scale):
                        for sx in range(scale):
                            if shade:
                                self.put(x0 + dx * scale + sx + 1, y + dy * scale + sy + 1, shade)
                            self.put(x0 + dx * scale + sx, y + dy * scale + sy, colour)

    def line(self, a, b, colour, inside_only=True):
        (x0, y0), (x1, y1) = a, b
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            x = round(x0 + (x1 - x0) * i / n)
            y = round(y0 + (y1 - y0) * i / n)
            if 0 <= x < W and 0 <= y < H and (not inside_only or self.px[x, y][3]):
                self.px[x, y] = colour + (255,)

    def cuffs(self, colour):
        for x, y in self.cells:
            if any(near(x + 0.5, y + 0.5, a, b, 1.8) for a, b in CUFFS):
                self.px[x, y] = colour + (255,)

    def collar_back(self, colour):
        for x, y in self.cells:
            if y <= 4 and 17 <= x <= 30:
                self.px[x, y] = colour + (255,)

    def collar_front(self, colour, inner):
        for x, y in self.cells:
            d = ((x + 0.5 - 24) / 6.5) ** 2 + ((y + 0.5 - 2) / 5) ** 2
            if d <= 0.62:
                self.px[x, y] = inner + (255,)
            elif d <= 1:
                self.px[x, y] = colour + (255,)

    def crest(self, x, y, colour, dark):
        for dx, dy in [(1, 0), (0, 1), (1, 1), (2, 1), (0, 2), (1, 2), (2, 2), (1, 3)]:
            self.put(x + dx, y + dy, colour)
        self.put(x + 1, y + 1, dark)

    def finish(self, name):
        filled = {(x, y) for y in range(H) for x in range(W) if self.px[x, y][3]}
        for y in range(H):
            for x in range(W):
                if (x, y) not in filled and any((x + dx, y + dy) in filled for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    self.px[x, y] = OUTLINE + (255,)
        self.img.resize((W * SCALE, H * SCALE), Image.NEAREST).save(os.path.join(OUT, name + "_8x.png"))
        return self.img


def speckle(base, light, dark, seed, light_p=0.14, dark_p=0.10):
    rnd = random.Random(seed)
    table = {}

    def colour(x, y):
        if (x, y) not in table:
            r = rnd.random()
            table[(x, y)] = light if r < light_p else dark if r < light_p + dark_p else base
        return table[(x, y)]
    return colour


def shoulder_stripes(s, colour):
    for side in (-1, 1):
        for k in range(3):
            off = 2.2 + k * 2.2
            a = (24 + side * (7.2 - off * 0.2), 2.4 + off * 0.9)
            b = (24 + side * (23.4 - off * 0.7), 18 + off * 0.7)
            s.line(a, b, colour)


GOLD, GOLD_SHADE = (233, 210, 124), (176, 150, 70)
BLACK = (20, 20, 24)


def blue(side):
    s = Shirt()
    s.fill(speckle((33, 72, 180), (64, 104, 214), (22, 52, 140), 4))
    s.cuffs(BLACK)
    if side == "back":
        s.collar_back(BLACK)
        s.text("VISHAL", 12, GOLD)
        s.number(21, GOLD, GOLD_SHADE)
    else:
        s.collar_front(BLACK, (18, 40, 110))
        shoulder_stripes(s, GOLD)
        s.crest(30, 12, GOLD, (180, 90, 40))
        s.text("MIT", 22, GOLD, scale=2)
        s.text("HOCKEY", 35, GOLD)
    return s


def grey(side):
    s = Shirt()
    base = speckle((196, 198, 202), (214, 216, 220), (176, 178, 184), 9, 0.10, 0.08)
    s.fill(lambda x, y: BLACK if (x < 10 or x > 37) or (x in (10, 37) and y > 27) else base(x, y))
    if side == "back":
        s.collar_back(BLACK)
        s.text("MIT", 7, BLACK, scale=2)
        s.text("MANIPAL", 19, BLACK)
        s.number(27, BLACK)
        s.text("VISHAL", 51, BLACK)
    else:
        s.collar_front(BLACK, (120, 122, 128))
        s.crest(30, 12, (210, 90, 40), (120, 40, 20))
    return s


def purple(side):
    s = Shirt()
    PURPLE, WHITE = (124, 62, 212), (244, 242, 248)
    if side == "back":
        s.fill(lambda x, y: WHITE if x in (11, 36) and y > 18 else PURPLE)
        s.collar_back(PURPLE)
        s.text("MIT", 9, WHITE)
        s.text("MANIPAL", 15, WHITE)
        s.number(23, WHITE)
    else:
        band = lambda x, y: (x - 8) * 0.9 - 7 < y < (x - 8) * 0.9 + 9
        s.fill(lambda x, y: WHITE if band(x, y) else PURPLE)
        s.collar_front(PURPLE, (80, 40, 140))
        s.crest(32, 11, (234, 110, 40), (150, 60, 20))
    return s


def black(side):
    s = Shirt()
    YEL, YEL_DIM = (236, 222, 74), (112, 106, 34)
    s.fill(lambda x, y: (24, 24, 22))
    rnd = random.Random(23)
    for _ in range(10):
        a = (rnd.uniform(0, W), rnd.uniform(0, H))
        b = (rnd.uniform(0, W), rnd.uniform(0, H))
        s.line(a, b, YEL_DIM)
    s.cuffs((24, 24, 22))
    if side == "back":
        s.collar_back((24, 24, 22))
        s.text("VISHAL", 12, YEL)
        s.number(21, YEL, (110, 100, 30))
    else:
        s.collar_front((24, 24, 22), (12, 12, 12))
        s.crest(30, 11, YEL, (24, 24, 22))
        s.crest(15, 11, YEL, (24, 24, 22))
        s.text("MIT", 22, YEL, scale=2)
        s.text("HOCKEY", 35, YEL)
    return s


os.makedirs(OUT, exist_ok=True)
KITS = {"blue": blue, "grey": grey, "purple": purple, "black": black}
tiles = []
for name, make in KITS.items():
    for side in ("back", "front"):
        tiles.append(make(side).finish(f"{name}_{side}"))
sheet = Image.new("RGBA", (len(tiles) * (W * 4 + 12), H * 4 + 24), (14, 60, 34, 255))
for i, t in enumerate(tiles):
    sheet.alpha_composite(t.resize((W * 4, H * 4), Image.NEAREST), (i * (W * 4 + 12) + 6, 12))
sheet.save("kits_preview.png")
print("kits:", ", ".join(sorted(os.listdir(OUT))))
