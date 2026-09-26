"""Import illustrative cause photos into the app.

    python3 scripts/import-cause-photos.py ~/Downloads/handful-photos

Takes images named after cause ids (e.g. hot-meal-tonight.png), center-crops them to 3:2,
resizes to 1200 px wide, saves them as metadata-free JPEGs in assets/causes/ and rewrites
src/data/photos.ts so each cause picks up its photo. Unknown names are skipped.
"""
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/causes"
MAP = ROOT / "src/data/photos.ts"
SEED = ROOT / "src/data/seed.ts"
W, H = 1200, 800


def cause_ids():
    return set(re.findall(r"^\s{6}id: '([a-z0-9-]+)',$", SEED.read_text(), re.M)) - {""}


def fit(img):
    img = img.convert("RGB")
    target = W / H
    w, h = img.size
    if w / h > target:
        nw = int(h * target)
        img = img.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / target)
        img = img.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    return img.resize((W, H), Image.LANCZOS)


def main(src):
    ids = cause_ids()
    OUT.mkdir(parents=True, exist_ok=True)
    done = []
    for f in sorted(Path(src).expanduser().iterdir()):
        if f.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp", ".heic"}:
            continue
        cid = f.stem.lower().strip()
        if cid not in ids:
            print(f"skip {f.name}: not a cause id")
            continue
        # A fresh image from pixels only: no EXIF, GPS or generator metadata survives.
        fit(Image.open(f)).save(OUT / f"{cid}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
        done.append(cid)
        print(f"ok   {cid}.jpg")
    present = sorted(p.stem for p in OUT.glob("*.jpg") if p.stem in ids)
    entries = "\n".join(f"  '{c}': require('@/assets/causes/{c}.jpg')," for c in present)
    text = MAP.read_text()
    text = re.sub(
        r"const CAUSE_PHOTOS: Partial<Record<string, ImageSourcePropType>> = \{.*?\};",
        "const CAUSE_PHOTOS: Partial<Record<string, ImageSourcePropType>> = {\n" + entries + "\n};",
        text,
        flags=re.S,
    )
    MAP.write_text(text)
    missing = sorted(ids - set(present))
    print(f"\n{len(present)} causes have photos" + (f"; still missing: {', '.join(missing)}" if missing else ""))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
