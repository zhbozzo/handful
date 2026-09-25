"""Original ambient score for the Handful demo video.

Everything is synthesized here (additive synthesis + a small comb/all-pass reverb),
so the track has no third-party rights attached. Usage:

    python3 scripts/video/music.py out.wav 112
"""
import sys
import wave

import numpy as np

SR = 44100


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n, attack, release):
    e = np.ones(n)
    a = int(attack * SR)
    r = int(release * SR)
    if a:
        e[:a] = np.linspace(0, 1, a) ** 2
    if r:
        e[-r:] *= np.linspace(1, 0, r) ** 1.5
    return e


def pad_note(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for detune in (-0.0035, 0.0, 0.0035):
        f = freq * (1 + detune)
        for h, amp in ((1, 1.0), (2, 0.28), (3, 0.08), (4, 0.03)):
            out += amp * np.sin(2 * np.pi * f * h * t + detune * 900)
    trem = 1 + 0.06 * np.sin(2 * np.pi * 0.17 * t)
    return out * trem * env(len(t), 2.4, 2.8) / 6


def bell(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    decay = np.exp(-t * 2.2)
    tone = (
        np.sin(2 * np.pi * freq * t)
        + 0.35 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 3)
        + 0.12 * np.sin(2 * np.pi * freq * 3.01 * t) * np.exp(-t * 5)
    )
    return tone * decay * env(len(t), 0.006, 0.3)


def reverb(x, mix=0.32):
    out = np.zeros_like(x)
    for delay_ms, fb in ((29.7, 0.78), (37.1, 0.76), (41.1, 0.74), (43.7, 0.72)):
        d = int(SR * delay_ms / 1000)
        y = np.copy(x)
        for i in range(d, len(y), d):
            y[i:i + d] += fb * y[i - d:i][: len(y[i:i + d])]
        out += y
    out /= 4
    for delay_ms, g in ((5.0, 0.7), (1.7, 0.7)):
        d = int(SR * delay_ms / 1000)
        y = np.zeros_like(out)
        y[:d] = out[:d]
        y[d:] = -g * out[d:] + out[:-d] + g * np.concatenate([np.zeros(d), out[:-2 * d]])[: len(out) - d]
        out = y
    return (1 - mix) * x + mix * out


def main(path, seconds):
    n = int(seconds * SR)
    mix = np.zeros(n + SR * 6)

    # D major, warm and unhurried: Dmaj9 – Bm7 – Gmaj9 – A6sus2, 8 s per chord.
    chords = [
        [50, 57, 61, 64, 66],
        [47, 54, 57, 62, 66],
        [43, 50, 54, 57, 62],
        [45, 52, 57, 59, 64],
    ]
    bar = 8.0
    t0 = 0.0
    i = 0
    while t0 < seconds:
        chord = chords[i % len(chords)]
        for note in chord:
            s = pad_note(midi(note), bar + 3.0) * (0.9 if note < 52 else 0.55)
            a = int(t0 * SR)
            mix[a:a + len(s)] += s
        # sparse bell melody on chord tones, one or two octaves up
        rng = np.random.default_rng(i + 7)
        for beat in (0.0, 2.0, 3.5, 5.0, 6.5):
            if rng.random() < 0.72:
                note = int(rng.choice(chord[2:])) + 12
                b = bell(midi(note), 3.2) * 0.22
                a = int((t0 + beat) * SR)
                mix[a:a + len(b)] += b
        t0 += bar
        i += 1

    mix = mix[:n]
    mix = reverb(mix)
    # gentle high cut (one-pole)
    y = np.zeros_like(mix)
    alpha = 0.18
    for k in range(1, len(mix)):
        y[k] = y[k - 1] + alpha * (mix[k] - y[k - 1])
    mix = y
    mix *= env(len(mix), 2.5, 5.0)
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.5

    stereo = np.stack([mix, np.roll(mix, int(0.011 * SR))], axis=1)
    data = (stereo * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"wrote {path} ({seconds:.0f}s)")


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 112)
