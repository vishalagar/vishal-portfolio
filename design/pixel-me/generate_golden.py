"""Golden Hour world: Vishal's costume, pixel Cookie and the small game sprites.

  vishal  floppy golden dog-ear headband + orange NGO volunteer lanyard over a dark tee
          (painted over every eye frame of vishal_frames.json, so blinks keep working)
  cookie  front bust of Cookie (golden, liver nose, red tilak), frames: open, closed
  small   side-view sprites for the companion and the Street Rescue game
Writes worlds/vishal_golden_sheet_8x.png, worlds/cookie_bust_8x.png,
worlds/golden_small.json and worlds/golden_preview.png.
"""
import json
import math
import os
from PIL import Image

SCALE = 8
src = json.load(open("vishal_frames.json"))
ORDER = src["order"]
W, H = 48, 56
SHIRT = set("WwUuN")

GOLD = {
    "1": "#e0a54e",  # gold
    "2": "#b97a2f",  # gold shade
    "3": "#f3cf8a",  # gold light
    "4": "#f9ead0",  # cream
    "5": "#8a5524",  # deep
    "6": "#ff8a2a",  # lanyard orange
    "7": "#c4621a",  # lanyard shade
    "8": "#fbf6ea",  # card white
    "9": "#2a2523",  # tee
    "0": "#3a3431",  # tee light
    "n": "#6b3a3a",  # liver nose
    "e": "#3a1d10",  # eye
    "a": "#c99a3a",  # amber iris
    "t": "#d2332b",  # tilak red
    "p": "#e9a4a0",  # tongue / inner ear pink
}
PAL = {**src["palette"], **GOLD}


def grid(frame):
    return [list(r) for r in src["frames"][frame]]


def blank(w=W, h=H):
    return [["."] * w for _ in range(h)]


def put(rows, x, y, c):
    if 0 <= y < len(rows) and 0 <= x < len(rows[0]):
        rows[y][x] = c


def outline(rows, ink="K"):
    """1px dark outline around every painted pixel (matches the base sprite)."""
    h, w = len(rows), len(rows[0])
    out = [r[:] for r in rows]
    for y in range(h):
        for x in range(w):
            if rows[y][x] != ".":
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and rows[ny][nx] not in (".", ink):
                    out[y][x] = ink
                    break
    return out


# ---------- Vishal: dog-ear headband + volunteer lanyard ----------
def ear(rows, cx, flip):
    """A floppy ear hanging from the headband, wider at the bottom."""
    for y in range(9, 32):
        t = (y - 9) / 22
        half = 1.0 + 3.2 * math.sin(t * math.pi) ** 0.7
        sway = (1.5 + 2.5 * t) * (-1 if flip else 1)
        x0, x1 = round(cx + sway - half), round(cx + sway + half)
        for x in range(x0, x1 + 1):
            edge = x in (x0, x1) or y in (9, 31)
            inner = not edge and abs(x - (cx + sway)) < half - 1.6 and 13 < y < 29
            put(rows, x, y, "K" if edge else ("2" if inner else ("3" if y < 13 else "1")))


def vishal(frame):
    rows = grid(frame)
    for x in range(11, 37):
        dy = int(round(((x - 24) / 13) ** 2 * 5))
        put(rows, x, 5 + dy, "K")
        put(rows, x, 6 + dy, "3" if x < 24 else "1")
        put(rows, x, 7 + dy, "K")
    ear(rows, 10, True)
    ear(rows, 38, False)
    for y in range(44, H):
        for x in range(W):
            if rows[y][x] in SHIRT:
                put(rows, x, y, "0" if (x < 12 and y < 50) else "9")
    for i in range(10):  # lanyard straps from the neck down to the card
        for dx in (0, 1):
            put(rows, 18 + i // 2 + dx, 44 + i, "6" if dx == 0 else "7")
            put(rows, 29 - i // 2 - dx, 44 + i, "6" if dx == 0 else "7")
    for y in range(51, 56):
        for x in range(19, 29):
            edge = y == 51 or x in (19, 28)
            put(rows, x, y, "7" if edge else "8")
    for x, y in ((22, 53), (24, 53), (26, 53), (23, 54), (24, 54), (25, 54)):
        put(rows, x, y, "1")  # tiny paw on the card
    return rows


# ---------- Cookie: front bust ----------
def ellipse(rows, cx, cy, rx, ry, c):
    for y in range(len(rows)):
        for x in range(len(rows[0])):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                put(rows, x, y, c)


def cookie(closed):
    r = blank()
    # chest / body (fluffy, widening)
    for y in range(34, H):
        half = 11 + (y - 34) * 0.75
        for x in range(round(24 - half), round(24 + half) + 1):
            c = "1"
            if abs(x - 24) < 5 + (y - 34) * 0.2 and y > 38:
                c = "3" if (y - 38) % 6 == 0 and (x + y) % 3 == 0 else "4"  # cream bib, fluff flecks
            elif abs(x - 24) > half - 3:
                c = "2"
            put(r, x, y, c)
    # ears behind the head
    ellipse(r, 11, 25, 5, 10, "2")
    ellipse(r, 37, 25, 5, 10, "2")
    ellipse(r, 12, 23, 3.6, 7.5, "5")
    ellipse(r, 36, 23, 3.6, 7.5, "5")
    ellipse(r, 11, 26, 4, 8, "2")
    ellipse(r, 37, 26, 4, 8, "2")
    # head, forehead light, muzzle
    ellipse(r, 24, 21, 12.5, 12, "1")
    ellipse(r, 22, 15, 7, 4, "3")
    ellipse(r, 24, 31, 7.5, 5.5, "3")
    ellipse(r, 24, 33, 5.5, 3.5, "4")
    # brows (golden lifts) and eyes
    for ex in (18, 30):
        put(r, ex - 1, 19, "2"); put(r, ex, 19, "2"); put(r, ex + 1, 19, "2")
        if closed:
            for dx in (-1, 0, 1, 2):
                put(r, ex + dx - 0, 22, "e")
        else:
            for dx in (0, 1):
                for dy in (0, 1):
                    put(r, ex + dx, 21 + dy, "e")
            put(r, ex - 1, 21, "a"); put(r, ex - 1, 22, "a")
            put(r, ex, 21, "4")  # catchlight
    # tilak
    for y in (14, 15, 16):
        put(r, 24, y, "t")
    put(r, 23, 15, "t")
    # nose and mouth
    for x in range(21, 28):
        put(r, x, 28, "n")
    for x in range(22, 27):
        put(r, x, 29, "n")
    put(r, 24, 30, "n")
    put(r, 23, 27, "n"); put(r, 24, 27, "n"); put(r, 25, 27, "n")
    put(r, 22, 28, "e"); put(r, 26, 28, "e")
    for x in (21, 22, 23):
        put(r, x, 32, "2")
    for x in (25, 26, 27):
        put(r, x, 32, "2")
    put(r, 24, 31, "2")
    put(r, 24, 33, "p"); put(r, 25, 33, "p")  # tongue tip
    return outline(r)


# ---------- small side sprites (24 x 16, facing right) ----------
DOG_SIDE = {
    "walk1": [
        "........................",
        "........................",
        "..................KK....",
        ".................K12KK..",
        ".................K1112K.",
        "..K..............K13eK1K",
        ".K1K.............K1111nK",
        ".K12K...........K21111K.",
        "..K12KKKKKKKKKKK2111KK..",
        "...K21111111111112114K..",
        "....K1111111111111144K..",
        "....K2111111111111144K..",
        "....K2211KKKKK2211KK4K..",
        "....K21K.....K21KK.KK...",
        "...K2KK.......K2K.K2K...",
        "...KK..........KK..KK...",
    ],
    "walk2": [
        "........................",
        "........................",
        "..................KK....",
        ".................K12KK..",
        ".................K1112K.",
        "...K.............K13eK1K",
        "..K1K............K1111nK",
        "..K12K..........K21111K.",
        "...K2KKKKKKKKKKK2111KK..",
        "...K21111111111112114K..",
        "....K1111111111111144K..",
        "....K2111111111111144K..",
        "....K2211KKKKK2211KK4K..",
        ".....K2K......KK2K4K....",
        ".....K21K.....K2KK2K....",
        ".....KKK......KK.KK.....",
    ],
    "sit": [
        "........................",
        "..................KK....",
        ".................K12KK..",
        ".................K1112K.",
        ".................K13eK1K",
        ".................K1111nK",
        "...............KK21111K.",
        "..............K211114K..",
        ".............K2111144K..",
        "..........KKK21111144K..",
        "........KK2211111K144K..",
        ".......K22111111K1K44K..",
        ".......K21111111K1K4K...",
        ".K....K221111111K1K1K...",
        "K2KKKK2222211111K1K1K...",
        ".KKKKKKKKKKKKKKKKKKKKK..",
    ],
}

PERSON = {  # 12 x 22, facing right
    "vishal": [
        "...KKKKK....",
        "..KHHhHHK...",
        ".KHhHHHhHK..",
        ".KHHhHHHHK..",
        ".KHKSSGGGK..",
        "..KSSgSgSK..",
        "..KSSSSSSK..",
        "...KKSSSK...",
        "..K99669K...",
        ".K9996999K..",
        ".KS999699SK.",
        ".KS999889SK.",
        ".KK999889KK.",
        "..K999999K..",
        "..KhhhhhhK..",
        "..KhhKKhhK..",
        "..KSSK.KSSK.",
        "..KSSK.KSSK.",
        "..KSSK..KSK.",
        "..K44K..K44K",
        "..KKKK..KKKK",
        "............",
    ],
    "rowdy": [
        "...KKKKK....",
        "..KxxxxxxK..",
        "..KxxxxxxxK.",
        "..KSSSSSK...",
        "..KSSeSSK...",
        "..KSSSSSK...",
        "...KKSSK....",
        "..KzzzzzK...",
        ".KzzzzzzzK..",
        ".KSzzzzzSK..",
        ".KSzzzzzSK..",
        ".KKzzzzzKK..",
        "..KzzzzzK...",
        "..KzzzzzK...",
        "..KyyyyyK...",
        "..KyyKyyK...",
        "..KyyKyyK...",
        "..KyyKKyyK..",
        "..KyyK.KyyK.",
        "..KKKK.KKKK.",
        "............",
        "............",
    ],
}
SMALL_PAL = {
    "K": "#1a120c", "H": "#17131a", "h": "#3a2d33", "S": "#c98a5c", "G": "#1b1718", "g": "#fff3dc",
    "x": "#5b6170", "z": "#7d8596", "y": "#3b4252", "e": "#24140e",
    "1": GOLD["1"], "2": GOLD["2"], "3": GOLD["3"], "4": GOLD["4"], "6": GOLD["6"], "8": GOLD["8"],
    "9": GOLD["9"], "n": GOLD["n"],
}
# street dogs: palette swaps of the Cookie side sprite (Indian "indie" coats)
DOG_COATS = {
    "cookie": {"1": "#e0a54e", "2": "#b97a2f", "3": "#f3cf8a", "4": "#f9ead0"},
    "tan": {"1": "#c98a4b", "2": "#94602c", "3": "#e2b27c", "4": "#f4ead8"},
    "brown": {"1": "#8a5634", "2": "#5f3a22", "3": "#a87050", "4": "#e9dccb"},
    "black": {"1": "#2f2a28", "2": "#1d1917", "3": "#4a4340", "4": "#efe6d8"},
}


def to_image(rows, pal):
    img = Image.new("RGBA", (len(rows[0]), len(rows)), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != ".":
                px[x, y] = tuple(int(pal[ch][i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    return img


def sheet(images):
    s = Image.new("RGBA", (sum(i.width for i in images), images[0].height), (0, 0, 0, 0))
    x = 0
    for im in images:
        s.paste(im, (x, 0))
        x += im.width
    return s


def big(img, k=SCALE):
    return img.resize((img.width * k, img.height * k), Image.NEAREST)


# ---------- costume-off strip (same rules as generate_unmask.py) ----------
COLLAR = 44
LIFT = [0, 2, 5, 10, 17, 26, 40, None]
OUTFIT = [0, 0, 0, 0.25, 0.5, 0.75, 1, 1]


def unmask(i):
    base, costume = grid("open"), vishal("open")
    if LIFT[i] == 0 and OUTFIT[i] == 0:
        return costume
    rows = [r[:] for r in base]
    changed_until = COLLAR + round(OUTFIT[i] * (H - COLLAR))
    for y in range(H):
        for x in range(W):
            c = costume[y][x]
            if c == base[y][x]:
                continue
            if y >= COLLAR and y >= changed_until:
                rows[y][x] = c
            elif y < COLLAR and LIFT[i] is not None:
                put(rows, x, y - LIFT[i], c)
    return rows


# ---------- Street Rescue sheet: 24 x 24 cells, 3 columns ----------
CELL = 24
STICK = "#7a4a1c"


def cell_of(rows, pal, extra=()):
    """Places a sprite bottom-centre in a 24x24 cell, then paints extra (x, y, colour) pixels."""
    img = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    spr = to_image([list(r) for r in rows], pal)
    img.paste(spr, ((CELL - spr.width) // 2, CELL - spr.height), spr)
    px = img.load()
    for x, y, col in extra:
        if 0 <= x < CELL and 0 <= y < CELL:
            px[x, y] = tuple(int(col[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    return img


def line(x0, y0, x1, y1, col):
    n = max(abs(x1 - x0), abs(y1 - y0))
    return [(round(x0 + (x1 - x0) * t / n), round(y0 + (y1 - y0) * t / n), col) for t in range(n + 1)]


def game_sheet():
    cells = []
    for coat in ("cookie", "tan", "brown", "black"):
        cells += [cell_of(DOG_SIDE[k], {**SMALL_PAL, **DOG_COATS[coat]}) for k in ("walk1", "walk2", "sit")]
    me, rowdy = PERSON["vishal"], PERSON["rowdy"]
    arm = [(x, y, SMALL_PAL["K"]) for x in range(15, 20) for y in (11, 13)] + [(x, 12, SMALL_PAL["S"]) for x in range(15, 20)]
    cells += [cell_of(me, SMALL_PAL), cell_of(me, SMALL_PAL, arm),
              cell_of(rowdy, SMALL_PAL, line(15, 13, 20, 18, STICK) + line(15, 14, 20, 19, STICK))]
    cells += [cell_of(rowdy, SMALL_PAL, line(15, 12, 13, 1, STICK) + line(16, 12, 14, 1, STICK)),
              cell_of(rowdy, SMALL_PAL)]
    out = Image.new("RGBA", (CELL * 3, CELL * 6), (0, 0, 0, 0))
    for i, im in enumerate(cells):
        out.paste(im, ((i % 3) * CELL, (i // 3) * CELL), im)
    return out


def main():
    os.makedirs("worlds", exist_ok=True)
    me = sheet([to_image(vishal(f), PAL) for f in ORDER])
    big(me).save("worlds/vishal_golden_sheet_8x.png")
    big(sheet([to_image(unmask(i), PAL) for i in range(len(LIFT))])).save("worlds/vishal_golden_unmask_8x.png")
    buddy = sheet([to_image([list(r) for r in DOG_SIDE[k]], {**SMALL_PAL, **DOG_COATS["cookie"]}) for k in ("walk1", "walk2", "sit")])
    big(buddy).save("worlds/cookie_side_8x.png")
    big(game_sheet(), 4).save("worlds/street_rescue_4x.png")
    ck = sheet([to_image(cookie(False), PAL), to_image(cookie(True), PAL)])
    big(ck).save("worlds/cookie_bust_8x.png")
    json.dump({"dog": DOG_SIDE, "person": PERSON, "pal": SMALL_PAL, "coats": DOG_COATS},
              open("worlds/golden_small.json", "w"), indent=1)
    prev = Image.new("RGBA", (W * 7 + 8, H), (40, 40, 40, 255))
    prev.paste(me, (0, 0), me)
    prev.paste(ck, (W * 5 + 8, 0), ck)
    smalls = [to_image([list(r) for r in g], {**SMALL_PAL, **DOG_COATS[c]}) for c in DOG_COATS for g in DOG_SIDE.values()]
    smalls += [to_image([list(r) for r in g], SMALL_PAL) for g in PERSON.values()]
    row = sheet([s.crop((0, 0, s.width, 16)) if s.height > 16 else s for s in smalls[:12]])
    ppl = sheet([to_image([list(r) for r in g], SMALL_PAL) for g in PERSON.values()])
    full = Image.new("RGBA", (max(prev.width, row.width), H + 16 + 24), (40, 40, 40, 255))
    full.paste(prev, (0, 0))
    full.paste(row, (0, H + 2), row)
    full.paste(ppl, (0, H + 18), ppl)
    big(full, 4).save("worlds/golden_preview.png")
    print("wrote worlds/vishal_golden_sheet_8x.png, worlds/cookie_bust_8x.png, worlds/golden_small.json")


if __name__ == "__main__":
    main()
