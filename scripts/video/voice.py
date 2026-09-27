"""Voice-over for the demo video: clean the recording, pick the takes, place them, duck the music.

The recording is one continuous voice memo with retakes; plan.json lists the good take of each line
([start, end] in the memo) and where it lands (segment + offset). Everything else in the memo is dropped.
"""
import subprocess
import wave

import numpy as np

SR = 48000

# Speech cleanup: rumble out, gentle noise reduction, a little less mud and a little more presence,
# softer sibilants, then even out the dynamics.
CLEAN = ",".join([
    "highpass=f=85",
    "highpass=f=85",
    "afftdn=nr=10:nf=-55:tn=1",
    "equalizer=f=220:t=q:w=1.2:g=-2.5",
    "equalizer=f=3800:t=q:w=1.0:g=2",
    "deesser=i=0.35",
    "acompressor=threshold=-24dB:ratio=2.5:attack=8:release=140:makeup=3",
])


def clean(src):
    """The whole memo, cleaned, as mono float samples at 48 kHz."""
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", str(src), "-ac", "1", "-ar", str(SR), "-af", CLEAN, "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def take(x, a, b, fade=0.03):
    seg = x[int(a * SR):int(b * SR)].copy()
    n = int(fade * SR)
    ramp = np.linspace(0, 1, n) ** 2
    seg[:n] *= ramp
    seg[-n:] *= ramp[::-1]
    return seg


def track(x, placements, total, target_db=-19.0):
    """placements: [(start_in_memo, end_in_memo, time_in_video)]. Each take is levelled to the same
    loudness (the memo was recorded at slightly different distances). Returns the voice track."""
    out = np.zeros(int((total + 1) * SR))
    last_end = -1.0
    for a, b, at in sorted(placements, key=lambda p: p[2]):
        if at < last_end:
            raise SystemExit(f"Voice take {a}-{b} at {at:.2f}s overlaps the previous one (ends {last_end:.2f}s)")
        seg = take(x, a, b)
        # level on the voiced part only (ignore the quiet edges)
        loud = seg[np.abs(seg) > 0.01]
        seg *= 10 ** ((target_db - rms_db(loud if len(loud) else seg)) / 20)
        i = int(at * SR)
        out[i:i + len(seg)] += seg[: len(out) - i]
        last_end = at + (b - a)
    return out


def envelope(v, attack=0.06, release=0.45, gate=0.02):
    """0..1: how much voice is present, smoothed so the music moves gently around it."""
    hop = int(0.01 * SR)
    frames = np.abs(v[: len(v) // hop * hop]).reshape(-1, hop).max(axis=1)
    on = (frames > gate).astype(float)
    # hold short pauses between words so the music doesn't pump
    hold = int(0.35 / 0.01)
    held = on.copy()
    last = -10 ** 9
    for i, o in enumerate(on):
        if o:
            last = i
        elif i - last <= hold:
            held[i] = 1
    env = np.zeros_like(held)
    up, down = 1 - np.exp(-0.01 / attack), 1 - np.exp(-0.01 / release)
    acc = 0.0
    for i, h in enumerate(held):
        acc += (up if h > acc else down) * (h - acc)
        env[i] = acc
    return np.repeat(env, hop)


def mix(score_path, voice, out_path, duck_db=-9.0, music_db=-4.0):
    """Music sits a little under the voice between lines and ~11 dB under it while speaking."""
    with wave.open(str(score_path)) as w:
        sr = w.getframerate()
        music = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2).astype(np.float64) / 32768
    if sr != SR:
        raise SystemExit(f"score is {sr} Hz, expected {SR}")
    n = min(len(music), len(voice))
    music, voice = music[:n], voice[:n]
    env = envelope(voice)
    env = np.pad(env, (0, max(0, n - len(env))))[:n]
    gain = 10 ** ((music_db + duck_db * env) / 20)
    out = music * gain[:, None] + voice[:, None]
    out /= max(1.0, np.max(np.abs(out)) / 0.97)
    with wave.open(str(out_path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())
