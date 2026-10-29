# Remove burned-in word-by-word subtitles (white bold text in a fixed horizontal band) from a 16:9 source.
# Thin white strokes are kept, large white areas (shirts, skies) are excluded by a morphological opening.
# Usage: python3 -I clean_subs.py src.mp4 dst.mp4 [y0=600] [y1=705] [x0=360] [x1=1560]
import cv2, numpy as np, sys, subprocess
src, dst = sys.argv[1], sys.argv[2]
Y0, Y1, X0, X1 = (int(v) for v in (sys.argv[3:7] + ["600", "705", "360", "1560"][len(sys.argv[3:7]):]))

def text_mask(band):
    white = (band.min(axis=2) > 200).astype(np.uint8) * 255
    big = cv2.morphologyEx(white, cv2.MORPH_OPEN, np.ones((17, 17), np.uint8))
    big = cv2.dilate(big, np.ones((5, 5), np.uint8))
    m = cv2.subtract(white, big)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    keep = np.zeros_like(m)
    for k in range(1, n):
        x, y, w, h, a = st[k]
        if a >= 12 and h <= 75:
            keep[lab == k] = 255
    return cv2.dilate(keep, np.ones((9, 9), np.uint8))

def clean(f):
    band = f[Y0:Y1, X0:X1]
    m = text_mask(band)
    if m.any():
        f[Y0:Y1, X0:X1] = cv2.inpaint(band, m, 6, cv2.INPAINT_TELEA)
    return f

if __name__ == "__main__":
    cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS)
    W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
        "-i", src, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-crf", "12", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "copy", dst],
        stdin=subprocess.PIPE)
    while True:
        ok, f = cap.read()
        if not ok: break
        ff.stdin.write(clean(f).tobytes())
    ff.stdin.close(); ff.wait()
