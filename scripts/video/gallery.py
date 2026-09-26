"""Devpost gallery images (1920x1080): a screenshot framed on paper with a serif headline."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
import cards  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SHOTS = ROOT / "submission/screenshots"
OUT = ROOT / "submission/gallery"

ITEMS = [
    ("01-home.png", "Real needs", "Give to something real.", "Small, specific needs from verified nonprofits."),
    ("04b-give-amounts.png", "Giving", "See your gift land first.", "No platform fee. No tip. No surprise total."),
    ("06-shield-review.png", "Privacy Shield", "Faces and location found on the phone.", "Apple Vision, before anything is posted."),
    ("06b-shield-protected.png", "Privacy Shield", "Protected before it’s posted.", "Faces blurred, metadata stripped, nothing uploaded."),
    ("08-proof.png", "Proof", "It got there.", "Receipt, leftover and a privacy-safe photo."),
    ("09-impact.png", "Your impact", "Things, not points.", "Only what you did: delivered, on the way, funding."),
    ("07d-publish-review.png", "For nonprofits", "Post a need in three steps.", "Category and icons from what you type; one confirmation."),
    ("10-supporter.png", "RevenueCat", "Keep Handful free.", "Offering, entitlement, restore — the part that ships."),
]


def frame(shot, label, headline, sub, out):
    W, H = 1920, 1080
    img = Image.new("RGBA", (W, H), cards.PAPER + (255,))
    ph = 960
    pw = round(ph * 1179 / 2556)
    x, y = 250, (H - ph) // 2
    shadow = Image.new("RGBA", (pw + 160, ph + 160), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((80, 104, 80 + pw, 104 + ph), 60, fill=(59, 47, 26, 70))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(34)), (x - 80, y - 80))
    screen = Image.open(shot).convert("RGBA").resize((pw, ph), Image.LANCZOS)
    mask = Image.new("L", (pw * 4, ph * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, pw * 4 - 1, ph * 4 - 1), 60 * 4, fill=255)
    img.paste(screen, (x, y), mask.resize((pw, ph), Image.LANCZOS))
    cap_x = x + pw + 150
    panel = OUT / "_cap.png"
    cards.caption_panel(panel, label, headline, sub, width=W - cap_x - 120)
    img.alpha_composite(Image.open(panel), (cap_x, 0))
    panel.unlink()
    img.convert("RGB").save(out, quality=92)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for i, (shot, label, headline, sub) in enumerate(ITEMS, 1):
        if (SHOTS / shot).exists():
            frame(SHOTS / shot, label, headline, sub, OUT / f"gallery-{i:02d}.jpg")
    print("gallery written to", OUT)
