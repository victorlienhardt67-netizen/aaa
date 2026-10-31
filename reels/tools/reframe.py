# Reframe a 16:9 multi-cam podcast into a 1080x1920 face-cam master.
# Usage: python3 -I reframe.py src.mp4 shots.json out.mp4 [subs_band]
#   subs_band = "0.54,0.67": vertical band (fraction of height) holding burned-in white subtitles;
#   they are detected per frame (thin near-white strokes + their shadow) and inpainted before cropping.
# shots.json: [{"from": s, "to": s, "x": 0.53}  -> single 9:16 crop centred on x (fraction of width)
#              {"from": s, "to": s, "stack": [0.33, 0.79]} -> split-screen source: left/right halves
#                                                              stacked top/bottom, each centred on x]
import cv2, json, sys, subprocess
import numpy as np

src, shots_path, dst = sys.argv[1:4]
band = [float(v) for v in sys.argv[4].split(",")] if len(sys.argv) > 4 else None
shots = json.load(open(shots_path))
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS)
W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
OW, OH = 1080, 1920
LIME = (56, 255, 213)  # BGR of #D5FF38

def shot_at(t):
    for s in shots:
        if s["from"] <= t < s["to"]:
            return s
    return shots[-1]

def remove_subs(f):
    y0, y1 = int(band[0] * H), int(band[1] * H)
    roi = f[y0:y1]
    white = (roi.min(axis=2) > 215).astype(np.uint8)
    # keep only text-sized blobs (subtitle strokes), not shirts or windows
    n, lab, stats, _ = cv2.connectedComponentsWithStats(white, 8)
    keep = np.zeros_like(white)
    for i in range(1, n):
        x, y, w, h, a = stats[i]
        if a < 2500 and h < (y1 - y0) * 0.9 and w < W * 0.2:
            keep[lab == i] = 1
    if keep.sum() < 40:
        return f
    mask = np.zeros(f.shape[:2], np.uint8)
    mask[y0:y1] = cv2.dilate(keep, np.ones((9, 9), np.uint8)) * 255
    return cv2.inpaint(f, mask, 5, cv2.INPAINT_TELEA)

def single(f, x):
    cw = int(round(H * 9 / 16))
    x0 = int(np.clip(x * W - cw / 2, 0, W - cw))
    return cv2.resize(f[:, x0:x0 + cw], (OW, OH), interpolation=cv2.INTER_LANCZOS4)

def stacked(f, xs):
    half = W // 2
    ph = OH // 2
    ch = int(round(half * ph / OW))  # crop height in a half for a 1080x960 panel
    out = []
    for k, x in enumerate(xs):
        part = f[:, k * half:(k + 1) * half]
        y0 = int(np.clip(H * 0.42 - ch / 2, 0, H - ch))
        out.append(cv2.resize(part[y0:y0 + ch], (OW, ph), interpolation=cv2.INTER_LANCZOS4))
    img = np.vstack(out)
    cv2.rectangle(img, (0, ph - 3), (OW, ph + 3), LIME, -1)
    return img

ff = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{OW}x{OH}", "-r", str(fps), "-i", "-",
     "-i", src, "-map", "0:v", "-map", "1:a", "-vf", "unsharp=5:5:0.6", "-c:v", "libx264", "-crf", "15", "-preset", "fast",
     "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", dst],
    stdin=subprocess.PIPE,
)
i = 0
while True:
    ok, f = cap.read()
    if not ok:
        break
    s = shot_at(i / fps)
    if band:
        f = remove_subs(f)
    img = stacked(f, s["stack"]) if "stack" in s else single(f, s["x"])
    ff.stdin.write(img.tobytes())
    i += 1
ff.stdin.close()
ff.wait()
print("frames", i)
