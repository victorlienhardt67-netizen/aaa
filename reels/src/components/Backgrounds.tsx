import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, H, W } from "../lib/tokens";

/** Static film grain, regenerated every 2 frames (reference shows a light, live grain). */
const Grain: React.FC<{ opacity: number; id: string }> = ({ opacity, id }) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 50;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "overlay" }}>
      <filter id={`${id}-n`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={W} height={H} filter={`url(#${id}-n)`} />
    </svg>
  );
};

/** Grid as measured on a8d5: two verticals (25%, 91%) and three horizontals. */
const Grid: React.FC<{ color: string; xs?: number[]; ys?: number[] }> = ({
  color,
  xs = [0.25, 0.91],
  ys = [0.045, 0.5, 0.955],
}) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    {xs.map((x) => (
      <line key={`x${x}`} x1={x * W} x2={x * W} y1={0} y2={H} stroke={color} strokeWidth={2} />
    ))}
    {ys.map((y) => (
      <line key={`y${y}`} y1={y * H} y2={y * H} x1={0} x2={W} stroke={color} strokeWidth={2} />
    ))}
  </svg>
);

/** Black carbon-weave texture + vignette + grid (a8d5 dark scenes). */
export const DarkGridBg: React.FC<{ circles?: { x: number; y: number } | null; grid?: boolean; id?: string }> = ({
  circles = null,
  grid = true,
  id = "dk",
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.carbon }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#262626" />
            <stop offset="1" stopColor="#0d0d0d" />
          </linearGradient>
          <linearGradient id={`${id}-b`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f1f1f" />
            <stop offset="1" stopColor="#0a0a0a" />
          </linearGradient>
          <pattern id={`${id}-weave`} width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={7} height={7} fill={`url(#${id}-a)`} />
            <rect x={7} y={7} width={7} height={7} fill={`url(#${id}-a)`} />
            <rect x={7} width={7} height={7} fill={`url(#${id}-b)`} />
            <rect y={7} width={7} height={7} fill={`url(#${id}-b)`} />
          </pattern>
          <radialGradient id={`${id}-vig`} cx="0.5" cy="0.45" r="0.75">
            <stop offset="0.35" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.85} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${id}-weave)`} opacity={0.55} />
        {circles ? (
          <g opacity={0.22} fill="none" stroke="#fff" strokeWidth={1.5}>
            {[300, 430, 580, 760].map((r, i) => (
              <circle key={r} cx={circles.x} cy={circles.y} r={r + Math.sin((f + i * 9) / 24) * 6} />
            ))}
          </g>
        ) : null}
        <rect width={W} height={H} fill={`url(#${id}-vig)`} />
      </svg>
      {grid ? <Grid color={C.gridDark} /> : null}
      <Grain opacity={0.18} id={id} />
    </AbsoluteFill>
  );
};

/** Light grid-paper variant (a8d5 white scenes): soft grey paper, faint cells, window-light falloff. */
export const LightGridBg: React.FC<{ id?: string }> = ({ id = "lt" }) => {
  const f = useCurrentFrame();
  const cell = 120;
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id={`${id}-cells`} width={cell} height={cell} patternUnits="userSpaceOnUse">
            <path d={`M ${cell} 0 L 0 0 0 ${cell}`} fill="none" stroke={C.gridLight} strokeWidth={2} />
          </pattern>
          <radialGradient id={`${id}-vig`} cx="0.45" cy="0.4" r="0.8">
            <stop offset="0.45" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.2} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${id}-cells)`} x={interpolate(f, [0, 300], [0, -20])} />
        <rect width={W} height={H} fill={`url(#${id}-vig)`} />
      </svg>
      <Grain opacity={0.22} id={id} />
    </AbsoluteFill>
  );
};
