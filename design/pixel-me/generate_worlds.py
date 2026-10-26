"""World costumes for the approved pixel bust.

Reads vishal_frames.json (5 eye frames: open, left, right, half, closed) and paints a
costume over every frame, so blinks and glances keep working in each world:
  gp      full-face racing helmet (visor up: eyes and glasses show) + race suit
  gaming  headset with mic boom
  run     headband + running singlet with a No. 4 bib
  ai      neon visor (eye glow follows gaze, dims to blink) + dark jacket
Writes worlds/vishal_<world>_sheet_8x.png (1920x448) and worlds/preview.png.
"""
import json
import math
import os
from PIL import Image

SCALE = 8
src = json.load(open("vishal_frames.json"))
BASE_PAL = src["palette"]
ORDER = src["order"]
W, H = 48, 56
SHIRT = set("WwUuN")
SKIN = set("SsLdTMm")

# extra palette keys per costume (single characters not used by the base palette)
COSTUME_PAL = {
    # racing
    "1": "#e10600", "2": "#a30400", "3": "#ff6a55", "4": "#ffffff", "5": "#ffd400", "6": "#16161a", "7": "#3a3a40",
    "8": "#c9c9cf",
    # gaming
    "a": "#2a2a33", "c": "#4a4a57", "e": "#3d7bff", "f": "#9fc0ff",
    # running
    "j": "#d8ff3a", "k": "#1f5fd1", "l": "#1747a6", "n": "#ffffff", "o": "#111111",
    # ai
    "p": "#140c26", "q": "#2de2e6", "t": "#ff2a6d", "v": "#0b0716", "x": "#7a4dff", "y": "#a3fbff",
}
PAL = {**BASE_PAL, **COSTUME_PAL}

DIGIT_4 = ["X.X", "X.X", "XXX", "..X", "..X"]


def grid(frame):
    return [list(r) for r in src["frames"][frame]]


def put(rows, x, y, c):
    if 0 <= x < W and 0 <= y < H:
        rows[y][x] = c


def digit(rows, x0, y0, c, pattern=DIGIT_4):
    for dy, line in enumerate(pattern):
        for dx, ch in enumerate(line):
            if ch == "X":
                put(rows, x0 + dx, y0 + dy, c)


# ---------- Grand Prix: helmet + race suit ----------
def helmet_halfwidth(y):
    """Shell silhouette: round dome, wide cheeks, slightly narrower chin bar."""
    if y < 3 or y > 43:
        return None
    if y <= 24:
        t = (24 - y) / 21
        return 18.5 * math.sqrt(max(0.0, 1 - t * t))
    t = (y - 24) / 20
    return 18.5 - 5.5 * t * t


VISOR = (25, 31, 12, 36)  # rows y0..y1, cols x0..x1 (the opening that shows the eyes)


def gp(frame):
    rows = grid(frame)
    keep = {(x, y): rows[y][x] for y in range(VISOR[0], VISOR[1] + 1) for x in range(VISOR[2], VISOR[3] + 1)}
    for y in range(H):
        hw = helmet_halfwidth(y)
        if hw is None:
            continue
        x0, x1 = round(24 - hw), round(24 + hw) - 1
        for x in range(x0, x1 + 1):
            edge = x in (x0, x1) or helmet_halfwidth(y - 1) is None or helmet_halfwidth(y + 1) is None
            if edge:
                c = "K"
            elif y <= 9 and x < 22:
                c = "3"  # highlight on the dome
            elif x >= 31 or y >= 38:
                c = "2"  # shade
            else:
                c = "1"
            put(rows, x, y, c)
    # white racing stripe and yellow pinline across the shell
    for x in range(6, 43):
        for y, c in ((19, "4"), (20, "4"), (21, "5")):
            if rows[y][x] in "123":
                put(rows, x, y, c)
    # top air intake
    for x in range(21, 28):
        put(rows, x, 4, "6")
    # number 4 on the side of the shell
    digit(rows, 34, 11, "4")
    # visor frame (dark) around the opening, then restore the face inside it
    y0, y1, xa, xb = VISOR
    for x in range(xa - 1, xb + 2):
        put(rows, x, y0 - 1, "6")
        put(rows, x, y1 + 1, "6")
    for y in range(y0 - 1, y1 + 2):
        put(rows, xa - 1, y, "6")
        put(rows, xb + 1, y, "6")
    for (x, y), c in keep.items():
        put(rows, x, y, c)
    # chin bar vents
    for x in (21, 23, 25, 27):
        put(rows, x, 37, "6")
        put(rows, x, 38, "6")
    # collar (HANS) and race suit
    for y in range(44, H):
        for x in range(W):
            if rows[y][x] in SHIRT or rows[y][x] in SKIN:
                c = "1"
                if 44 <= y <= 45:
                    c = "6"  # collar
                elif x in (23, 24):
                    c = "8"  # zip
                elif y >= 50 and (x < 8 or x > 39):
                    c = "4"  # white shoulder panels
                elif x >= 32 and y >= 47:
                    c = "2"
                put(rows, x, y, c)
    return rows


# ---------- Gaming: headset ----------
def gaming(frame):
    rows = grid(frame)
    # band over the top of the hair
    for x in range(10, 38):
        dy = int(round(((x - 24) / 14) ** 2 * 6))
        put(rows, x, 3 + dy, "K")
        put(rows, x, 4 + dy, "8" if x < 24 else "7")
        put(rows, x, 5 + dy, "7" if x < 24 else "a")
        put(rows, x, 6 + dy, "K")
    # ear cups
    for side, xs in (("L", range(6, 12)), ("R", range(36, 42))):
        for y in range(22, 34):
            for x in xs:
                edge = x in (xs.start, xs.stop - 1) or y in (22, 33)
                put(rows, x, y, "K" if edge else ("c" if y < 26 else "a"))
        led_x = 8 if side == "L" else 39
        put(rows, led_x, 30, "e")
        put(rows, led_x + 1, 30, "f")
    # mic boom from the left cup towards the mouth
    for i in range(0, 10):
        put(rows, 10 + i, 33 + i // 3, "a")
    for x in range(19, 23):
        put(rows, x, 36, "K")
        put(rows, x, 37, "e")
    return rows


# ---------- Running: headband + singlet with bib ----------
def run(frame):
    rows = grid(frame)
    for y in (21, 22, 23):
        for x in range(W):
            if rows[y][x] in "Hhr" or (rows[y][x] == "K" and 7 <= x <= 40):
                put(rows, x, y, "j" if y != 22 else "k")
    for y in range(44, H):
        for x in range(W):
            if rows[y][x] in SHIRT:
                if y >= 47 and (x < 9 or x > 38):
                    put(rows, x, y, "L")  # bare shoulders
                else:
                    put(rows, x, y, "k" if x < 30 else "l")
    # bib
    for y in range(48, 56):
        for x in range(16, 32):
            put(rows, x, y, "n")
    for x, y in ((16, 48), (31, 48), (16, 55), (31, 55)):
        put(rows, x, y, "7")
    digit(rows, 22, 50, "o")
    for x in range(18, 30):
        put(rows, x, 49, "1" if x % 2 else "n")  # red top strip on the bib
    return rows


# ---------- AI: neon visor + jacket ----------
GLOW = {"open": 0, "left": -1, "right": 1}


def ai(frame):
    rows = grid(frame)
    for y in range(26, 32):
        for x in range(11, 37):
            edge = y in (26, 31)
            put(rows, x, y, "q" if edge and x % 3 else ("x" if edge else "v"))
    shift = GLOW.get(frame)
    for ex in (19, 28):
        if shift is not None:
            for dx in range(3):
                put(rows, ex + shift + dx, 28, "y")
                put(rows, ex + shift + dx, 29, "q")
        elif frame == "half":
            for dx in range(3):
                put(rows, ex + dx, 29, "q")
        else:
            for dx in range(3):
                put(rows, ex + dx, 29, "x")
    put(rows, 36, 28, "t")
    put(rows, 36, 29, "t")
    for y in range(44, H):
        for x in range(W):
            if rows[y][x] in SHIRT:
                c = "p"
                if y in (45, 46) or (x in (23, 24) and y > 46):
                    c = "q"
                elif (x * 7 + y * 3) % 23 == 0:
                    c = "t"
                put(rows, x, y, c)
    return rows


WORLDS = {"gp": gp, "gaming": gaming, "run": run, "ai": ai}


def to_image(rows):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != ".":
                px[x, y] = tuple(int(PAL[ch][i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    return img


def main():
    os.makedirs("worlds", exist_ok=True)
    previews = []
    for name, paint in WORLDS.items():
        frames = [to_image(paint(f)) for f in ORDER]
        sheet = Image.new("RGBA", (W * len(frames), H), (0, 0, 0, 0))
        for i, im in enumerate(frames):
            sheet.paste(im, (i * W, 0))
        sheet.resize((sheet.width * SCALE, sheet.height * SCALE), Image.NEAREST).save(f"worlds/vishal_{name}_sheet_8x.png")
        previews.append(sheet)

    prev = Image.new("RGBA", (W * 5, H * len(previews)), (40, 40, 40, 255))
    for i, s in enumerate(previews):
        prev.paste(s, (0, i * H), s)
    prev.resize((prev.width * 4, prev.height * 4), Image.NEAREST).save("worlds/preview.png")
    print("wrote", ", ".join(f"worlds/vishal_{n}_sheet_8x.png" for n in WORLDS))


if __name__ == "__main__":
    main()
