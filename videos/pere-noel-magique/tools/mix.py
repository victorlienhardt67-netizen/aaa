# Builds assets/audio/mix.wav: music bed ducked under the voices, ambiences, SFX, voice-over and Santa.
import numpy as np, subprocess, sys, os

SR, DUR = 48000, 58.0
A = os.path.join(os.path.dirname(__file__), "..", "assets", "audio")


def load(name):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(A, name), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


N = int(SR * DUR)
bus = {k: np.zeros((N, 2), np.float32) for k in ("music", "amb", "sfx", "vo")}


def place(b, name, at, gain=1.0, start=0.0, length=None, fade_in=0.01, fade_out=0.05):
    x = load(name)
    x = x[int(start * SR):]
    if length:
        x = x[: int(length * SR)]
    fi, fo = max(1, int(fade_in * SR)), max(1, int(fade_out * SR))
    env = np.ones(len(x), np.float32)
    env[:fi] = np.linspace(0, 1, fi)[: len(env)]
    env[-fo:] *= np.linspace(1, 0, fo)[-len(env):]
    x = x * env[:, None] * gain
    i = int(at * SR)
    n = min(len(x), N - i)
    bus[b][i : i + n] += x[:n]


db = lambda d: 10 ** (d / 20)

# voices (narrator + Santa)
VO = [("vo1.mp3", 0.15), ("vo2.mp3", 5.5), ("vo3.mp3", 9.3), ("vo4.mp3", 13.9), ("vo5.mp3", 21.4), ("vo6.mp3", 28.2), ("vo8.mp3", 42.1), ("vo9.mp3", 48.7), ("vo10.mp3", 53.4)]
for f, at in VO:
    place("vo", f, at, db(0))
SANTA = [("design_C.mp3", 32.7, 1.0), ("santa_hohoho.mp3", 51.55, 0.9)]
for f, at, g in SANTA:
    place("vo", f, at, g)

# ambiences
place("amb", "sfx_night.mp3", 0.0, db(-8), length=6.0, fade_in=0.3, fade_out=1.2)
place("amb", "sfx_fire.mp3", 4.6, db(-14), length=9.0, fade_in=0.8, fade_out=1.0)
place("amb", "sfx_workshop.mp3", 20.2, db(-13), length=8.4, fade_in=0.6, fade_out=1.0)
place("amb", "sfx_fire.mp3", 28.2, db(-18), length=13.4, fade_in=0.8, fade_out=1.0)
place("amb", "sfx_fire.mp3", 45.2, db(-15), length=6.4, fade_in=0.8, fade_out=1.2)
place("amb", "sfx_night.mp3", 51.3, db(-12), length=6.7, fade_in=0.8, fade_out=1.0)

# sound effects, on the picture's beats
FX = [
    ("sfx_taps.mp3", 9.85, -10, 0, None), ("sfx_taps.mp3", 11.38, -10, 0, 0.3), ("sfx_taps.mp3", 12.03, -10, 0, 0.3), ("sfx_taps.mp3", 12.92, -8, 0, 0.35),
    ("sfx_sparkle.mp3", 13.12, -9, 0, None), ("sfx_whoosh.mp3", 13.5, -6, 0, None), ("sfx_whoosh.mp3", 15.7, -9, 0, None),
    ("sfx_tube.mp3", 19.9, -7, 0, None), ("sfx_sparkle.mp3", 21.05, -11, 0, None), ("sfx_sparkle.mp3", 23.65, -10, 0, None), ("sfx_sparkle.mp3", 26.15, -11, 0, None),
    ("sfx_clap.mp3", 31.3, -6, 0, None), ("sfx_sparkle.mp3", 41.0, -16, 0, None),
    ("sfx_star.mp3", 41.95, -7, 0, None), ("sfx_sparkle.mp3", 45.15, -9, 0, None), ("sfx_notif.mp3", 45.5, -7, 0, None),
    ("sfx_sparkle.mp3", 46.9, -11, 0, None), ("sfx_sparkle.mp3", 54.0, -12, 0, None),
]
for f, at, g, st, ln in FX:
    place("sfx", f, at, db(g), start=st, length=ln)

# music bed, ducked under every spoken line (deeper under Santa)
place("music", "music_eleven.mp3", 0.0, 1.0, length=DUR, fade_in=0.05, fade_out=1.6)
t = np.arange(N) / SR
duck = np.zeros(N, np.float32)


def window(a, b, depth, att=0.25, rel=0.45):
    up = np.clip((t - (a - att)) / att, 0, 1)
    down = np.clip(((b + rel) - t) / rel, 0, 1)
    return np.minimum(up, down) * depth


for f, at in VO:
    L = len(load(f)) / SR
    duck = np.maximum(duck, window(at, at + L, 7.5))
duck = np.maximum(duck, window(32.7, 41.0, 15.0, att=0.6, rel=1.0))
duck = np.maximum(duck, window(51.55, 54.5, 6.0))
music_gain = db(-6) * 10 ** (-duck / 20)
bus["music"] *= music_gain[:, None]
bus["amb"] *= (10 ** (-np.maximum(duck - 4, 0) / 20))[:, None]

mix = bus["music"] + bus["amb"] + bus["sfx"] + bus["vo"]
mix[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))[:, None]
tmp = os.path.join(A, "_premix.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", tmp], input=mix.astype(np.float32).tobytes())
# loudness for social feeds: -14 LUFS integrated, -1 dBTP
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1:LRA=9", "-ar", str(SR), os.path.join(A, "mix.wav")])
os.remove(tmp)
print("mix.wav written")
