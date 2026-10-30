import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, easeOut, prog } from "../lib/anim";
import { C, POP } from "../lib/tokens";
import { useAt } from "../edit/clock";

/**
 * 26.9–29.4 s — 0b99 reference: small centred line, a giant cropped "ghost" of the key word
 * drifting behind it, background colour changing per idea. Poppins SemiBold.
 */
export const GhostWords: React.FC<{ beats: { at: number; text: string; ghost: string; bg: "lime" | "light" | "dark" }[] }> = ({ beats }) => {
  const at = useAt();
  const f = useCurrentFrame();
  let i = 0;
  beats.forEach((b, k) => {
    if (f >= at(b.at) - 1) i = k;
  });
  const b = beats[i];
  const a = at(b.at) - 1;
  const p = prog(f, a, a + 8);
  const bg = b.bg === "lime" ? C.lime : b.bg === "dark" ? "#0A0A0A" : "#F1F1EF";
  const fg = b.bg === "dark" ? "#F4F4F2" : "#0B0B0B";
  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: interpolate(f - a, [0, 90], [-60, -160]),
          translate: "0 -50%",
          fontFamily: POP,
          fontWeight: 600,
          fontSize: Math.min(760, 3400 / b.ghost.length),
          letterSpacing: "-0.06em",
          lineHeight: 0.8,
          whiteSpace: "nowrap",
          color: fg,
          opacity: 0.07 * p,
        }}
      >
        {b.ghost}
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ overflow: "hidden", padding: "10px 20px" }}>
          <div style={{ fontFamily: POP, fontWeight: 600, fontSize: Math.min(120, 1500 / b.text.length), whiteSpace: "nowrap", letterSpacing: "-0.04em", color: fg, translate: `0 ${(1 - p) * 120}%` }}>{b.text}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** 43.2–46.2 s — stacked list: each term slides out of a mask, previous ones dim. Poppins SemiBold. */
export const StackList: React.FC<{ head: { at: number; text: string }; items: { at: number; text: string; accent?: boolean }[] }> = ({ head, items }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const hp = prog(f, at(head.at) - 1, at(head.at) + 7);
  const lastIdx = items.reduce((acc, it, k) => (f >= at(it.at) - 1 ? k : acc), -1);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A", padding: "0 96px", justifyContent: "center" }}>
      <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 64, color: "#8C8C8C", letterSpacing: "-0.03em", opacity: hp, translate: `${(1 - hp) * -40}px 0`, marginBottom: 20 }}>{head.text}</div>
      {items.map((it, k) => {
        const a = at(it.at) - 1;
        const p = prog(f, a, a + 9, easeOut);
        const dim = k < lastIdx ? 0.32 : 1;
        return (
          <div key={k} style={{ overflow: "hidden", height: 170 }}>
            <div
              style={{
                fontFamily: POP,
                fontWeight: 600,
                fontSize: 150,
                lineHeight: 1.1,
                letterSpacing: "-0.055em",
                color: it.accent ? C.lime : "#F4F4F2",
                translate: `0 ${(1 - p) * 110}%`,
                opacity: interpolate(p, [0, 0.2], [0, 1], clamp) * (k <= lastIdx ? dim : 0),
              }}
            >
              {it.text}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
