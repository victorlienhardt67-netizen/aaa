import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, easeOut } from "../lib/anim";

/**
 * Letter-by-letter build of the a8d5 reference ("highli|ghts", "LAS|T", "Testimonial|s"):
 * ~1 letter per frame, each letter lands from lower-right, oversized and defocused,
 * and settles in ~5 frames. The leading letter is therefore always slightly blurred.
 */
export const TypeText: React.FC<{
  text: string;
  at: number; // local frame where the first letter starts
  rate?: number; // frames per letter
  settle?: number; // frames for one letter to land
  style?: React.CSSProperties;
  letterStyle?: React.CSSProperties;
  out?: number; // local frame where the word blurs out (optional)
}> = ({ text, at, rate = 1, settle = 6, style, letterStyle, out }) => {
  const f = useCurrentFrame();
  const chars = Array.from(text);
  const outP = out === undefined ? 0 : interpolate(f, [out, out + 6], [0, 1], clamp);
  return (
    <span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        opacity: 1 - outP,
        filter: outP > 0 ? `blur(${outP * 12}px)` : undefined,
        ...style,
      }}
    >
      {chars.map((ch, i) => {
        const p = interpolate(f, [at + i * rate, at + i * rate + settle], [0, 1], { ...clamp, easing: easeOut });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: interpolate(p, [0, 0.35], [0, 1], clamp),
              translate: `${(1 - p) * 0.28}em ${(1 - p) * 0.32}em`,
              scale: String(1 + (1 - p) * 0.45),
              filter: p < 1 ? `blur(${(1 - p) * 9}px)` : undefined,
              transformOrigin: "0% 100%",
              // headroom so accents (É, Ê) are inside the gradient-clipped box
              padding: "0.22em 0.04em 0.12em",
              margin: "-0.22em -0.04em -0.12em",
              ...letterStyle,
            }}
          >
            {ch === " " ? " " : ch}
          </span>
        );
      })}
    </span>
  );
};
