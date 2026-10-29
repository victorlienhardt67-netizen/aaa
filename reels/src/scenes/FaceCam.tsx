import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, easeInOut, easeOut, prog } from "../lib/anim";
import { C, H, SF, W } from "../lib/tokens";
import { useAt } from "../edit/clock";
import { DuoCutout } from "../components/Graphics";

/** Face position in the cleaned 1080×1920 face-cam (measured on the rush). */
export const FACE = { x: 540, y: 640 };

/**
 * Punch-in keyframes for the face-cam layer, in source seconds: [[t, scale], ...].
 * Hard cuts between zoom levels hide jump cuts (no easing on a cut, ease on a push).
 */
export type Zoom = { at: number; scale: number; push?: number };

export const useFaceTransform = (zooms: Zoom[]) => {
  const at = useAt();
  const f = useCurrentFrame();
  let s = 1;
  for (const z of zooms) {
    const a = at(z.at);
    if (f >= a) {
      s = z.push ? interpolate(f, [a, a + z.push], [s, z.scale], { ...clamp, easing: easeInOut }) : z.scale;
    }
  }
  return s;
};

/** Darkens the top band where the burned-in banner was repaired (keeps the eye on the face). */
export const TopShade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.88) 0px, rgba(0,0,0,0.55) 150px, rgba(0,0,0,0) 330px)" }} />
);

/** Variation — cutout popping beside the head (s1 cutaway idea, kept on top of the face-cam). */
export const PopCutout: React.FC<{ src: string; at: number; out: number; x: number; y: number; width: number; id: string }> = ({
  src,
  at: atSrc,
  out,
  x,
  y,
  width,
  id,
}) => {
  const at = useAt();
  const f = useCurrentFrame();
  const o = prog(f, at(out), at(out) + 6);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - o, filter: o ? `blur(${o * 12}px)` : undefined }}>
      <DuoCutout src={src} at={at(atSrc)} width={width} id={id} style={{ left: x, top: y, rotate: `${interpolate(f, [at(atSrc), at(atSrc) + 60], [-6, -2], clamp)}deg` }} />
    </div>
  );
};

/** Variation — thin ring + tag around the face (467e reference "being on Camera" circle). */
export const FaceRing: React.FC<{ at: number; out: number; label: string }> = ({ at: atSrc, out, label }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a = at(atSrc);
  const p = prog(f, a, a + 14, easeOut);
  const o = prog(f, at(out), at(out) + 6);
  const r = 330;
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <circle
          cx={FACE.x}
          cy={FACE.y}
          r={r + (1 - p) * 60}
          fill="none"
          stroke={C.lime}
          strokeWidth={5}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - p}
          transform={`rotate(-90 ${FACE.x} ${FACE.y})`}
          style={{ filter: "drop-shadow(0 0 10px rgba(213,255,56,0.6))" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: FACE.x + r * 0.62,
          top: FACE.y - r * 0.92,
          padding: "8px 22px 10px",
          borderRadius: 40,
          background: C.lime,
          color: "#0A0A0A",
          fontFamily: SF,
          fontWeight: 600,
          fontSize: 54,
          letterSpacing: "-0.02em",
          scale: String(prog(f, a + 8, a + 16)),
          transformOrigin: "0% 100%",
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};

/** Variation — camera-UI frame (467e reference REC corners). */
export const RecFrame: React.FC<{ at: number; out: number }> = ({ at: atSrc, out }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const p = prog(f, at(atSrc), at(atSrc) + 10);
  const o = prog(f, at(out), at(out) + 5);
  const m = 70 + (1 - p) * 40;
  const L = 90;
  const corner = (x: number, y: number, sx: number, sy: number) => (
    <path d={`M ${x} ${y + sy * L} L ${x} ${y} L ${x + sx * L} ${y}`} fill="none" stroke="#fff" strokeWidth={5} />
  );
  const blink = Math.floor(f / 15) % 2 === 0;
  return (
    <AbsoluteFill style={{ opacity: p * (1 - o) }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {corner(m, m + 90, 1, 1)}
        {corner(W - m, m + 90, -1, 1)}
        {corner(m, H - m, 1, -1)}
        {corner(W - m, H - m, -1, -1)}
      </svg>
      <div style={{ position: "absolute", left: m + 30, top: m + 120, display: "flex", alignItems: "center", gap: 14, fontFamily: SF, fontWeight: 600, fontSize: 34, color: "#fff" }}>
        <div style={{ width: 22, height: 22, borderRadius: 11, background: C.lime, opacity: blink ? 1 : 0.25 }} />
        REC
      </div>
    </AbsoluteFill>
  );
};

/** Variation — notification chips rising beside the speaker (dopamine "hits"). */
export const Chips: React.FC<{ items: { at: number; text: string }[]; out: number }> = ({ items, out }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const o = prog(f, at(out), at(out) + 6);
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      {items.map((it, i) => {
        const a = at(it.at);
        const p = prog(f, a, a + 9);
        const y = 300 + i * 140 - interpolate(f, [a, a + 90], [0, 30], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i % 2 ? 440 : 90,
              top: y,
              opacity: p,
              translate: `0 ${(1 - p) * 40}px`,
              filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 26px 16px 18px",
              borderRadius: 28,
              background: "rgba(14,14,14,0.78)",
              border: "2px solid rgba(255,255,255,0.12)",
              boxShadow: "0 14px 34px rgba(0,0,0,.45)",
              fontFamily: SF,
              fontWeight: 500,
              fontSize: 46,
              color: "#fff",
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.lime, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={30} height={30} viewBox="0 0 24 24">
                <path d="M12 20s-7-4.4-9.3-8.7C1.2 8.4 2.7 5 6 5c2 0 3.3 1.1 4 2.3h4C14.7 6.1 16 5 18 5c3.3 0 4.8 3.4 3.3 6.3C19 15.6 12 20 12 20z" fill="#0A0A0A" />
              </svg>
            </div>
            {it.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Variation — the face-cam shrinks into a card on the dark grid while a line types under it (0b82 card cutaways). */
export const shrinkCard = (f: number, a: number, b: number) => {
  const p = prog(f, a, a + 12, easeInOut);
  const q = b > 0 ? prog(f, b, b + 10, easeInOut) : 0;
  const k = p * (1 - q);
  return { k, scale: 1 - 0.3 * k, radius: 60 * k, y: -150 * k };
};

export const Moon: React.FC<{ at: number }> = ({ at: atSrc }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const p = prog(f, at(atSrc), at(atSrc) + 12);
  return (
    <div style={{ position: "absolute", right: 120, top: 210, opacity: p, scale: String(0.6 + 0.4 * p) }}>
      <svg width={120} height={120} viewBox="0 0 100 100">
        <path d="M70 12a40 40 0 1 0 18 52A32 32 0 1 1 70 12z" fill={C.lime} />
      </svg>
    </div>
  );
};

