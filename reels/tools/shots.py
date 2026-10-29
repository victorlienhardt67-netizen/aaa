# Detect hard cuts in a source video (mean abs diff on 64x36 thumbnails) and print shot ranges,
# plus one mid-shot frame per shot in <out_dir> to decide the 9:16 crop centre of each shot.
# Usage: python3 -I shots.py source.mp4 out_dir [threshold=25]
import cv2, numpy as np, sys, os
src, out = sys.argv[1], sys.argv[2]
thr = float(sys.argv[3]) if len(sys.argv) > 3 else 25
os.makedirs(out, exist_ok=True)
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS)
prev, i, cuts, frames = None, 0, [0.0], []
while True:
    ok, f = cap.read()
    if not ok: break
    s = cv2.resize(f, (64, 36)).astype(np.float32)
    if prev is not None and np.abs(s - prev).mean() > thr: cuts.append(i / fps)
    prev = s; i += 1
cuts.append(i / fps)
for k, (a, b) in enumerate(zip(cuts, cuts[1:])):
    cap.set(cv2.CAP_PROP_POS_MSEC, (a + b) / 2 * 1000); ok, f = cap.read()
    if ok:
        h, w = f.shape[:2]
        for g in range(1, 10):  # 10% guides to read the face x position
            cv2.line(f, (w * g // 10, 0), (w * g // 10, h), (255, 255, 255), 1)
        cv2.imwrite(f"{out}/shot{k:02d}_{a:.2f}-{b:.2f}.jpg", f)
    print(f'{{"from": {a:.2f}, "to": {b:.2f}, "x": 0.5}},  # {b - a:.2f}s')
