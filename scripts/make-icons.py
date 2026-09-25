"""Renders the Handful mark into every icon size the app and submission need.

The mark: open hands (an arc) holding something small and warm (a sun).
Drawn at 4x and downsampled for clean anti-aliasing. Requires Pillow.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
INK = (23, 20, 15)
PAPER = (246, 243, 236)
SUN_TOP = (255, 196, 92)
SUN_BOTTOM = (240, 150, 28)
CUP_STROKE = 11
SUN_Y = 40
SUN_R = 13


def vgradient(size, top, bottom):
    w, h = size
    g = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        g.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return g.resize((w, h))


def draw_mark(canvas, cx, cy, scale, cup_color, glow=False):
    """Mark geometry comes from the 100x100 SVG viewBox in src/components/Wordmark.tsx."""
    ss = canvas.size[0]
    def p(x, y):
        return (cx + (x - 50) * scale, cy + (y - 57.25) * scale)

    if glow:
        glow_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow_layer)
        gx, gy = p(50, SUN_Y)
        r = 30 * scale
        gd.ellipse((gx - r, gy - r, gx + r, gy + r), fill=(244, 166, 42, 90))
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(ss * 0.06))
        canvas.alpha_composite(glow_layer)

    # Cup: bottom half of a circle (center 50,47 r 33), stroke centered on the path, round caps.
    stroke = CUP_STROKE * scale
    half = stroke / 2
    x0, y0 = p(17, 14)
    x1, y1 = p(83, 80)
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.arc((x0 - half, y0 - half, x1 + half, y1 + half), start=0, end=180, fill=cup_color, width=int(stroke))
    for ex, ey in (p(17, 47), p(83, 47)):
        d.ellipse((ex - half, ey - half, ex + half, ey + half), fill=cup_color)
    canvas.alpha_composite(layer)

    # Sun with a soft vertical gradient.
    sx, sy = p(50, SUN_Y)
    r = SUN_R * scale
    sun = vgradient((int(2 * r), int(2 * r)), SUN_TOP, SUN_BOTTOM).convert("RGBA")
    mask = Image.new("L", sun.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, sun.size[0] - 1, sun.size[1] - 1), fill=255)
    canvas.paste(sun, (int(sx - r), int(sy - r)), mask)


def render(size, bg, cup, mark_ratio, glow=False, transparent=False):
    S = size * 4
    if transparent:
        img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    else:
        img = vgradient((S, S), bg[0], bg[1]).convert("RGBA")
    scale = S * mark_ratio / 79  # mark is ~79 units wide
    draw_mark(img, S / 2, S / 2, scale, cup, glow=glow)
    return img.resize((size, size), Image.LANCZOS)


def main():
    images = ROOT / "assets" / "images"
    submission = ROOT / "submission"
    submission.mkdir(exist_ok=True)

    icon = render(1024, ((34, 29, 22), (16, 13, 9)), PAPER + (255,), 0.60, glow=True)
    icon.convert("RGB").save(images / "icon.png")
    icon.convert("RGB").save(submission / "app-icon-1024.png")

    render(1024, None, INK + (255,), 0.62, transparent=True).save(images / "splash-icon.png")
    render(1024, None, PAPER + (255,), 0.42, transparent=True).save(images / "android-icon-foreground.png")
    render(192, ((34, 29, 22), (16, 13, 9)), PAPER + (255,), 0.62).convert("RGB").save(images / "favicon.png")
    print("icons written")


if __name__ == "__main__":
    main()
