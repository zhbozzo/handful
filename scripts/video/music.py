"""Original score and sound effects for the Handful demo video.

Everything is synthesized here (additive synthesis, plucked strings, a small comb/all-pass reverb),
so the track has no third-party rights attached. The arrangement follows the story:

    intro  pads and a few bells under the opening lines
    story  a plucked arpeggio joins when the app appears
    lift   soft bass and a shaker from the first gift on
    outro  everything settles on the home chord and fades

    python3 scripts/video/music.py out.wav 100            # standalone, default section times
"""
import sys
import wave

import numpy as np

SR = 44100
BPM = 92
BEAT = 60 / BPM
# D major: I – vi – IV – V (Dmaj9, Bm7, Gmaj9, A6sus2), two bars each.
CHORDS = [
    [50, 57, 61, 64, 66],
    [47, 54, 57, 62, 66],
    [43, 50, 54, 57, 62],
    [45, 52, 57, 59, 64],
]
BAR = 4 * BEAT
CHORD_LEN = 2 * BAR


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
    for detune in (-0.004, 0.0, 0.004):
        f = freq * (1 + detune)
        for h, amp in ((1, 1.0), (2, 0.24), (3, 0.07)):
            out += amp * np.sin(2 * np.pi * f * h * t + detune * 900)
    trem = 1 + 0.05 * np.sin(2 * np.pi * 0.21 * t)
    return out * trem * env(len(t), 1.6, 2.4) / 6


def bell(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    tone = (
        np.sin(2 * np.pi * freq * t)
        + 0.35 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 3)
        + 0.12 * np.sin(2 * np.pi * freq * 3.01 * t) * np.exp(-t * 5)
    )
    return tone * np.exp(-t * 2.2) * env(len(t), 0.004, 0.3)


def pluck(freq, dur, bright=0.5, seed=0):
    """A soft plucked string: harmonics that fade faster the higher they are."""
    t = np.arange(int(dur * SR)) / SR
    rng = np.random.default_rng(seed)
    out = np.zeros_like(t)
    for h in range(1, 7):
        amp = (bright ** (h - 1)) / h
        phase = rng.uniform(0, 2 * np.pi)
        out += amp * np.sin(2 * np.pi * freq * h * (1 + 0.0008 * (h - 1)) * t + phase) * np.exp(-t * (3.2 + 2.4 * h))
    return out * env(len(t), 0.003, 0.08)


def bass(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.18 * np.sin(2 * np.pi * freq * 2 * t)
    x = np.tanh(1.4 * x) / np.tanh(1.4)
    return x * np.exp(-t * 1.6) * env(len(t), 0.012, 0.12)


def shaker(dur=0.12, seed=0):
    """A soft brushed shaker: band-limited noise with a quick swell and decay."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = np.random.default_rng(seed).uniform(-1, 1, n + 2)
    hiss = np.diff(noise, 2)  # tilts the noise toward the highs
    hiss = lowpass(hiss, 0.55)  # takes the sharpest edge off
    return hiss * (1 - np.exp(-t / 0.006)) * np.exp(-t * 34)


def chime(kind="success"):
    """Short UI-style chimes, in key."""
    notes = {"success": [69, 74, 78], "notify": [78, 81], "soft": [74]}[kind]
    out = np.zeros(int(1.8 * SR))
    for k, note in enumerate(notes):
        b = bell(midi(note), 1.6) * (0.9 - 0.15 * k)
        a = int(k * 0.085 * SR)
        out[a:a + len(b)] += b[: len(out) - a]
    return out


def reverb(x, mix=0.3):
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


def lowpass(x, alpha):
    """One-pole low-pass."""
    try:
        from scipy.signal import lfilter

        return lfilter([alpha], [1, alpha - 1], x)
    except ImportError:
        y = np.zeros_like(x)
        acc = 0.0
        for k in range(len(x)):
            acc += alpha * (x[k] - acc)
            y[k] = acc
        return y


def add(mix, sig, t, gain=1.0):
    a = int(t * SR)
    if a >= len(mix):
        return
    seg = sig[: len(mix) - a]
    mix[a:a + len(seg)] += gain * seg


def score(seconds, story=6.0, lift=24.0, outro=None):
    """Returns a mono float array (not normalized)."""
    outro = outro if outro is not None else seconds - 7.0
    n = int(seconds * SR)
    pads = np.zeros(n + SR * 8)
    lead = np.zeros(n + SR * 8)
    low = np.zeros(n + SR * 8)

    t0, i = 0.0, 0
    while t0 < seconds:
        chord = CHORDS[i % len(CHORDS)]
        final = t0 >= outro
        if final:
            chord = CHORDS[0]
        for note in chord:
            s = pad_note(midi(note), CHORD_LEN + 2.5) * (0.3 if note < 52 else 0.19)
            add(pads, s, t0)
        # bells: sparse, one or two per chord
        rng = np.random.default_rng(i + 11)
        for beat in (0.0, 3.0, 5.5):
            if rng.random() < 0.6 or (final and beat == 0.0):
                note = int(rng.choice(chord[2:])) + 12
                add(lead, bell(midi(note), 3.0), t0 + beat * BEAT, 0.32)
        # plucked arpeggio in eighths while the story runs
        if story <= t0 < outro:
            pattern = [0, 2, 1, 3, 2, 4, 3, 2]
            tones = [chord[1], chord[2], chord[3], chord[4], chord[2] + 12]
            for eighth in range(16):
                t = t0 + eighth * BEAT / 2
                if t >= outro:
                    break
                note = tones[pattern[eighth % 8]] + 12
                accent = 1.0 if eighth % 4 == 0 else 0.72
                add(lead, pluck(midi(note), 0.9, bright=0.45, seed=eighth + i * 16), t, 0.3 * accent)
        # bass and shaker once the first gift is made
        if lift <= t0 < outro:
            root = chord[0] - 12
            for beat in (0, 2.5, 4, 6.5):
                add(low, bass(midi(root), 1.2), t0 + beat * BEAT, 0.24)
            for eighth in range(16):
                if eighth % 2 == 1:
                    add(low, shaker(seed=eighth), t0 + eighth * BEAT / 2, 0.26 if eighth % 4 == 3 else 0.17)
        if final:
            break
        t0 += CHORD_LEN
        i += 1

    pads = lowpass(pads[:n], 0.16)
    lead = lowpass(lead[:n], 0.42)
    low = low[:n]
    mix = reverb(pads + lead, 0.34)
    mix = mix - lowpass(mix, 0.0114)  # high-pass ~80 Hz: no rumble under the bass
    mix = mix + low
    mix *= env(len(mix), 2.0, 5.0)
    return mix


def to_wav(path, mono, width_ms=11):
    mono = mono / (np.max(np.abs(mono)) + 1e-9) * 0.89
    stereo = np.stack([mono, np.roll(mono, int(width_ms / 1000 * SR))], axis=1)
    data = (stereo * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def soundtrack(path, seconds, story, lift, events=()):
    """Score plus chimes at [(time, kind)], written to a stereo WAV."""
    mix = score(seconds, story=story, lift=lift)
    mix /= np.max(np.abs(mix)) + 1e-9
    fx = np.zeros_like(mix)
    for t, kind in events:
        add(fx, chime(kind), t, 0.55 if kind == "success" else 0.4)
    to_wav(path, mix * 0.8 + reverb(fx, 0.25))


if __name__ == "__main__":
    secs = float(sys.argv[2]) if len(sys.argv) > 2 else 100
    soundtrack(sys.argv[1], secs, 6.0, 24.0)
    print(f"wrote {sys.argv[1]} ({secs:.0f}s)")
