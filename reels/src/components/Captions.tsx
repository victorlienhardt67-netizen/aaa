import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, easeOut } from "../lib/anim";
import { C, HELV, SF } from "../lib/tokens";
import { useAt } from "../edit/clock";
import type { Word } from "../edit/cut";

export type CapSpec = { from: number; small?: string; big: string; accent?: boolean; smallBelow?: boolean };
type Tok = { text: string; s: number; big: boolean };
export type CapGroup = { start: number; end: number; toks: Tok[]; accent?: boolean; smallBelow?: boolean };

const split = (s?: string) => (s ? s.split(/\s+/).filter(Boolean) : []);

/**
 * Attach each displayed token to the spoken word's start time. Groups follow each other:
 * a group stays until the next one starts (no flicker), last one until `end`.
 */
export const buildCaptions = (words: Word[], specs: CapSpec[], end: number): CapGroup[] => {
  const groups = specs.map((sp) => {
    let i = words.findIndex((w) => w.s >= sp.from - 0.06);
    const toks: Tok[] = [];
    const push = (txt: string, big: boolean) => {
      toks.push({ text: txt, s: words[Math.min(i, words.length - 1)].s, big });
      i++;
    };
    const sm = split(sp.small);
    const bg = split(sp.big);
    if (sp.smallBelow) {
      bg.forEach((t) => push(t, true));
      sm.forEach((t) => push(t, false));
    } else {
      sm.forEach((t) => push(t, false));
      bg.forEach((t) => push(t, true));
    }
    return { start: toks[0].s, end: 0, toks, accent: sp.accent, smallBelow: sp.smallBelow };
  });
  groups.forEach((g, k) => (g.end = k < groups.length - 1 ? groups[k + 1].start : end));
  return groups;
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at - 1, at + 5], [0, 1], { ...clamp, easing: easeOut });
  return (
    <span
      style={{
        display: "inline-block",
        opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
        scale: String(1.18 - 0.18 * p),
        filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
        translate: `0 ${(1 - p) * 18}px`,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/**
 * Face-cam captions — layout/animation of the 0b82 / 467e references (big word + small companion
 * line glued to it, word-by-word blur pop, sitting on the chest). Helvetica Bold / SF Pro, lime keyword.
 */
export const Captions: React.FC<{ groups: CapGroup[]; y?: number }> = ({ groups, y = 1240 }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const g = groups.find((gr) => f >= at(gr.start) - 1 && f < at(gr.end) - 1);
  if (!g) return null;
  const bigToks = g.toks.filter((t) => t.big);
  const smallToks = g.toks.filter((t) => !t.big);
  const bigLen = bigToks.map((t) => t.text).join(" ").length;
  const bigSize = Math.min(150, 980 / Math.max(1, bigLen * 0.55));
  const smallSize = Math.max(54, Math.min(70, bigSize * 0.48));
  const shadow = "0 6px 30px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.35)";
  const smallLine = smallToks.length ? (
    <div style={{ fontFamily: SF, fontWeight: 500, fontSize: smallSize, letterSpacing: "-0.02em", color: C.white, lineHeight: 1.05, textShadow: shadow }}>
      {smallToks.map((t, i) => (
        <Pop key={i} at={at(t.s)} style={{ marginRight: "0.22em" }}>
          {t.text}
        </Pop>
      ))}
    </div>
  ) : null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", top: y, textAlign: "center" }}>
      {g.smallBelow ? null : smallLine}
      <div
        style={{
          fontFamily: HELV,
          fontWeight: 700,
          fontSize: bigSize,
          letterSpacing: "-0.03em",
          lineHeight: 0.92,
          color: g.accent ? C.lime : C.white,
          textShadow: shadow,
          marginTop: g.smallBelow ? 0 : 10,
        }}
      >
        {bigToks.map((t, i) => (
          <Pop key={i} at={at(t.s)} style={{ marginRight: i < bigToks.length - 1 ? "0.2em" : 0 }}>
            {t.text}
          </Pop>
        ))}
      </div>
      {g.smallBelow ? smallLine : null}
    </AbsoluteFill>
  );
};
