# Per-frame mouth curves (open / round / wide) from a voice file, for procedural lip-sync.
import numpy as np, subprocess, sys, json
src, out, fps = sys.argv[1], sys.argv[2], 30
sr = 16000
raw = subprocess.run(["ffmpeg","-v","error","-i",src,"-ac","1","-ar",str(sr),"-f","s16le","-"],capture_output=True).stdout
x = np.frombuffer(raw,np.int16).astype(np.float32)/32768
hop = sr//fps; win = hop*2
n = int(len(x)/hop)
freqs = np.fft.rfftfreq(win, 1/sr)
band = lambda a,b: (freqs>=a)&(freqs<b)
lo, mid, hi = band(250,900), band(1200,2800), band(3500,7500)
op, ro, wi = [], [], []
for i in range(n):
    w = x[max(0,i*hop-hop//2):max(0,i*hop-hop//2)+win]
    if len(w)<win: w=np.pad(w,(0,win-len(w)))
    rms = np.sqrt((w**2).mean())
    S = np.abs(np.fft.rfft(w*np.hanning(win)))**2 + 1e-12
    e_lo, e_mid, e_hi = S[lo].sum(), S[mid].sum(), S[hi].sum()
    tot = e_lo+e_mid+e_hi
    voiced = e_lo/tot
    level = 20*np.log10(rms+1e-9)
    op.append((level, voiced, e_lo/(e_mid+1e-9), e_mid/(e_lo+1e-9)))
F = np.array(op); db = F[:,0]
speech = db > np.percentile(db, 25)
lo_db, hi_db = np.percentile(db[speech], 10), np.percentile(db[speech], 97)
lev = np.clip((db-lo_db)/(hi_db-lo_db), 0, 1)**1.4
lev[db < lo_db-6] = 0
# per-phrase gain: soft final phrases still need readable mouth shapes
roll = np.array([lev[max(0,i-14):i+14].max() for i in range(len(lev))])
lev = np.clip(lev/np.maximum(roll, 0.3)*0.92, 0, 1)
# syllable contrast: emphasise peaks over the local average
slow = np.convolve(lev, np.ones(7)/7, 'same')
lev = np.clip(lev*0.7 + (lev-slow)*1.2 + 0.05*(lev>0), 0, 1)
op = lev*(0.45+0.55*F[:,1])
lr = np.log(F[:,2]+1e-9); ro = np.clip((lr-np.percentile(lr,55))/ (np.percentile(lr,95)-np.percentile(lr,55)),0,1)*np.minimum(1,lev*1.5)
lw = np.log(F[:,3]+1e-9); wi = np.clip((lw-np.percentile(lw,55))/ (np.percentile(lw,95)-np.percentile(lw,55)),0,1)*np.minimum(1,lev*1.5)
def smooth(a, k=0.55):
    a=np.array(a); b=a.copy()
    for i in range(1,len(a)): b[i]=b[i-1]+(a[i]-b[i-1])*k
    for i in range(len(a)-2,-1,-1): b[i]=b[i+1]+(b[i]-b[i+1])*0.85
    return np.round(np.clip(b,0,1),3).tolist()
json.dump({"fps":fps,"open":smooth(op),"round":smooth(ro,0.4),"wide":smooth(wi,0.4)}, open(out,"w"))
print(n, "frames", "mean open %.2f"%np.mean(op))
