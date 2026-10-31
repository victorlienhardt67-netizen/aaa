# Remove burned-in overlays from a 9:16 face-cam and upscale it to the 1080x1920 master:
#   - fixed boxes (title banner…) given as rectangles, repainted every frame;
#   - word-by-word white subtitles inside a horizontal band, detected per frame (thin white strokes).
# Usage: python3 -I clean_overlays.py src.mp4 dst.mp4 --box x0,y0,x1,y1 [--box ...] [--band y0,y1]
# Coordinates are in source pixels. The repaired zone sits where the new captions go.
import argparse, subprocess
import cv2, numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("dst")
ap.add_argument("--box", action="append", default=[])
ap.add_argument("--band")
a = ap.parse_args()
boxes = [tuple(int(v) for v in b.split(",")) for b in a.box]
band = tuple(int(v) for v in a.band.split(",")) if a.band else None

cap = cv2.VideoCapture(a.src)
fps = cap.get(cv2.CAP_PROP_FPS)
W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
static = np.zeros((H, W), np.uint8)
for x0, y0, x1, y1 in boxes:
    static[y0:y1, x0:x1] = 255

def text_mask(f):
    m = static.copy()
    if band:
        y0, y1 = band
        roi = f[y0:y1]
        white = (roi.min(axis=2) > 205).astype(np.uint8) * 255
        big = cv2.morphologyEx(white, cv2.MORPH_OPEN, np.ones((15, 15), np.uint8))  # skin highlights, not text
        white = cv2.subtract(white, cv2.dilate(big, np.ones((5, 5), np.uint8)))
        m[y0:y1] |= cv2.dilate(white, np.ones((11, 11), np.uint8))
    return m

ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
    "-i", a.src, "-map", "0:v", "-map", "1:a", "-vf", "scale=1080:1920:flags=lanczos,unsharp=5:5:0.5",
    "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", a.dst], stdin=subprocess.PIPE)
n = 0
while True:
    ok, f = cap.read()
    if not ok:
        break
    ff.stdin.write(cv2.inpaint(f, text_mask(f), 7, cv2.INPAINT_TELEA).tobytes())
    n += 1
ff.stdin.close(); ff.wait()
print("frames", n)
