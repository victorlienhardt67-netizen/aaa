# Reframe a 16:9 multi-cam podcast into a 1080x1920 face-cam master.
# Usage: python3 -I reframe.py src.mp4 shots.json out.mp4
# shots.json: [{"from": s, "to": s, "x": 0.53}  -> single 9:16 crop centred on x (fraction of width)
#              {"from": s, "to": s, "stack": [0.33, 0.79]} -> split-screen source: left/right halves
#                                                              stacked top/bottom, each centred on x]
import cv2, json, sys, subprocess
import numpy as np

src, shots_path, dst = sys.argv[1:4]
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
    img = stacked(f, s["stack"]) if "stack" in s else single(f, s["x"])
    ff.stdin.write(img.tobytes())
    i += 1
ff.stdin.close()
ff.wait()
print("frames", i)
