# Remove burned-in banner (inpaint) + 9:16 crop that pushes the repaired band to the top edge.
import cv2, numpy as np, sys, subprocess
src, dst = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(src)
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); fps = cap.get(cv2.CAP_PROP_FPS)
fr = []
for i in range(0, n, 60):
    cap.set(cv2.CAP_PROP_POS_FRAMES, i); ok, f = cap.read(); fr.append(f)
p25 = np.percentile(np.stack(fr), 25, axis=0)
white = (p25.min(axis=2) > 200).astype(np.uint8) * 255
white[:100] = 0; white[400:] = 0
cl = cv2.morphologyEx(white, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
cnts, _ = cv2.findContours(cl, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
mask = np.zeros_like(white); cv2.drawContours(mask, cnts, -1, 255, -1)
mask = cv2.dilate(mask, np.ones((23, 23), np.uint8))
Y0 = 185; H = 1280 - Y0; W = int(round(H * 9 / 16)); X0 = (720 - W) // 2
cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
    '-i', src, '-map', '0:v', '-map', '1:a', '-vf', 'scale=1080:1920:flags=lanczos,unsharp=5:5:0.45',
    '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', dst], stdin=subprocess.PIPE)
while True:
    ok, f = cap.read()
    if not ok: break
    f = cv2.inpaint(f, mask, 5, cv2.INPAINT_NS)
    c = f[Y0:, X0:X0 + W].astype(np.float32)
    g = np.clip(np.linspace(0.30, 1.0, 230) ** 0.8, 0, 1)  # soft top falloff over the repaired band
    c[:230] *= g[:, None, None]
    ff.stdin.write(np.clip(c, 0, 255).astype(np.uint8).tobytes())
ff.stdin.close(); ff.wait()
print('done', W, H)
