"""Assemble the Handful demo video from simulator recordings, title cards and captions.

    python3 scripts/video/build.py              # full build
    python3 scripts/video/build.py --dry-run    # print the timeline
    python3 scripts/video/build.py --only 5     # render one segment (for review)

Recordings (`submission/video/raw/<name>.mp4`, from `xcrun simctl io booted recordVideo`) are
variable frame rate; each is first converted to constant 60 fps at phone size, so every cut in
plan.json is exact. A clip segment is a list of cuts from one recording, joined where the
screen is still (so the joins don't show), framed on the paper background with an animated
caption. Segments cross-fade into each other; the phone stays put and only its screen changes.
The score (music.py) follows the story and puts a chime on the moments that matter.
Output: submission/video/handful-demo.mp4 (1920x1080, 60 fps, H.264 + AAC).
"""
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import cards  # noqa: E402
import music  # noqa: E402
import voice  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "submission/video/raw"
BUILD = ROOT / "submission/video/build"
OUT = ROOT / "submission/video/handful-demo.mp4"
PLAN_FILE = Path(__file__).with_name("plan.json")

FPS = 60
XFADE = 0.45
PHONE_H = 980
PHONE_W = round(PHONE_H * 1179 / 2556 / 2) * 2  # 452, keeps the 1179x2556 aspect
PHONE_R = 64
PHONE_X = 250
PHONE_Y = (1080 - PHONE_H) // 2
CAPTION_X = PHONE_X + PHONE_W + 140
CAPTION_W = 1920 - CAPTION_X - 110


def sh(cmd, **kw):
    print("  $", " ".join(str(c) for c in cmd)[:160])
    subprocess.run([str(c) for c in cmd], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, **kw)


def cfr(name):
    """Constant-frame-rate, phone-sized copy of a raw recording (cached)."""
    src = RAW / f"{name}.mp4"
    out = BUILD / f"cfr-{name}.mp4"
    if not out.exists() or out.stat().st_mtime < src.stat().st_mtime:
        sh([
            "ffmpeg", "-y", "-i", src,
            "-vf", f"fps={FPS},scale={PHONE_W}:{PHONE_H}:flags=lanczos,format=yuv420p",
            "-c:v", "libx264", "-preset", "medium", "-crf", "12", "-an", out,
        ])
    return out


def cut_parts(c):
    """A cut is [start, end], optionally followed by a speed (> 1 for scenes recorded in slow motion)
    and a dissolve length in seconds into this cut (to step over a transition the Simulator drops frames in)."""
    return c[0], c[1], (c[2] if len(c) > 2 else 1.0), (c[3] if len(c) > 3 else 0.0)


def seg_length(s):
    if s["kind"] == "clip":
        return sum((e - a) / sp - fade for a, e, sp, fade in map(cut_parts, s["cuts"])) + s.get("hold", 0)
    return s["duration"]


def to_segment_time(s, src_t):
    """Where a moment of the recording lands inside the segment."""
    acc = 0.0
    for a, e, sp, fade in map(cut_parts, s["cuts"]):
        acc -= fade
        if a <= src_t <= e:
            return acc + (src_t - a) / sp
        acc += (e - a) / sp
    raise ValueError(f"{src_t}s is not inside any cut of {s['source']}")


def clip_segment(i, s):
    src = cfr(s["source"])
    dur = seg_length(s)
    cap = BUILD / f"cap-{i:02d}.png"
    cards.caption_panel(cap, s["label"], s["headline"], s.get("sub"), width=CAPTION_W)
    mask, shadow, bg = BUILD / "phone-mask.png", BUILD / "phone-shadow.png", BUILD / "bg.png"
    out = BUILD / f"seg-{i:02d}.mp4"
    cuts = list(map(cut_parts, s["cuts"]))
    k = len(cuts)
    parts = "".join(
        f"[s{j}]trim=start={a}:end={e},setpts=(PTS-STARTPTS)/{sp},fps={FPS},settb=AVTB,format=yuv420p[c{j}];"
        for j, (a, e, sp, _) in enumerate(cuts)
    )
    # Join the cuts: a hard join where the screen is still, a dissolve where one is asked for.
    chain, acc, length = "", "[c0]", (cuts[0][1] - cuts[0][0]) / cuts[0][2]
    for j in range(1, k):
        a, e, sp, fade = cuts[j]
        nxt = f"[j{j}]"
        if fade > 0:
            chain += f"{acc}[c{j}]xfade=transition=fade:duration={fade}:offset={length - fade:.4f}{nxt};"
        else:
            chain += f"{acc}[c{j}]concat=n=2:v=1:a=0{nxt};"
        acc = nxt
        length += (e - a) / sp - fade
    hold = s.get("hold", 0)
    filt = (
        f"[0:v]split={k}" + "".join(f"[s{j}]" for j in range(k)) + ";" + parts + chain
        + f"{acc}tpad=stop_mode=clone:stop_duration={hold},format=rgba[ph];"
        + "[1:v]format=gray[m];[ph][m]alphamerge[phm];"
        + f"[2:v][3:v]overlay={PHONE_X - 80}:{PHONE_Y - 80}[b1];"
        + f"[b1][phm]overlay={PHONE_X}:{PHONE_Y}[b2];"
        # the caption rises 24 px and fades in, eased out
        + "[4:v]format=rgba,fade=t=in:st=0.2:d=0.55:alpha=1[cap];"
        + f"[b2][cap]overlay=x={CAPTION_X}:y='24*pow(1-min(max((t-0.2)/0.6,0),1),3)':eval=frame,format=yuv420p[v]"
    )
    sh([
        "ffmpeg", "-y", "-i", src,
        "-loop", "1", "-framerate", FPS, "-i", mask,
        "-loop", "1", "-framerate", FPS, "-i", bg,
        "-loop", "1", "-framerate", FPS, "-i", shadow,
        "-loop", "1", "-framerate", FPS, "-i", cap,
        "-filter_complex", filt, "-map", "[v]", "-t", f"{dur:.3f}",
        "-r", FPS, "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-an", out,
    ])
    return out


def frames_segment(i, frames, dur):
    out = BUILD / f"seg-{i:02d}.mp4"
    proc = subprocess.Popen(
        [
            "ffmpeg", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1920x1080", "-r", str(FPS), "-i", "-",
            "-t", f"{dur:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", str(out),
        ],
        stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    for f in frames:
        proc.stdin.write(f.tobytes())
    proc.stdin.close()
    if proc.wait():
        raise SystemExit(f"ffmpeg failed on segment {i}")
    print(f"  card segment {i} ({dur}s)")
    return out


def card_segment(i, s, bg):
    lines = [(t, size, t_in, cards.INK) for t, size, t_in in s["lines"]]
    return frames_segment(i, cards.card_frames(bg, lines, s["duration"], FPS), s["duration"])


def timeline(plan):
    starts, t = [], 0.0
    for s in plan:
        starts.append(t)
        t += seg_length(s) - XFADE
    return starts, t + XFADE


def main():
    args = sys.argv[1:]
    doc = json.loads(PLAN_FILE.read_text())
    plan = doc["segments"]
    starts, total = timeline(plan)
    print(f"{len(plan)} segments, {total:.1f}s total")
    if "--dry-run" in args:
        for s, t in zip(plan, starts):
            print(f"  {t:6.2f}  {seg_length(s):5.2f}s  {s.get('label', s['kind'])}")
        return
    if total >= 119.5:
        raise SystemExit("Plan is two minutes or longer — trim it.")

    BUILD.mkdir(parents=True, exist_ok=True)
    bg = cards.background(BUILD / "bg.png")
    cards.phone_mask(BUILD / "phone-mask.png", PHONE_W, PHONE_H, PHONE_R)
    cards.phone_shadow(BUILD / "phone-shadow.png", PHONE_W, PHONE_H, PHONE_R)
    card_bg = cards.background(BUILD / "card-bg.png", glow_at=(960, 540), radius=900)

    only = int(args[args.index("--only") + 1]) if "--only" in args else None
    segs = []
    for i, s in enumerate(plan):
        if only is not None and i != only:
            segs.append(BUILD / f"seg-{i:02d}.mp4")
            continue
        if s["kind"] == "clip":
            segs.append(clip_segment(i, s))
        elif s["kind"] == "card":
            segs.append(card_segment(i, s, card_bg))
        else:
            segs.append(frames_segment(i, cards.end_frames(card_bg, s["duration"], FPS, tuple(s.get("beats", (1.2, 3.3, 4.0)))), s["duration"]))
    if only is not None:
        print("wrote", segs[only])
        return

    # Sound: the score follows the story; chimes land on the moments listed in the plan.
    story = next(t for s, t in zip(plan, starts) if s.get("music") == "story")
    lift = next(t for s, t in zip(plan, starts) if s.get("music") == "lift")
    events = [
        (t + to_segment_time(s, at), kind)
        for s, t in zip(plan, starts)
        for at, kind in s.get("sfx", [])
    ]
    score = BUILD / "score.wav"
    music.soundtrack(score, total + 1, story, lift, events)

    # Voice-over: the good take of each line, placed on its scene; the music ducks under it.
    if "voice" in doc:
        v = doc["voice"]
        at = {s.get("label"): t for s, t in zip(plan, starts)}
        memo = voice.clean(RAW / v["source"])
        placements = [(a, b, at[label] + offset) for a, b, label, offset in v["takes"]]
        for a, b, label, offset in v["takes"]:
            seg = next(s for s in plan if s.get("label") == label)
            if offset + (b - a) > seg_length(seg) + 0.2:
                print(f"  ! take {a}-{b} runs past the end of '{label}'")
        mixed = BUILD / "mix.wav"
        voice.mix(score, voice.track(memo, placements, total), mixed)
        score = mixed

    # Cross-fade the segments into one picture.
    inputs, chain, prev = [], [], "[0:v]"
    for p in segs:
        inputs += ["-i", p]
    for k in range(1, len(segs)):
        label = f"[x{k}]" if k < len(segs) - 1 else "[v]"
        chain.append(f"{prev}[{k}:v]xfade=transition=fade:duration={XFADE}:offset={starts[k]:.3f}{label}")
        prev = label
    audio = len(segs)
    filt = ";".join(chain) + (
        f";[{audio}:a]atrim=0:{total:.3f},afade=t=in:d=0.4,afade=t=out:st={total - 2.5:.3f}:d=2.5,"
        "loudnorm=I=-16:TP=-1.5:LRA=11[a]"
    )
    sh([
        "ffmpeg", "-y", *inputs, "-i", score, "-filter_complex", filt,
        "-map", "[v]", "-map", "[a]", "-r", FPS,
        "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", OUT,
    ])
    print("wrote", OUT, f"({total:.1f}s)")


if __name__ == "__main__":
    main()
