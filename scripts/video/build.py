"""Assemble the Handful demo video from simulator recordings, title cards and captions.

    python3 scripts/video/build.py            # uses submission/video/raw/*.mp4
    python3 scripts/video/build.py --dry-run  # prints the plan

Each clip is framed on the paper background (no device bezel), with a serif
caption on the right. Segments dip through paper; the original score is mixed
under everything. Output: submission/video/handful-demo.mp4 (1920x1080, 30 fps).
"""
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import cards  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "submission/video/raw"
BUILD = ROOT / "submission/video/build"
OUT = ROOT / "submission/video/handful-demo.mp4"
SCORE = ROOT / "submission/video/score.wav"

FPS = 30
PHONE_H = 980
PHONE_W = round(PHONE_H * 1179 / 2556 / 2) * 2  # keep even
PHONE_R = 64
PHONE_X = 250
PHONE_Y = (1080 - PHONE_H) // 2
CAPTION_X = PHONE_X + PHONE_W + 150
FADE = 0.28
PAPER_HEX = "0xF6F3EC"

# (kind, source, start, duration, label, headline, sub)
PLAN_FILE = Path(__file__).with_name("plan.json")


def sh(cmd):
    print("  $", " ".join(str(c) for c in cmd)[:180])
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def card_segment(i, png, dur):
    out = BUILD / f"seg-{i:02d}.mp4"
    sh([
        "ffmpeg", "-y", "-loop", "1", "-t", str(dur), "-i", png,
        "-vf", f"scale=1920:1080,format=yuv420p,fade=t=in:st=0:d={FADE}:color={PAPER_HEX},fade=t=out:st={dur - FADE}:d={FADE}:color={PAPER_HEX}",
        "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-an", out,
    ])
    return out


def clip_segment(i, src, start, dur, label, headline, sub, speed=1.0):
    cap = BUILD / f"cap-{i:02d}.png"
    cards.caption_panel(cap, label, headline, sub, width=1920 - CAPTION_X - 120)
    mask = BUILD / "phone-mask.png"
    shadow = BUILD / "phone-shadow.png"
    if not mask.exists():
        cards.phone_mask(mask, PHONE_W, PHONE_H, PHONE_R)
        cards.phone_shadow(shadow, PHONE_W, PHONE_H, PHONE_R)
    out = BUILD / f"seg-{i:02d}.mp4"
    src_dur = dur * speed
    filt = (
        f"color=c={PAPER_HEX}:s=1920x1080:r={FPS}:d={dur}[bg];"
        f"[0:v]setpts=(PTS-STARTPTS)/{speed},fps={FPS},scale={PHONE_W}:{PHONE_H}:flags=lanczos,format=rgba[ph];"
        f"[1:v]format=gray[m];[ph][m]alphamerge[phm];"
        f"[bg][2:v]overlay={PHONE_X - 80}:{PHONE_Y - 80}[b1];"
        f"[b1][phm]overlay={PHONE_X}:{PHONE_Y}:shortest=1[b2];"
        f"[b2][3:v]overlay={CAPTION_X}:0,format=yuv420p,"
        f"fade=t=in:st=0:d={FADE}:color={PAPER_HEX},fade=t=out:st={dur - FADE}:d={FADE}:color={PAPER_HEX}[v]"
    )
    sh([
        "ffmpeg", "-y", "-ss", str(start), "-t", str(src_dur), "-i", src,
        "-loop", "1", "-i", mask, "-loop", "1", "-i", shadow, "-loop", "1", "-i", cap,
        "-filter_complex", filt, "-map", "[v]", "-t", str(dur),
        "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-an", out,
    ])
    return out


def main():
    dry = "--dry-run" in sys.argv
    BUILD.mkdir(parents=True, exist_ok=True)
    plan = json.loads(PLAN_FILE.read_text())
    total = sum(s["duration"] for s in plan)
    print(f"{len(plan)} segments, {total:.1f}s total")
    if dry:
        for s in plan:
            print(" ", s)
        return
    if total > 119:
        raise SystemExit("Plan is longer than 1:59 — trim it.")

    cards.title_card(BUILD / "card-01.png", [("People want to help.", False)])
    cards.title_card(BUILD / "card-02.png", [("But most donations disappear", False), ("into a general fund.", True)])
    cards.title_card(BUILD / "card-03.png", [("Handful.", False), ("Small, real needs from", False), ("verified nonprofits.", True)], mark=True)
    cards.end_card(BUILD / "card-end.png")

    segs = []
    for i, s in enumerate(plan):
        if s["kind"] == "card":
            segs.append(card_segment(i, BUILD / s["source"], s["duration"]))
        else:
            segs.append(clip_segment(i, RAW / s["source"], s.get("start", 0), s["duration"], s["label"], s["headline"], s.get("sub"), s.get("speed", 1.0)))

    listing = BUILD / "concat.txt"
    listing.write_text("".join(f"file '{p}'\n" for p in segs))
    silent = BUILD / "silent.mp4"
    sh(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listing, "-c", "copy", silent])

    if not SCORE.exists():
        sh(["python3", str(Path(__file__).with_name("music.py")), str(SCORE), str(int(total) + 4)])
    sh([
        "ffmpeg", "-y", "-i", silent, "-i", SCORE,
        "-filter_complex", f"[1:a]atrim=0:{total},afade=t=out:st={total - 3}:d=3,volume=0.8[a]",
        "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart", OUT,
    ])
    print("wrote", OUT)


if __name__ == "__main__":
    main()
