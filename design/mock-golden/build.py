"""Builds GoldenHour.html from golden.src.html by inlining the sprites and Cookie's photos.

Run from this folder after design/pixel-me/generate_golden.py:  python3 build.py
"""
import base64
import json
from pathlib import Path

HERE = Path(__file__).parent
PIXEL = HERE.parent / "pixel-me" / "worlds"
COOKIE = HERE.parent / "assets" / "cookie"
PHOTO_KEYS = ("dupatta", "medals", "boop", "sky", "zoomies", "lamp", "sit", "look")


def data_uri(path: Path, mime: str) -> str:
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def main() -> None:
    html = (HERE / "golden.src.html").read_text()
    photos = {k: data_uri(COOKIE / f"{k}.jpg", "image/jpeg") for k in PHOTO_KEYS}
    small = json.loads((PIXEL / "golden_small.json").read_text())
    html = (html.replace("%%VISHAL%%", data_uri(PIXEL / "vishal_golden_sheet_8x.png", "image/png"))
                .replace("%%COOKIE%%", data_uri(PIXEL / "cookie_bust_8x.png", "image/png"))
                .replace("%%SMALL%%", json.dumps(small, separators=(",", ":")))
                .replace("%%PHOTOS%%", json.dumps(photos)))
    (HERE / "GoldenHour.html").write_text(html)
    print(f"wrote GoldenHour.html ({len(html) // 1024} KB)")


if __name__ == "__main__":
    main()
