"""Title cards, caption panels and frame assets for the demo video (1920x1080).

Uses the app's own type: Figtree (bundled via @expo-google-fonts). Headlines are ExtraBold;
the accent line of a headline is set in the deep sun color, as in the app.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
FONT_DIR = ROOT / "node_modules/@expo-google-fonts/figtree"
HEAVY = str(FONT_DIR / "800ExtraBold/Figtree_800ExtraBold.ttf")
SANS = str(FONT_DIR / "500Medium/Figtree_500Medium.ttf")
SANS_BOLD = str(FONT_DIR / "700Bold/Figtree_700Bold.ttf")
# Kept for callers: a "serif" headline is now the heavy weight, "italic" means the accent color.
SERIF = HEAVY
SERIF_ITALIC = HEAVY

W, H = 1920, 1080
PAPER = (246, 243, 236)
INK = (23, 20, 15)
INK2 = (92, 86, 75)
INK3 = (143, 136, 123)
SUN = (244, 166, 42)
SUN_DEEP = (168, 98, 10)


def font(path, size):
    return ImageFont.truetype(path, size)


def sans(size, bold=False):
    return ImageFont.truetype(SANS_BOLD if bold else SANS, size)


def draw_mark(img, cx, cy, size, cup=INK, sun=SUN):
    """The Handful mark (see src/components/Wordmark.tsx), drawn at 4x then downsampled."""
    s = 4
    layer = Image.new("RGBA", (size * s, size * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    k = size * s / 100
    stroke = 11 * k
    half = stroke / 2
    d.arc((17 * k - half, 14 * k - half, 83 * k + half, 80 * k + half), 0, 180, fill=cup, width=int(stroke))
    for x in (17, 83):
        d.ellipse((x * k - half, 47 * k - half, x * k + half, 47 * k + half), fill=cup)
    d.ellipse((37 * k, 27 * k, 63 * k, 53 * k), fill=sun)
    layer = layer.resize((size, size), Image.LANCZOS)
    img.alpha_composite(layer, (int(cx - size / 2), int(cy - size / 2)))


def text_block(draw, lines, x, y, anchor="la", spacing=1.08):
    """lines: [(text, font, color)]. Returns bottom y."""
    for text, f, col in lines:
        draw.text((x, y), text, font=f, fill=col, anchor=anchor)
        y += int(f.size * spacing)
    return y


def title_card(path, lines, mark=False, footer=None):
    """Centered serif lines on paper. lines: [(text, italic, color?)]"""
    img = Image.new("RGBA", (W, H), PAPER + (255,))
    d = ImageDraw.Draw(img)
    size = 92
    fonts = [font(HEAVY, size) for _ in lines]
    total = len(lines) * int(size * 1.18)
    y = H / 2 - total / 2 + (40 if mark else 0)
    if mark:
        draw_mark(img, W / 2, y - 110, 120)
    for (text, it, *rest), f in zip(lines, fonts):
        col = rest[0] if rest else (SUN_DEEP if it else INK)
        d.text((W / 2, y), text, font=f, fill=col, anchor="ma")
        y += int(size * 1.18)
    if footer:
        d.text((W / 2, H - 90), footer, font=sans(26), fill=INK3, anchor="ma")
    img.convert("RGB").save(path)


def end_card(path):
    img = Image.new("RGBA", (W, H), PAPER + (255,))
    d = ImageDraw.Draw(img)
    draw_mark(img, W / 2 - 215, 400, 132)
    d.text((W / 2 - 135, 400), "handful", font=font(HEAVY, 140), fill=INK, anchor="lm")
    d.text((W / 2, 560), "Small gifts. Real needs.", font=font(HEAVY, 60), fill=INK, anchor="ma")
    d.text((W / 2, 636), "Proof that protects.", font=font(HEAVY, 60), fill=SUN_DEEP, anchor="ma")
    d.text((W / 2, 830), "Built with Expo + RevenueCat  ·  Shipaton 2026 · Next Gen", font=sans(28), fill=INK3, anchor="ma")
    d.text((W / 2, 874), "Demo data · fictional nonprofits · RevenueCat Test Store (no real money)", font=sans(24), fill=INK3, anchor="ma")
    img.convert("RGB").save(path)


def caption_panel(path, label, headline, sub=None, width=820):
    """Transparent panel placed right of the phone: small label, serif headline, optional sub."""
    img = Image.new("RGBA", (width, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    hf = font(HEAVY, 72)
    # wrap headline
    words, rows, cur = headline.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if d.textlength(test, font=hf) > width - 40 and cur:
            rows.append(cur)
            cur = w
        else:
            cur = test
    rows.append(cur)
    block_h = 50 + len(rows) * 86 + (80 if sub else 0)
    y = H / 2 - block_h / 2
    d.text((0, y), label.upper(), font=sans(24, bold=True), fill=SUN_DEEP)
    y += 50
    for r in rows:
        d.text((0, y), r, font=hf, fill=INK)
        y += 86
    if sub:
        y += 34
        sf = sans(30)
        d.text((0, y), sub, font=sf, fill=INK2)
    img.save(path)


def phone_mask(path, w, h, r):
    s = 4
    m = Image.new("L", (w * s, h * s), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * s - 1, h * s - 1), r * s, fill=255)
    m.resize((w, h), Image.LANCZOS).save(path)


def phone_shadow(path, w, h, r, pad=80):
    img = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((pad, pad + 24, pad + w, pad + h + 24), r, fill=(59, 47, 26, 70))
    img.filter(ImageFilter.GaussianBlur(34)).save(path)


def thumbnail(path, ring_png=None):
    img = Image.new("RGBA", (1280, 720), PAPER + (255,))
    d = ImageDraw.Draw(img)
    # ring
    cx, cy, r = 330, 360, 200
    s = 4
    ring = Image.new("RGBA", (r * 2 * s + 80, r * 2 * s + 80), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    rd.ellipse((40, 40, 40 + r * 2 * s, 40 + r * 2 * s), outline=SUN, width=44 * s // 2)
    ring = ring.resize((r * 2 + 20, r * 2 + 20), Image.LANCZOS)
    img.alpha_composite(ring, (cx - r - 10, cy - r - 10))
    # check
    d.line([(cx - 70, cy + 5), (cx - 20, cy + 55), (cx + 80, cy - 55)], fill=INK, width=30, joint="curve")
    d.text((600, 250), "Only $4 left.", font=font(HEAVY, 86), fill=INK)
    d.text((600, 360), "Complete it.", font=font(HEAVY, 86), fill=SUN_DEEP)
    draw_mark(img, 628, 560, 56)
    d.text((666, 560), "handful", font=font(HEAVY, 52), fill=INK, anchor="lm")
    img.convert("RGB").save(path)


if __name__ == "__main__":
    out = ROOT / "submission/video/build"
    out.mkdir(parents=True, exist_ok=True)
    title_card(out / "card-01.png", [("People want to help.", False)])
    title_card(out / "card-02.png", [("But most donations disappear", False), ("into a general fund.", True)])
    title_card(out / "card-03.png", [("Handful.", False), ("Small, real needs from", False), ("verified nonprofits.", True)], mark=True)
    end_card(out / "card-end.png")
    thumbnail(ROOT / "submission/video/thumbnail.png")
    print("cards written to", out)
