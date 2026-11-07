import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { clamp, easeOut } from "../lib/anim";
import { C, POP, H, W } from "../lib/tokens";
import { useAt } from "../edit/clock";

export type Beat = { at: number; small?: string; big: string; bg: "dark" | "light" | "lime"; accent?: boolean };

/** Dust specks of the 2a9c reference (sparse dots, re-seeded every few frames). */
const Specks: React.FC<{ dark: boolean }> = ({ dark }) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 3);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 26 }).map((_, i) => (
        <circle
          key={i}
          cx={random(`x${seed}-${i}`) * W}
          cy={random(`y${seed}-${i}`) * H}
          r={1 + random(`r${seed}-${i}`) * 2.2}
          fill={dark ? "#fff" : "#000"}
          opacity={0.25 + random(`o${seed}-${i}`) * 0.4}
        />
      ))}
    </svg>
  );
};

/**
 * Text-only b-roll — 2a9c reference: one idea per beat, background flips on each beat, tight
 * lowercase, small word stacked on the big one. Poppins SemiBold + lime per the art direction.
 */
export const WordFlash: React.FC<{ beats: Beat[] }> = ({ beats }) => {
  const at = useAt();
  const f = useCurrentFrame();
  let idx = 0;
  beats.forEach((b, i) => {
    if (f >= at(b.at) - 1) idx = i;
  });
  const b = beats[idx];
  const t0 = at(b.at) - 1;
  const p = interpolate(f, [t0, t0 + 5], [0, 1], { ...clamp, easing: easeOut });
  const dark = b.bg === "dark";
  const fg = dark ? "#F4F4F2" : "#0B0B0B";
  const bgc = b.bg === "dark" ? "#0A0A0A" : b.bg === "lime" ? C.lime : "#F1F1EF";
  const bigSize = Math.min(220, 960 / Math.max(1, b.big.length * 0.56));
  return (
    <AbsoluteFill style={{ backgroundColor: bgc, alignItems: "center", justifyContent: "center" }}>
      <Specks dark={dark} />
      <div
        style={{
          textAlign: "center",
          scale: String(0.94 + 0.06 * p + interpolate(f - t0, [0, 60], [0, 0.03], clamp)),
          opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
          filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
        }}
      >
        {b.small ? (
          <div style={{ fontFamily: POP, fontWeight: 600, fontSize: bigSize * 0.42, letterSpacing: "-0.04em", color: fg, lineHeight: 0.9 }}>{b.small}</div>
        ) : null}
        <div style={{ fontFamily: POP, fontWeight: 600, fontSize: bigSize, letterSpacing: "-0.055em", color: b.accent && dark ? C.lime : fg, lineHeight: 0.86 }}>
          {b.big}
        </div>
      </div>
    </AbsoluteFill>
  );
};
