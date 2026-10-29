import { FPS } from "../lib/tokens";

export type Word = { t: string; s: number; e: number };
export type Keep = { srcIn: number; srcOut: number; outFrom: number; len: number; srcInFrame: number };

/**
 * Tighten silences between words. Long pauses are cut down to a natural breath
 * (longer after punctuation) — the words themselves are never trimmed.
 */
export const computeKeeps = (
  words: Word[],
  opts: { start: number; end: number; maxGap?: number; breath?: number; sentenceBreath?: number },
): Keep[] => {
  const { start, end, maxGap = 0.3, breath = 0.18, sentenceBreath = 0.26 } = opts;
  const ws = words.filter((w) => w.s >= start && w.e <= end + 0.01);
  const ranges: [number, number][] = [];
  let open = start;
  for (let i = 0; i < ws.length - 1; i++) {
    const gap = ws[i + 1].s - ws[i].e;
    if (gap > maxGap) {
      const b = /[.,!?]$/.test(ws[i].t) ? sentenceBreath : breath;
      ranges.push([open, ws[i].e + b * 0.6]);
      open = ws[i + 1].s - b * 0.4;
    }
  }
  ranges.push([open, end]);
  let out = 0;
  return ranges.map(([a, b]) => {
    const srcInFrame = Math.round(a * FPS);
    const len = Math.round(b * FPS) - srcInFrame;
    const k = { srcIn: a, srcOut: b, outFrom: out, len, srcInFrame };
    out += len;
    return k;
  });
};

/** Source seconds → output frame (times inside a removed gap snap to the next keep). */
export const makeClock = (keeps: Keep[]) => (src: number) => {
  const sf = src * FPS;
  for (const k of keeps) {
    if (sf < k.srcInFrame) return k.outFrom;
    if (sf <= k.srcInFrame + k.len) return k.outFrom + (sf - k.srcInFrame);
  }
  const last = keeps[keeps.length - 1];
  return last.outFrom + last.len;
};
