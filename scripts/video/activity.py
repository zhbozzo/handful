"""Find where a simulator recording actually moves, to cut the waiting between taps.

    python3 scripts/video/activity.py recording.mp4 [--hold 0.5] [--min-idle 0.8]

Simulator recordings are variable frame rate: while the screen is still, no frames are written.
This samples the video at 30 fps, marks frames that differ from the previous one, and prints
ranges where something is happening (plus a short hold on each side), ready for "cuts" in plan.json.
A still screen cut to a still screen is invisible, so the edit reads as one continuous take.
"""
import json
import subprocess
import sys

import numpy as np

FPS = 30
W, H = 98, 213


def frames(path):
    cmd = ["ffmpeg", "-loglevel", "error", "-i", path, "-vf", f"fps={FPS},scale={W}:{H},format=gray", "-f", "rawvideo", "-"]
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.int16)


def activity(path, threshold=0.6):
    f = frames(path)
    diff = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
    return np.concatenate([[0.0], diff]) > threshold


def ranges(active, hold=0.5, min_idle=0.8):
    """Active spans, each padded by `hold` seconds; idle gaps shorter than `min_idle` are kept."""
    spans, start = [], None
    for i, a in enumerate(active):
        if a and start is None:
            start = i
        if not a and start is not None:
            spans.append([start, i])
            start = None
    if start is not None:
        spans.append([start, len(active)])
    merged = []
    for s, e in spans:
        if merged and (s - merged[-1][1]) / FPS < min_idle:
            merged[-1][1] = e
        else:
            merged.append([s, e])
    end = len(active) / FPS
    return [[round(max(0, s / FPS - hold), 2), round(min(end, e / FPS + hold), 2)] for s, e in merged]


if __name__ == "__main__":
    args = sys.argv[1:]
    hold = float(args[args.index("--hold") + 1]) if "--hold" in args else 0.5
    min_idle = float(args[args.index("--min-idle") + 1]) if "--min-idle" in args else 0.8
    act = activity(args[0])
    r = ranges(act, hold, min_idle)
    print(json.dumps(r))
    print(f"{len(act) / FPS:.1f}s recorded, {sum(e - s for s, e in r):.1f}s active", file=sys.stderr)
