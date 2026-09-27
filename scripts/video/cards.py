"""Graphics for the demo video (1920x1080): background, animated title cards, caption panels,
the phone mask and shadow, and the thumbnail.

Uses the app's own type: Figtree (bundled via @expo-google-fonts). Headlines are ExtraBold; text
between *asterisks* is the accent, set in deep sun as in the app.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
FONT_DIR = ROOT / "node_modules/@expo-google-fonts/figtree"
HEAVY = str(FONT_DIR / "800ExtraBold/Figtree_800ExtraBold.ttf")
SANS = str(FONT_DIR / "500Medium/Figtree_500Medium.ttf")
SANS_BOLD = str(FONT_DIR / "700Bold/Figtree_700Bold.ttf")
ICON = ROOT / "submission/app-icon-1024.png"

W, H = 1920, 1080
PAPER = (246, 243, 236)
GLOW = (251, 236, 207)
INK = (23, 20, 15)
INK2 = (78, 73, 63)
INK3 = (111, 105, 94)
SUN = (244, 166, 42)
SUN_DEEP = (154, 89, 8)
LEAF = (31, 107, 79)


def font(path, size):
    return ImageFont.truetype(path, size)


def sans(size, bold=False):
    return ImageFont.truetype(SANS_BOLD if bold else SANS, size)


def ease_out(p):
    p = min(max(p, 0.0), 1.0)
    return 1 - (1 - p) ** 3


# ---------- background ----------

def background(path=None, glow_at=(476, 560), radius=760):
    """Paper with a soft warm glow behind the phone (smooth radial falloff, dithered against banding)."""
    import numpy as np

    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt((x - glow_at[0]) ** 2 + (y - glow_at[1]) ** 2) / radius
    a = np.clip(1 - d, 0, 1)
    a = a * a * (3 - 2 * a) * 0.9  # smoothstep
    paper = np.array(PAPER, np.float32)
    glow = np.array(GLOW, np.float32)
    rgb = paper + (glow - paper) * a[..., None]
    rgb += np.random.default_rng(1).uniform(-0.6, 0.6, rgb.shape)
    img = Image.fromarray(np.clip(rgb + 0.5, 0, 255).astype(np.uint8), "RGB")
    if path:
        img.save(path)
    return img


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


# ---------- rich text ----------

def runs(text):
    """'Plain *accent* plain' -> [(word, accent)]"""
    out = []
    for i, part in enumerate(text.split("*")):
        for w in part.split():
            out.append((w, i % 2 == 1))
    return out


def wrap(draw, words, f, width):
    rows, cur = [], []
    for w in words:
        test = " ".join(x for x, _ in cur + [w])
        if cur and draw.textlength(test, font=f) > width:
            rows.append(cur)
            cur = [w]
        else:
            cur.append(w)
    if cur:
        rows.append(cur)
    return rows


def draw_row(draw, row, f, x, y, anchor_center=False, color=INK, accent=SUN_DEEP):
    space = draw.textlength(" ", font=f)
    total = sum(draw.textlength(w, font=f) for w, _ in row) + space * (len(row) - 1)
    cx = x - total / 2 if anchor_center else x
    for w, acc in row:
        draw.text((cx, y), w, font=f, fill=accent if acc else color)
        cx += draw.textlength(w, font=f) + space
    return total


# ---------- caption panel ----------

def caption_panel(path, label, headline, sub=None, width=880, step=None):
    """Transparent panel right of the phone: step + label, headline (with *accent*), optional sub."""
    img = Image.new("RGBA", (width, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    hf = font(HEAVY, 74)
    lh = 86
    rows = wrap(d, runs(headline), hf, width - 30)
    sf = sans(31)
    sub_rows = wrap(d, [(w, False) for w in sub.split()], sf, width - 60) if sub else []
    block_h = 64 + len(rows) * lh + (30 + len(sub_rows) * 44 if sub else 0)
    y = H / 2 - block_h / 2
    # label: a small sun dot, then the label in spaced caps
    lf = sans(24, bold=True)
    d.ellipse((2, y + 7, 16, y + 21), fill=SUN)
    tag = label.upper() if not step else f"{step}  ·  {label.upper()}"
    d.text((30, y), tag, font=lf, fill=SUN_DEEP)
    y += 64
    for r in rows:
        draw_row(d, r, hf, 0, y)
        y += lh
    if sub:
        y += 30
        for r in sub_rows:
            draw_row(d, r, sf, 0, y, color=INK2)
            y += 44
    img.save(path)


# ---------- phone frame ----------

def phone_mask(path, w, h, r):
    s = 4
    m = Image.new("L", (w * s, h * s), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * s - 1, h * s - 1), r * s, fill=255)
    m.resize((w, h), Image.LANCZOS).save(path)


def phone_shadow(path, w, h, r, pad=80):
    img = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((pad, pad + 26, pad + w, pad + h + 26), r, fill=(80, 58, 20, 64))
    img.filter(ImageFilter.GaussianBlur(36)).save(path)


# ---------- animated cards ----------

def card_frames(bg, lines, duration, fps, mark=None):
    """Kinetic title card. lines: [(text, size, t_in, color)] centered vertically as a block.
    Each line rises 26 px and fades in over 0.6 s from t_in. Yields RGB frames."""
    base = bg.convert("RGBA")
    d0 = ImageDraw.Draw(base)
    heights = [int(size * 1.2) for _, size, _, _ in lines]
    top = H / 2 - sum(heights) / 2 + (50 if mark else 0)
    layers = []
    y = top
    for (text, size, t_in, color), hgt in zip(lines, heights):
        layer = Image.new("RGBA", (W, hgt + 40), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        f = font(HEAVY, size) if size >= 48 else sans(size)
        rows = [runs(text)]
        draw_row(ld, rows[0], f, W / 2, 10, anchor_center=True, color=color)
        layers.append((layer, y - 10, t_in))
        y += hgt
    icon = None
    if mark:
        icon = Image.open(ICON).convert("RGBA").resize((mark, mark), Image.LANCZOS)
        m = Image.new("L", (mark * 4, mark * 4), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, mark * 4 - 1, mark * 4 - 1), int(mark * 4 * 0.225), fill=255)
        icon.putalpha(m.resize((mark, mark), Image.LANCZOS))
    n = int(round(duration * fps))
    del d0
    for i in range(n):
        t = i / fps
        frame = base.copy()
        if icon is not None:
            p = ease_out((t - 0.1) / 0.7)
            if p > 0:
                ic = icon.copy()
                ic.putalpha(ic.getchannel("A").point(lambda v, p=p: int(v * p)))
                frame.alpha_composite(ic, (int(W / 2 - mark / 2), int(top - mark - 40 + 20 * (1 - p))))
        for layer, ly, t_in in layers:
            p = ease_out((t - t_in) / 0.6)
            if p <= 0:
                continue
            l2 = layer if p >= 1 else layer.copy()
            if p < 1:
                l2.putalpha(l2.getchannel("A").point(lambda v, p=p: int(v * p)))
            frame.alpha_composite(l2, (0, int(ly + 26 * (1 - p))))
        yield frame.convert("RGB")


def end_frames(bg, duration, fps, beats=(1.2, 3.3, 4.0)):
    """beats: when "Small gifts. Real needs.", "Proof that protects." and the credits appear (voice-synced)."""
    lines = [
        ("Small gifts. Real needs.", 72, beats[0], INK),
        ("*Proof that protects.*", 72, beats[1], INK),
        ("", 30, 0.0, INK),
        ("Handful  ·  built with Expo + RevenueCat  ·  Shipaton 2026, Next Gen", 30, beats[2], INK2),
        ("Demo data: fictional nonprofits and causes. RevenueCat Test Store, no real money.", 25, beats[2] + 0.2, INK3),
    ]
    return card_frames(bg, lines, duration, fps, mark=150)


# ---------- thumbnail ----------

def thumbnail(path, phone_png=None):
    img = background(None, glow_at=(420, 520), radius=760).resize((1280, 720)).convert("RGBA")
    d = ImageDraw.Draw(img)
    if phone_png:
        ph = Image.open(phone_png).convert("RGBA")
        h = 640
        w = int(ph.width * h / ph.height)
        ph = ph.resize((w, h), Image.LANCZOS)
        m = Image.new("L", (w * 4, h * 4), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), 42 * 4, fill=255)
        ph.putalpha(m.resize((w, h), Image.LANCZOS))
        sh = Image.new("RGBA", (w + 120, h + 120), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((60, 78, 60 + w, 78 + h), 42, fill=(80, 58, 20, 70))
        sh = sh.filter(ImageFilter.GaussianBlur(26))
        img.alpha_composite(sh, (130 - 60, 40 - 60))
        img.alpha_composite(ph, (130, 40))
    x = 540
    icon = Image.open(ICON).convert("RGBA").resize((96, 96), Image.LANCZOS)
    m = Image.new("L", (384, 384), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, 383, 383), 86, fill=255)
    icon.putalpha(m.resize((96, 96), Image.LANCZOS))
    img.alpha_composite(icon, (x, 150))
    f = font(HEAVY, 70)
    d.text((x, 285), "Small gifts.", font=f, fill=INK)
    d.text((x, 367), "Real needs.", font=f, fill=INK)
    d.text((x, 449), "Proof that protects.", font=f, fill=SUN_DEEP)
    d.text((x + 2, 580), "Handful · iOS · Expo + RevenueCat", font=sans(30, bold=True), fill=INK2)
    img.convert("RGB").save(path)
