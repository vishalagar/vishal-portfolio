"""48x56 pixel-art bust of Vishal (v2)."""
import math, json, random
from PIL import Image

W, H = 48, 56
PAL = {
    "K": "#120e14", "H": "#17131a", "h": "#3a2d33", "r": "#6e4c3a",
    "S": "#c98a5c", "s": "#a3653f", "L": "#e6ab78", "d": "#8a5234",
    "G": "#1b1718", "g": "#fff3dc", "E": "#24140e", "b": "#24160f",
    "M": "#6a2d26", "m": "#a85c4a", "T": "#ac7550",
    "W": "#f3eee2", "w": "#d3cab4", "U": "#7697bf", "u": "#4c6b96", "N": "#5a3820",
}
g = [[None] * W for _ in range(H)]
def put(x, y, c):
    if 0 <= x < W and 0 <= y < H: g[y][x] = c
def get(x, y): return g[y][x] if 0 <= x < W and 0 <= y < H else None
def ell(cx, cy, rx, ry):
    return {(x, y) for y in range(H) for x in range(W)
            if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1}
def ring(cx, cy, rx, ry):
    e = ell(cx, cy, rx, ry)
    return {(x, y) for x, y in e if any((x + dx, y + dy) not in e for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)))}

CX = 24
# shirt
for y in range(45, H):
    half = 8 + (y - 45) * 2.4
    for x in range(int(CX - half), int(CX + half) + 1): put(x, y, "W")
for y in range(45, H):
    for x in range(W):
        if get(x, y) == "W" and x > CX + 5 + (y - 45) * 1.9: put(x, y, "w")
motif = ["uU.", "UUU", "U.U"]
for row, y0 in enumerate(range(47, H, 4)):
    for x0 in range(row % 2 * 3, W, 6):
        if abs(x0 + 1 - CX) < 6: continue
        for dy, line in enumerate(motif):
            for dx, ch in enumerate(line):
                if ch != "." and get(x0 + dx, y0 + dy) in ("W", "w"): put(x0 + dx, y0 + dy, ch)
# neck
for y in range(38, 47):
    for x in range(CX - 4, CX + 4): put(x, y, "d" if y < 41 else ("s" if x > CX else "S"))
# open collar V
for i in range(7):
    for x in range(CX - 4 + i, CX + 4 - i): put(x, 45 + i, "S")
    put(CX - 5 + i, 45 + i, "w"); put(CX - 6 + i, 45 + i, "K")
    put(CX + 4 - i, 45 + i, "w"); put(CX + 5 - i, 45 + i, "K")
for y in range(52, H): put(CX, y, "w")
put(CX - 1, 54, "N")
# ears
for p in ell(13.6, 30.5, 2.0, 3.0): put(*p, "S")
for p in ell(34.4, 30.5, 2.0, 3.0): put(*p, "s")
put(13, 30, "d"); put(13, 31, "d"); put(35, 30, "d"); put(35, 31, "d")
# face
FCX, FCY = 24, 28.5
face = ell(FCX, FCY, 10.2, 12.6)
face = {(x, y) for x, y in face if not (y > 33 and abs(x + .5 - FCX) > 10.2 - (y - 33) * 1.15)}
for x, y in face:
    c = "S"
    if x + .5 > FCX + 6: c = "s"
    elif x + .5 < FCX - 5 and 29 <= y <= 35: c = "L"
    put(x, y, c)
random.seed(11)
for x, y in face:  # light stubble on jaw/chin
    if y >= 38 and random.random() < .3: put(x, y, "T")
# hair: compact curly mass
random.seed(5)
hair = ell(24, 17.5, 13.8, 9.2)
curls = []
for i in range(22):
    a = math.pi + i / 21 * math.pi
    curls.append((24 + 13.6 * math.cos(a) + random.uniform(-.6, .6),
                  17.5 + 9.0 * math.sin(a) + random.uniform(-.6, .6), random.uniform(2.0, 2.6)))
curls += [(11.2, 21.5, 2.4), (11.5, 25.2, 2.1), (36.8, 21.5, 2.4), (36.3, 25.2, 2.0),
          (15.5, 21.0, 2.3), (20.0, 21.6, 2.0), (25.0, 21.2, 2.2), (29.8, 21.4, 2.0), (33.0, 20.8, 2.2),
          (22.4, 23.2, 1.3)]  # one curl dropping on the forehead
for cx, cy, r in curls: hair |= ell(cx, cy, r, r)
for p in hair: put(*p, "H")
# curl texture: little open loops on a jittered grid
random.seed(2)
loop = [(-1, 0), (-1, -1), (0, -1), (1, -1), (1, 0)]
centers = [(cx, cy) for cx, cy, _ in curls]
for gy in range(9, 26, 3):
    for gx in range(10, 39, 3):
        centers.append((gx + random.uniform(-1, 1) + (gy % 2), gy + random.uniform(-.8, .8)))
for cx, cy in centers:
    cx, cy = round(cx), round(cy)
    if (cx, cy) not in hair: continue
    lit = cx < 21 and cy > 12  # warm sunlight from the left
    for dx, dy in loop:
        if (cx + dx, cy + dy) in hair and random.random() < .85:
            put(cx + dx, cy + dy, "r" if lit and random.random() < .5 else "h")
# outline
filled = [[g[y][x] is not None for x in range(W)] for y in range(H)]
for y in range(H):
    for x in range(W):
        if not filled[y][x] and any(0 <= x + dx < W and 0 <= y + dy < H and filled[y + dy][x + dx]
                                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            g[y][x] = "K"
# brows (thick, slightly arched)
for bx in (17, 26):
    for dx in range(6): put(bx + dx, 25 if 1 <= dx <= 3 else 26, "b")
    for dx in range(1, 5): put(bx + dx, 26, "b")
# eyes looking down: curved upper lid + lash
for ex in (19, 28):
    for dx in (0, 1, 2): put(ex + dx, 30, "E")
    put(ex - 1, 29, "E"); put(ex + 3, 29, "E")
    put(ex, 29, "d"); put(ex + 1, 29, "d"); put(ex + 2, 29, "d")
# thin round wire glasses
for ex in (20.5, 29.5):
    for p in ring(ex, 29.5, 4.0, 3.4): put(*p, "G")
put(18, 27, "g"); put(17, 28, "g"); put(27, 27, "g")
put(24, 28, "G"); put(25, 28, "G")
for x in (13, 14, 15): put(x, 28, "G")
for x in (34, 35): put(x, 28, "G")
# nose
put(24, 32, "s"); put(25, 33, "s"); put(23, 34, "d"); put(24, 34, "L"); put(26, 34, "d"); put(25, 34, "s")
# soft lopsided smile
for x in range(21, 28): put(x, 36, "M")
put(20, 35, "M"); put(28, 35, "M"); put(29, 34, "M")
for x in range(22, 27): put(x, 37, "m")
put(23, 38, "s"); put(24, 38, "s"); put(25, 38, "s")
rows = ["".join(c or "." for c in r) for r in g]
json.dump({"palette": PAL, "rows": rows}, open("vishal_bust.json", "w"), indent=1)
def render(scale, bg):
    img = Image.new("RGBA", (W * scale, H * scale), bg); px = img.load()
    for y in range(H):
        for x in range(W):
            c = g[y][x]
            if c:
                col = tuple(int(PAL[c][i:i + 2], 16) for i in (1, 3, 5)) + (255,)
                for yy in range(scale):
                    for xx in range(scale): px[x * scale + xx, y * scale + yy] = col
    return img
big = render(10, (14, 60, 34, 255)); small = render(3, (14, 60, 34, 255))
sheet = Image.new("RGBA", (big.width + small.width + 30, big.height), (14, 60, 34, 255))
sheet.paste(big, (0, 0)); sheet.paste(small, (big.width + 15, 15)); sheet.save("preview3.png")
