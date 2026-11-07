# Make silence cuts safe: transcripts often end a word too early (last syllable, breathy endings).
# For every word followed by a pause > 0.3 s (where computeKeeps will cut), push its end forward
# while the audio is still above the speech threshold, so the cut never clips the word; a pause
# that holds a sustained sound (untranscribed word, laugh, sound effect) is kept whole.
# Usage: python3 -I refine_ends.py media.mp4 words.json [threshold_db=-32]
import json, subprocess, sys
import numpy as np

src, path = sys.argv[1], sys.argv[2]
thr = float(sys.argv[3]) if len(sys.argv) > 3 else -32.0
sr = 16000
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768

def db(t0, t1):
    s = a[int(t0 * sr):int(t1 * sr)]
    return 20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9) if len(s) else -99

words = json.load(open(path))
moved = 0
for w, n in zip(words, words[1:]):
    if n["s"] - w["e"] <= 0.3:
        continue
    e = w["e"]
    # a sustained loud sound inside the pause (untranscribed word, laugh, sound effect): don't cut it at all
    loud = sum(db(t, t + 0.04) > thr + 10 for t in np.arange(w["e"], n["s"] - 0.04, 0.04))
    if loud * 0.04 >= 0.15:
        print(f"{w['t']:<16} {w['e']:.2f} -> {n['s'] - 0.05:.2f}  (son dans la pause, pas de coupe)")
        w["e"] = round(n["s"] - 0.05, 3)
        moved += 1
        continue
    limit = n["s"] - 0.12
    while e < limit and db(e, e + 0.03) > thr:
        e += 0.02
    if e > w["e"] + 0.01:
        print(f"{w['t']:<16} {w['e']:.2f} -> {e:.2f}")
        w["e"] = round(e, 3)
        moved += 1
json.dump(words, open(path, "w"), ensure_ascii=False)
print(moved, "word ends extended")
