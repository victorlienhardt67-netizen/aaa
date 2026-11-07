import { Easing, interpolate } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Curves measured on the reference: fast attack, long soft landing.
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0);

/** 0→1 progress between two frames. */
export const prog = (f: number, a: number, b: number, ease = easeOut) =>
  interpolate(f, [a, b], [0, 1], { ...clamp, easing: ease });

/** Fade + blur exit used between "pages" of the a8d5 reference (≈4–6 frames). */
export const blurOut = (f: number, at: number, dur = 6) => {
  const p = prog(f, at, at + dur, easeIn);
  return { opacity: 1 - p, filter: `blur(${p * 14}px)` };
};

/** Blur-in from out of focus, as the phone/#3 entrances of the reference. */
export const blurIn = (f: number, at: number, dur = 8, from = 18) => {
  const p = prog(f, at, at + dur);
  return { opacity: Math.min(1, p * 1.6), filter: `blur(${(1 - p) * from}px)` };
};

/**
 * Position along a move with a velocity-driven blur (fake motion blur):
 * the reference uses heavy directional blur on fast phone/grid moves.
 */
export const moveBlur = (f: number, a: number, b: number, from: number, to: number, ease = easeInOut) => {
  const v = interpolate(f, [a, b], [from, to], { ...clamp, easing: ease });
  const v2 = interpolate(f + 1, [a, b], [from, to], { ...clamp, easing: ease });
  return { v, blur: Math.min(22, Math.abs(v2 - v) * 0.35) };
};
