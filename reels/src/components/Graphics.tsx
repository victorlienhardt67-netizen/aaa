import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, easeInOut, easeOut, prog } from "../lib/anim";
import { C, H, W } from "../lib/tokens";

/**
 * Thin white sweeping curve of the a8d5 reference: drawn on from one end,
 * then keeps drifting slowly so the frame never freezes.
 */
export const Curve: React.FC<{ d: string; at: number; dur?: number; color?: string; width?: number; drift?: number; opacity?: number }> = ({
  d,
  at,
  dur = 14,
  color = "#fff",
  width = 3,
  drift = 40,
  opacity = 0.9,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + dur, easeInOut);
  const dx = interpolate(f, [at, at + 240], [0, drift], clamp);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
        opacity={opacity}
        transform={`translate(${dx} ${-dx * 0.4})`}
      />
    </svg>
  );
};

/** Accent dashed arc hugging the phone (a8d5 "highlights covers" passage). */
export const DashedArc: React.FC<{ cx: number; cy: number; r: number; from: number; to: number; at: number; dur?: number }> = ({
  cx,
  cy,
  r,
  from,
  to,
  at,
  dur = 12,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + dur);
  const a0 = (from * Math.PI) / 180;
  const a1 = ((from + (to - from) * p) * Math.PI) / 180;
  const pt = (a: number) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {p > 0 ? (
        <path d={`M ${pt(a0)} A ${r} ${r} 0 0 1 ${pt(a1)}`} fill="none" stroke={C.lime} strokeWidth={7} strokeDasharray="34 20" strokeLinecap="butt" />
      ) : null}
    </svg>
  );
};

/** Vertical connector line growing downward (a8d5 "proof | Results | Testimonials" chain). */
export const VLine: React.FC<{ x: number; y: number; len: number; at: number; dur?: number; color?: string }> = ({
  x,
  y,
  len,
  at,
  dur = 8,
  color = "#E8E8E8",
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + dur);
  return <div style={{ position: "absolute", left: x - 2, top: y, width: 4, height: len * p, background: color, borderRadius: 2 }} />;
};

/** Curved branch line (a8d5 "CONSISTENT BRANDING → same colors / same fonts"). */
export const Branch: React.FC<{ d: string; at: number; dur?: number; color?: string }> = ({ d, at, dur = 10, color = C.lime }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + dur, easeOut);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <path d={d} fill="none" stroke={color} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinecap="round" />
    </svg>
  );
};

/** Outlined label box ("Results" box of the reference: light stroke, dark glassy fill). */
export const LabelBox: React.FC<{ children: React.ReactNode; at: number; style?: React.CSSProperties; light?: boolean }> = ({
  children,
  at,
  style,
  light,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + 8);
  return (
    <div
      style={{
        display: "inline-block",
        padding: "6px 26px 10px",
        borderRadius: 18,
        border: `4px solid ${light ? "#1a1a1a" : "#E6E6E6"}`,
        background: light ? "rgba(255,255,255,0.7)" : "rgba(20,20,20,0.75)",
        opacity: p,
        scale: String(0.92 + 0.08 * p),
        boxShadow: "0 10px 30px rgba(0,0,0,.45)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Cut-out picture in the reference's duotone treatment (recoloured to the lime palette), dropped in with blur. */
export const DuoCutout: React.FC<{ src: string; width: number; at: number; style?: React.CSSProperties; id: string; duotone?: boolean }> = ({
  src,
  width,
  at,
  style,
  id,
  duotone = true,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + 10);
  return (
    <div style={{ position: "absolute", width, opacity: Math.min(1, p * 1.5), filter: `blur(${(1 - p) * 16}px)`, translate: `0 ${(1 - p) * 60}px`, ...style }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.02 0.30 0.84 0.97" />
            <feFuncG type="table" tableValues="0.03 0.38 1 1" />
            <feFuncB type="table" tableValues="0.01 0.05 0.22 0.86" />
          </feComponentTransfer>
        </filter>
      </svg>
      <Img
        src={staticFile(src)}
        style={{ width: "100%", display: "block", filter: `${duotone ? `url(#${id}) ` : ""}drop-shadow(0 26px 30px rgba(0,0,0,.5))` }}
      />
    </div>
  );
};
