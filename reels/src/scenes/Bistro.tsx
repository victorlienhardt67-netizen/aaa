/**
 * "Bistrot Ravito" scenes — one-off art direction for this video only (user's choice, 04/11):
 * reference 082a "objects on tactile grounds" (top-down tables, cloth, cutting mat, heavy extruded
 * titles, objects that drop and land), in bistro colours (cream, bordeaux, wood) with Fraunces
 * (his menu's heavy serif), Archivo Black (extruded titles) and Caveat (the chef's handwriting).
 * Texts come from the video or from his own menu card. Times are SOURCE seconds (useAt()).
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { clamp, easeIn, easeInOut, easeOut, prog } from "../lib/anim";
import { H, SF, W } from "../lib/tokens";
import { useAt } from "../edit/clock";

export const B = {
  cream: "#F3ECDD",
  paper: "#F7F2E6",
  ink: "#1B1712",
  bordeaux: "#9E1B1E",
  vichy: "#B8322A",
  wood: "#6B4426",
  green: "#1F6A4B",
};
const SERIF = "Fraunces";
const HAND = "Caveat";
const DISPLAY = "ArchivoBlack";

/** Damped spring 0→1 with overshoot: objects that drop and land. */
const spring = (f: number, a: number, dur = 18) => {
  const t = Math.max(0, Math.min(1, (f - a) / dur));
  return f < a ? 0 : 1 - Math.exp(-6 * t) * Math.cos(9 * t);
};
const thud = (f: number, a: number, amp = 10, dur = 8) => {
  const k = 1 - prog(f, a, a + dur, easeOut);
  return f >= a && k > 0 ? `${Math.sin(f * 2.7) * amp * k}px ${Math.cos(f * 3.3) * amp * k}px` : "0px 0px";
};

/* ---------------- grounds ---------------- */

const Noise: React.FC<{ id: string; freq: string; opacity: number; blend?: React.CSSProperties["mixBlendMode"]; seed?: number; tint?: string }> = ({ id, freq, opacity, blend = "multiply", seed = 4, tint = "0.5 0.5 0.5" }) => {
  const [r, g, b] = tint.split(" ");
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity, mixBlendMode: blend }}>
      <filter id={`${id}-n`}>
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={4} seed={seed} />
        <feColorMatrix type="matrix" values={`0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 1 0`} />
      </filter>
      <rect width={W} height={H} filter={`url(#${id}-n)`} />
    </svg>
  );
};
const Grain: React.FC<{ id: string }> = ({ id }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.16, mixBlendMode: "overlay" }}>
      <filter id={`${id}-g`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 2) % 40} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={W} height={H} filter={`url(#${id}-g)`} />
    </svg>
  );
};
const Vignette: React.FC<{ k?: number }> = ({ k = 0.55 }) => <AbsoluteFill style={{ background: `radial-gradient(85% 65% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,${k}) 100%)` }} />;

/** Top-down wooden bistro table: planks + stretched grain. */
export const WoodBg: React.FC<{ id: string; tone?: string }> = ({ id, tone = B.wood }) => (
  <AbsoluteFill style={{ backgroundColor: tone }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.75, mixBlendMode: "multiply" }}>
      <filter id={`${id}-w`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.0025 0.09" numOctaves={4} seed={11} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.26  0 0 0 0 0.14  0 0 0 1.3 -0.15" />
      </filter>
      <rect width={W} height={H} filter={`url(#${id}-w)`} />
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={i} x1={0} x2={W} y1={i * 240 + 60} y2={i * 240 + 60} stroke="rgba(30,15,5,.55)" strokeWidth={4} />
      ))}
    </svg>
    <Vignette k={0.6} />
    <Grain id={id} />
  </AbsoluteFill>
);

/** Red & white gingham tablecloth with fabric weave and soft folds. */
export const VichyBg: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ backgroundColor: "#F4EFE6" }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id={`${id}-v`} width={120} height={120} patternUnits="userSpaceOnUse" patternTransform="rotate(-4)">
          <rect width={60} height={120} fill={B.vichy} opacity={0.55} />
          <rect width={120} height={60} fill={B.vichy} opacity={0.55} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-v)`} />
    </svg>
    <Noise id={`${id}-f`} freq="0.6 0.6" opacity={0.35} />
    <AbsoluteFill style={{ background: "linear-gradient(115deg, rgba(0,0,0,.0) 30%, rgba(0,0,0,.12) 42%, rgba(255,255,255,.08) 48%, rgba(0,0,0,0) 60%)" }} />
    <Vignette k={0.5} />
    <Grain id={id} />
  </AbsoluteFill>
);

/** 082a green cutting mat: fine grid, bold grid, ruler ticks. */
export const MatBg: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ backgroundColor: B.green }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id={`${id}-s`} width={36} height={36} patternUnits="userSpaceOnUse">
          <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth={1.5} />
        </pattern>
        <pattern id={`${id}-b`} width={180} height={180} patternUnits="userSpaceOnUse">
          <path d="M 180 0 L 0 0 0 180" fill="none" stroke="rgba(255,255,255,.32)" strokeWidth={3} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-s)`} />
      <rect width={W} height={H} fill={`url(#${id}-b)`} />
      {Array.from({ length: 31 }).map((_, i) => (
        <g key={i}>
          <line x1={i * 36} x2={i * 36} y1={0} y2={i % 5 ? 18 : 36} stroke="rgba(255,255,255,.5)" strokeWidth={2} />
          {i % 5 === 0 ? <text x={i * 36 + 4} y={56} fill="rgba(255,255,255,.55)" fontFamily={SF} fontSize={20}>{i}</text> : null}
        </g>
      ))}
    </svg>
    <Noise id={`${id}-m`} freq="0.012" opacity={0.25} />
    <Vignette k={0.5} />
    <Grain id={id} />
  </AbsoluteFill>
);

/** Grey-white marble bar counter. */
export const MarbleBg: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ backgroundColor: "#E7E4DF" }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.55, mixBlendMode: "multiply" }}>
      <filter id={`${id}-mb`}>
        <feTurbulence type="turbulence" baseFrequency="0.004 0.012" numOctaves={5} seed={21} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.44  0 0 0 0 0.43  -2.4 0 0 0 1.25" />
      </filter>
      <rect width={W} height={H} filter={`url(#${id}-mb)`} />
    </svg>
    <Vignette k={0.35} />
    <Grain id={id} />
  </AbsoluteFill>
);

/** Brushed steel (kitchen pass). */
export const SteelBg: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg,#2b2d2f,#17191a)" }}>
    <Noise id={`${id}-st`} freq="0.002 0.6" opacity={0.5} blend="overlay" tint="0.8 0.8 0.8" />
    <Vignette k={0.6} />
    <Grain id={id} />
  </AbsoluteFill>
);

/* ---------------- shared pieces ---------------- */

/** 082a heavy title: cream face, stacked bordeaux extrusion, hard drop shadow. Slams in. */
export const Extruded: React.FC<{ text: string; at: number; x: number; y: number; size: number; face?: string; side?: string; rotate?: number }> = ({ text, at, x, y, size, face = B.cream, side = B.bordeaux, rotate = -3 }) => {
  const f = useCurrentFrame();
  const p = spring(f, at, 14);
  if (f < at) return null;
  const depth = Math.round(size * 0.09);
  const sh = Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${side}`).join(",");
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0", rotate: `${rotate}deg`, scale: String(0.4 + 0.6 * p), opacity: Math.min(1, p * 3), whiteSpace: "nowrap" }}>
      <span style={{ fontFamily: DISPLAY, fontSize: size, lineHeight: 0.95, letterSpacing: "-0.02em", color: face, textShadow: `${sh}, ${depth + 6}px ${depth + 10}px 18px rgba(0,0,0,.45)` }}>{text}</span>
    </div>
  );
};

const Paper: React.FC<{ w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode; tone?: string }> = ({ w, h, style, children, tone = B.paper }) => (
  <div style={{ position: "absolute", width: w, height: h, background: tone, boxShadow: "0 30px 50px rgba(0,0,0,.35), 0 4px 8px rgba(0,0,0,.2)", overflow: "hidden", ...style }}>
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "multiply" }}>
      <filter id={`pp${w}${h}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={3} seed={9} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0.6 0" />
      </filter>
      <rect width={w} height={h} filter={`url(#pp${w}${h})`} />
    </svg>
    {children}
  </div>
);

/** Handwritten stroke (strike, circle, underline, arrow) drawn on like a pen. */
const Pen: React.FC<{ d: string; at: number; dur?: number; color?: string; width?: number }> = ({ d, at, dur = 9, color = B.bordeaux, width = 9 }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + dur, easeInOut);
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />;
};

/** Handwriting appearing left to right (clip reveal). */
const Hand: React.FC<{ text: string; at: number; x: number; y: number; size: number; color?: string; rotate?: number; dur?: number; align?: "left" | "center" }> = ({ text, at, x, y, size, color = B.bordeaux, rotate = -4, dur = 10, align = "left" }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + dur, easeOut);
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: align === "center" ? "-50% 0" : "0 0", rotate: `${rotate}deg`, clipPath: `inset(-20% ${(1 - p) * 100}% -20% 0)`, fontFamily: HAND, fontWeight: 700, fontSize: size, color, whiteSpace: "nowrap", lineHeight: 1 }}>
      {text}
    </div>
  );
};

/* ---------------- M1 · calendar: "le 3 octobre, j'ouvre enfin mon restaurant" ---------------- */

export const BcCalendar: React.FC<{ dropAt: number; tearAt: number; l1: { at: number; text: string }; l2: { at: number; text: string } }> = ({ dropAt, tearAt, l1, l2 }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const d = spring(f, at(dropAt) - 6, 16);
  const tear = prog(f, at(tearAt), at(tearAt) + 12, easeIn);
  const cw = 560;
  const ch = 640;
  const cx = (W - cw) / 2;
  const cy = 820;
  const page = (n: string, style: React.CSSProperties) => (
    <Paper w={cw} h={ch} style={{ left: 0, top: 0, ...style }}>
      <div style={{ height: 150, background: B.bordeaux, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 92, color: B.cream, letterSpacing: "0.04em" }}>OCTOBRE</div>
      <div style={{ textAlign: "center", fontFamily: SERIF, fontWeight: 900, fontSize: 380, lineHeight: 1.1, color: B.ink }}>{n}</div>
    </Paper>
  );
  return (
    <AbsoluteFill style={{ translate: thud(f, at(dropAt) + 4, 9) }}>
      <WoodBg id="cal" />
      <div style={{ position: "absolute", left: cx, top: cy, width: cw, height: ch, translate: `0 ${(1 - d) * -1500}px`, rotate: `${-4 + (1 - d) * 10}deg` }}>
        {page("3", {})}
        {tear < 1 ? page("2", { transformOrigin: "0% 0%", rotate: `${tear * -38}deg`, translate: `${tear * -500}px ${tear * 900}px`, opacity: 1 - tear * 0.4 }) : null}
        {[150, 410].map((x) => (
          <div key={x} style={{ position: "absolute", left: x - 22, top: -36, width: 44, height: 72, borderRadius: 22, border: "10px solid #9aa0a6", background: "transparent", boxShadow: "0 4px 6px rgba(0,0,0,.4)" }} />
        ))}
      </div>
      <Extruded text={l1.text} at={at(l1.at) - 1} x={540} y={250} size={108} />
      <Extruded text={l2.text} at={at(l2.at) - 1} x={540} y={400} size={86} rotate={2} face={B.bordeaux} side="#3a0b0c" />
    </AbsoluteFill>
  );
};

/* ---------------- M2 · gingham: struck menu, then the plate lands ---------------- */

export const BcPlate: React.FC<{
  lead: { at: number; text: string };
  strikes: { at: number; text: string }[];
  resist: { at: number; text: string };
  plateAt: number;
  gels: { at: number; small: string; big: string; bigAt: number };
}> = ({ lead, strikes, resist, plateAt, gels }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const inC = spring(f, at(lead.at) - 4, 16);
  const outC = prog(f, at(plateAt) - 4, at(plateAt) + 8, easeIn);
  const pd = spring(f, at(plateAt), 16);
  const cardW = 760;
  const cardH = 920;
  return (
    <AbsoluteFill style={{ translate: thud(f, at(plateAt) + 5, 12) }}>
      <VichyBg id="vichy" />
      {outC < 1 ? (
        <div style={{ position: "absolute", left: (W - cardW) / 2, top: 500, width: cardW, height: cardH, translate: `0 ${(1 - inC) * 1400 - outC * 1700}px`, rotate: `${-3 + outC * -12}deg` }}>
          <Paper w={cardW} h={cardH}>
            <div style={{ position: "absolute", top: 50, width: "100%", textAlign: "center", fontFamily: SF, fontWeight: 600, fontSize: 30, letterSpacing: "0.3em", color: B.bordeaux }}>LA CARTE</div>
            <div style={{ position: "absolute", top: 96, left: 120, right: 120, height: 3, background: B.bordeaux, opacity: 0.6 }} />
            {strikes.map((s, i) => (
              <div key={i} style={{ position: "absolute", top: 170 + i * 190, width: "100%", textAlign: "center", fontFamily: SERIF, fontWeight: 900, fontSize: 104, color: B.ink, opacity: prog(f, at(lead.at) + i * 3, at(lead.at) + 8 + i * 3) }}>
                {s.text}
              </div>
            ))}
            <div style={{ position: "absolute", top: 600, width: "100%", textAlign: "center", fontFamily: SERIF, fontWeight: 900, fontSize: 70, color: B.bordeaux, opacity: prog(f, at(resist.at) - 2, at(resist.at) + 6) }}>{resist.text}</div>
            <svg width={cardW} height={cardH} style={{ position: "absolute", inset: 0 }}>
              <Pen d="M 140 240 C 260 220, 480 260, 630 225" at={at(strikes[0].at)} />
              <Pen d="M 150 252 C 300 268, 470 236, 620 250" at={at(strikes[0].at) + 5} width={6} />
              <Pen d="M 160 430 C 300 410, 470 450, 610 418" at={at(strikes[1].at)} />
              <Pen d="M 165 442 C 320 458, 470 428, 600 444" at={at(strikes[1].at) + 5} width={6} />
              <Pen d="M 95 640 C 90 560, 690 560, 690 640 C 690 720, 90 730, 110 625" at={at(resist.at) + 4} dur={14} width={7} />
            </svg>
          </Paper>
          <Hand text={lead.text} at={at(lead.at)} x={-30} y={-110} size={110} color={B.ink} rotate={-6} />
        </div>
      ) : null}
      {f >= at(plateAt) - 2 ? (
        <div style={{ position: "absolute", left: 40, top: 640, width: 1000, translate: `0 ${(1 - Math.min(1, pd)) * -60}px`, scale: String(1.35 - 0.35 * Math.min(1.05, pd)), opacity: Math.min(1, pd * 4), filter: "drop-shadow(0 40px 40px rgba(0,0,0,.45))" }}>
          <Img src={staticFile("img/ravito_plate.png")} style={{ width: "100%" }} />
        </div>
      ) : null}
      <Extruded text={gels.small} at={at(gels.at) - 1} x={540} y={230} size={110} />
      <Extruded text={gels.big} at={at(gels.bigAt) - 1} x={540} y={370} size={94} face={B.bordeaux} side="#3a0b0c" rotate={2} />
    </AbsoluteFill>
  );
};

/* ---------------- M3 · cutting mat: DMs pile up, then the "OUVERT" sign drops ---------------- */

export const BcDM: React.FC<{ head: { at: number; text: string }; bubble: string; from: number; to: number; open: { at: number; text: string; small: string } }> = ({ head, bubble, from, to, open }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const n = 9;
  const sweep = prog(f, at(open.at) - 6, at(open.at) + 6, easeIn);
  const sd = spring(f, at(open.at), 26);
  const swing = f > at(open.at) ? Math.sin((f - at(open.at)) / 5) * 14 * Math.exp(-(f - at(open.at)) / 22) : 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <MatBg id="mat" />
      <Hand text={head.text} at={at(head.at)} x={540} y={140} size={92} color={B.cream} rotate={-3} align="center" />
      {Array.from({ length: n }).map((_, i) => {
        const a = interpolate(i, [0, n - 1], [at(from), at(to)]);
        const p = spring(f, a, 12);
        if (f < a) return null;
        const x = 140 + random(`bx${i}`) * 420;
        const y = 420 + random(`by${i}`) * 1000;
        const r = (random(`br${i}`) - 0.5) * 24;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, rotate: `${r}deg`, scale: String(1.5 - 0.5 * p), opacity: Math.min(1, p * 3), translate: `${sweep * (900 + i * 60)}px ${sweep * -100}px` }}>
            <div style={{ padding: "26px 34px", borderRadius: 34, borderBottomLeftRadius: 8, background: "#FBFBF8", boxShadow: "0 14px 24px rgba(0,0,0,.35)", fontFamily: SF, fontWeight: 600, fontSize: 44, color: B.ink, whiteSpace: "nowrap" }}>
              {bubble}
            </div>
          </div>
        );
      })}
      {f >= at(open.at) - 1 ? (
        <div style={{ position: "absolute", left: 540, top: 0, translate: `-50% ${(1 - Math.min(1, sd)) * -900}px`, rotate: `${swing}deg`, transformOrigin: "50% 0" }}>
          <svg width={600} height={560} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path d="M 300 0 L 300 330 M 300 330 L 120 520 M 300 330 L 480 520" stroke="#2b2b2b" strokeWidth={6} fill="none" />
            <circle cx={300} cy={330} r={14} fill="#888" />
          </svg>
          <div style={{ position: "relative", top: 500, left: -50, width: 700, padding: "40px 0 46px", background: B.cream, border: `14px solid ${B.bordeaux}`, borderRadius: 26, textAlign: "center", boxShadow: "0 40px 60px rgba(0,0,0,.5)" }}>
            <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 64, color: B.bordeaux, lineHeight: 1 }}>{open.small}</div>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 150, color: B.ink, lineHeight: 1 }}>{open.text}</div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------------- M4 · his menu card on the table, items circled as he names them ---------------- */

export const BcMenu: React.FC<{
  inAt: number;
  note: { at: number; text: string };
  items: { at: number; name: string; desc: string }[];
  tasteAt: number;
}> = ({ inAt, note, items, tasteAt }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const d = spring(f, at(inAt) - 4, 18);
  const cw = 960;
  const tilt = interpolate(f, [at(items[0].at) - 18, at(items[0].at)], [0, -380], { ...clamp, easing: easeInOut });
  const colX = [40, 340, 640];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <WoodBg id="menuwood" tone="#5A3820" />
      <div style={{ position: "absolute", left: (W - cw) / 2, top: 260 + tilt, width: cw, height: 1800, translate: `0 ${(1 - d) * 1800}px`, rotate: "1.5deg", scale: String(1 + 0.1 * (-tilt / 380)), transformOrigin: "50% 0" }}>
        <Paper w={cw} h={1800} tone={B.cream}>
          <div style={{ position: "absolute", top: 50, left: 30, right: 30, height: 3, background: B.bordeaux }} />
          <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center", fontFamily: SF, fontWeight: 600, fontSize: 30, letterSpacing: "0.25em", color: B.bordeaux }}>PARIS · 3 OCTOBRE · ANNETTE K</div>
          <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: SERIF, fontWeight: 900, fontStyle: "italic", fontSize: 54, color: B.ink }}>Le</div>
          <div style={{ position: "absolute", top: 200, width: "100%", textAlign: "center", fontFamily: SERIF, fontWeight: 900, fontSize: 132, color: B.ink, letterSpacing: "-0.02em" }}>Bistrot Ravito</div>
          <div style={{ position: "absolute", top: 370, width: "100%", textAlign: "center", fontFamily: SF, fontStyle: "italic", fontSize: 36, color: "#4a4038" }}>Entre deux tests chaussures, passez à table.</div>
          <div style={{ position: "absolute", top: 470, left: 30, right: 30, height: 3, background: B.bordeaux, opacity: 0.7 }} />
          <div style={{ position: "absolute", top: 450, left: "50%", translate: "-50% 0", padding: "0 20px", background: B.cream, fontFamily: SF, fontWeight: 600, fontSize: 28, letterSpacing: "0.25em", color: B.bordeaux }}>LE PLAT SIGNATURE</div>
          <div style={{ position: "absolute", top: 520, width: "100%", textAlign: "center", fontFamily: SERIF, fontWeight: 900, fontSize: 120, color: B.ink }}>Les gels</div>
          {items.map((it, i) => (
            <div key={i} style={{ position: "absolute", top: 720, left: colX[i], width: 280, textAlign: "center" }}>
              <div style={{ fontFamily: SF, fontWeight: 700, fontSize: 46, color: B.ink }}>{it.name}</div>
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 30, color: "#5a5048", marginTop: 8, lineHeight: 1.2 }}>{it.desc}</div>
            </div>
          ))}
          <svg width={cw} height={1800} style={{ position: "absolute", inset: 0 }}>
            {items.map((it, i) => {
              const cx = colX[i] + 140;
              return <Pen key={i} d={`M ${cx - 20} 708 C ${cx + 150} 690, ${cx + 160} 880, ${cx} 885 C ${cx - 170} 890, ${cx - 160} 700, ${cx + 30} 712`} at={at(it.at) - 1} dur={10} width={8} />;
            })}
            <Pen d="M 140 920 C 330 900, 640 940, 830 905" at={at(tasteAt)} dur={12} width={10} />
          </svg>
        </Paper>
      </div>
      <div style={{ opacity: 1 + tilt / 120 }}>
        <Hand text={note.text} at={at(note.at)} x={620} y={140} size={84} color={B.cream} rotate={-8} align="center" />
      </div>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: tilt < -50 ? 0 : 1 }}>
        <Pen d="M 640 250 C 700 330, 680 420, 600 470" at={at(note.at) + 8} dur={8} color={B.cream} width={7} />
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- M5 · marble bar: wine list + polaroid of his glass ---------------- */

export const BcDrinks: React.FC<{ inAt: number; head: { at: number; text: string }; lines: { at: number; text: string }[]; photoAt: number; photoCaption: string }> = ({ inAt, head, lines, photoAt, photoCaption }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const d = spring(f, at(inAt) - 4, 18);
  const ph = spring(f, at(photoAt), 18);
  return (
    <AbsoluteFill>
      <MarbleBg id="bar" />
      <div style={{ position: "absolute", left: 80, top: 360, width: 600, height: 1000, translate: `${(1 - d) * -900}px 0`, rotate: "-2deg" }}>
        <Paper w={600} h={1000} tone={B.bordeaux}>
          <div style={{ position: "absolute", inset: 22, border: `3px solid ${B.cream}`, opacity: 0.6 }} />
          <div style={{ position: "absolute", top: 80, width: "100%", textAlign: "center", fontFamily: SF, fontWeight: 600, fontSize: 28, letterSpacing: "0.3em", color: B.cream, opacity: 0.85 }}>{head.text.toUpperCase()}</div>
          <div style={{ position: "absolute", top: 130, width: "100%", textAlign: "center", fontFamily: SERIF, fontWeight: 900, fontSize: 92, color: B.cream, opacity: prog(f, at(head.at) - 1, at(head.at) + 8) }}>Boissons</div>
          {lines.map((l, i) => (
            <Hand key={i} text={l.text} at={at(l.at) - 1} x={300} y={380 + i * 210} size={92} color={B.cream} rotate={-3} align="center" />
          ))}
        </Paper>
      </div>
      <div style={{ position: "absolute", left: 600, top: 1060, translate: `${(1 - Math.min(1, ph)) * 700}px ${(1 - Math.min(1, ph)) * -300}px`, rotate: `${8 - 4 * Math.min(1, ph)}deg`, opacity: f >= at(photoAt) ? 1 : 0 }}>
        <div style={{ width: 420, padding: "22px 22px 100px", background: "#FBFBF7", boxShadow: "0 30px 50px rgba(0,0,0,.4)" }}>
          <Img src={staticFile("img/ravito_glass_photo.jpg")} style={{ width: "100%", display: "block" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 24, textAlign: "center", fontFamily: HAND, fontWeight: 700, fontSize: 58, color: B.ink }}>{photoCaption}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- M6 · kitchen ticket rail: the menus by discipline ---------------- */

export const BcTickets: React.FC<{ head: { at: number; small: string; big: string; bigAt: number }; tickets: { at: number; title: string; lines: string; mark?: boolean }[] }> = ({ head, tickets }) => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <SteelBg id="pass" />
      <Hand text={head.small} at={at(head.at)} x={540} y={170} size={80} color={B.cream} align="center" rotate={-2} />
      <Extruded text={head.big} at={at(head.bigAt) - 1} x={540} y={270} size={110} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, height: 46, background: "linear-gradient(180deg,#d8dadc,#7d8185 60%,#55595c)", boxShadow: "0 12px 20px rgba(0,0,0,.6)" }} />
      {tickets.map((t, i) => {
        const p = spring(f, at(t.at) - 2, 16);
        if (f < at(t.at) - 2) return null;
        const x = 60 + i * 330;
        const sw = Math.sin((f - at(t.at)) / 4) * 6 * Math.exp(-(f - at(t.at)) / 14);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 580, translate: `${(1 - Math.min(1, p)) * 900}px 0`, rotate: `${sw + (i - 1) * 2}deg`, transformOrigin: "50% 0" }}>
            <Paper w={300} h={760} tone="#FCFBF6" style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 40, background: "repeating-linear-gradient(90deg,#FCFBF6 0 10px,#e6e2d8 10px 12px)" }} />
              <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: SF, fontWeight: 600, fontSize: 24, letterSpacing: "0.2em", color: "#777" }}>COMMANDE</div>
              <div style={{ position: "absolute", top: 120, left: 20, right: 20, textAlign: "center", fontFamily: SERIF, fontWeight: 900, fontSize: t.title.length > 8 ? 54 : 74, lineHeight: 1.05, color: B.ink }}>{t.title}</div>
              <div style={{ position: "absolute", top: 380, left: 26, right: 26, borderTop: "3px dashed #bbb", paddingTop: 22, fontFamily: SF, fontSize: 30, lineHeight: 1.45, color: "#333" }}>
                {t.lines.split(" · ").map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
              {t.mark ? (
                <svg width={300} height={760} style={{ position: "absolute", inset: 0 }}>
                  <Pen d="M 40 300 L 120 350 L 260 230" at={at(t.at) + 6} dur={7} width={12} />
                </svg>
              ) : null}
            </Paper>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------- M7 · the bill on a saucer: total 0 €, stamped ---------------- */

export const BcBill: React.FC<{ q: { at: number; text: string }; stampAt: number; stamp: string; tail: { at: number; text: string } }> = ({ q, stampAt, stamp, tail }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const unfold = prog(f, at(q.at), at(q.at) + 14, easeOut);
  const st = spring(f, at(stampAt) - 1, 10);
  return (
    <AbsoluteFill style={{ translate: thud(f, at(stampAt) + 2, 14) }}>
      <VichyBg id="bill" />
      <div style={{ position: "absolute", left: 540, top: 1000, width: 860, height: 860, translate: "-50% -50%", borderRadius: "50%", background: "radial-gradient(circle at 45% 40%, #ffffff 0%, #f1efe9 55%, #d9d5cc 70%, #f7f5f0 74%, #cfcac0 100%)", boxShadow: "0 40px 60px rgba(0,0,0,.35)" }} />
      <div style={{ position: "absolute", left: 540, top: 1000, width: 600, translate: "-50% -50%", rotate: "-6deg", transformOrigin: "50% 0" }}>
        <Paper w={600} h={940} tone="#FCFBF6" style={{ position: "relative", scale: `1 ${0.15 + 0.85 * unfold}`, transformOrigin: "50% 0" }}>
          <div style={{ position: "absolute", top: 60, width: "100%", textAlign: "center", fontFamily: SERIF, fontWeight: 900, fontSize: 84, color: B.ink }}>L'addition</div>
          <div style={{ position: "absolute", top: 170, width: "100%", textAlign: "center", fontFamily: SF, fontSize: 28, letterSpacing: "0.2em", color: "#888" }}>BISTROT RAVITO</div>
          {["Gels", "Gummies", "Compotes", "Boissons iso"].map((l, i) => (
            <div key={l} style={{ position: "absolute", top: 270 + i * 80, left: 60, right: 60, display: "flex", justifyContent: "space-between", fontFamily: SF, fontSize: 40, color: "#333", borderBottom: "2px dotted #ccc", paddingBottom: 8 }}>
              <span>{l}</span>
              <span>0,00 €</span>
            </div>
          ))}
          <div style={{ position: "absolute", top: 660, left: 60, right: 60, display: "flex", justifyContent: "space-between", fontFamily: SERIF, fontWeight: 900, fontSize: 70, color: B.ink }}>
            <span>Total</span>
            <span>0 €</span>
          </div>
        </Paper>
      </div>
      {f >= at(stampAt) - 1 ? (
        <div style={{ position: "absolute", left: 600, top: 1180, translate: "-50% -50%", rotate: "-14deg", scale: String(2.2 - 1.2 * Math.min(1, st)), opacity: Math.min(1, st * 2), padding: "18px 44px", border: `10px solid ${B.bordeaux}`, borderRadius: 24, fontFamily: DISPLAY, fontSize: 112, color: B.bordeaux, mixBlendMode: "multiply", letterSpacing: "0.04em" }}>
          {stamp}
        </div>
      ) : null}
      <Hand text={q.text} at={at(q.at) - 4} x={540} y={170} size={96} color={B.ink} align="center" rotate={-3} />
      <Hand text={tail.text} at={at(tail.at) - 1} x={540} y={1640} size={78} color={B.ink} align="center" rotate={-2} />
    </AbsoluteFill>
  );
};

/* ---------------- M8 · tent card "Réservé" flips to the call to action ---------------- */

export const BcReserve: React.FC<{ head: { at: number; text: string }; flipAt: number; front: string; back: { small: string; big: string } }> = ({ head, flipAt, front, back }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const d = spring(f, a0 - 2, 16);
  const flip = interpolate(f, [at(flipAt), at(flipAt) + 14], [0, 180], { ...clamp, easing: easeInOut });
  const showBack = flip > 90;
  const end = prog(f, at(flipAt) + 60, at(flipAt) + 80);
  return (
    <AbsoluteFill style={{ perspective: 1800 }}>
      <WoodBg id="resa" tone="#714829" />
      <Hand text={head.text} at={a0} x={540} y={250} size={100} color={B.cream} align="center" rotate={-3} />
      <div style={{ position: "absolute", left: 540, top: 1350, width: 760, height: 640, translate: `-50% -100%`, scale: String(0.6 + 0.4 * Math.min(1.04, d)), opacity: Math.min(1, d * 3) }}>
        <div style={{ position: "absolute", left: 40, right: 40, bottom: -40, height: 70, borderRadius: "50%", background: "rgba(0,0,0,.45)", filter: "blur(18px)" }} />
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", rotate: `y ${flip}deg` }}>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", background: B.cream, border: `14px solid ${B.ink}`, borderRadius: 18, display: showBack ? "none" : "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 -60px 80px rgba(0,0,0,.12)" }}>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 150, color: B.ink, letterSpacing: "0.02em" }}>{front}</div>
          </div>
          <div style={{ position: "absolute", inset: 0, rotate: "y 180deg", backfaceVisibility: "hidden", background: B.bordeaux, borderRadius: 18, display: showBack ? "flex" : "none", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 -60px 80px rgba(0,0,0,.2)" }}>
            <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 92, color: B.cream, lineHeight: 1 }}>{back.small}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 168, color: B.cream, lineHeight: 1.05, letterSpacing: "0.02em" }}>{back.big}</div>
          </div>
        </div>
      </div>
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: end * 0 }} />
    </AbsoluteFill>
  );
};

/* ---------------- opening: a striped bistro awning over the face-cam top ---------------- */

export const Awning: React.FC<{ until?: number }> = () => {
  const f = useCurrentFrame();
  const d = spring(f, 0, 16);
  const sway = Math.sin(f / 9) * 0.6;
  const n = 12;
  const sw = W / n;
  const depth = 560;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: depth + 70, translate: `0 ${(1 - Math.min(1, d)) * -(depth + 80)}px`, rotate: `${sway}deg`, transformOrigin: "50% 0", filter: "drop-shadow(0 26px 22px rgba(0,0,0,.45))" }}>
        <svg width={W} height={depth + 70}>
          <defs>
            <linearGradient id="awn-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity={0.35} />
              <stop offset="0.25" stopColor="#000" stopOpacity={0} />
              <stop offset="0.9" stopColor="#fff" stopOpacity={0.08} />
              <stop offset="1" stopColor="#000" stopOpacity={0.25} />
            </linearGradient>
            <clipPath id="awn-clip">
              <path d={`M 0 0 H ${W} V ${depth} ${Array.from({ length: n }, (_, i) => `A ${sw / 2} ${sw / 2} 0 0 1 ${W - (i + 1) * sw} ${depth}`).join(" ")} Z`} />
            </clipPath>
          </defs>
          <g clipPath="url(#awn-clip)">
            {Array.from({ length: n }).map((_, i) => (
              <rect key={i} x={i * sw} y={0} width={sw} height={depth + 70} fill={i % 2 ? B.cream : B.vichy} />
            ))}
            <rect width={W} height={depth + 70} fill="url(#awn-shade)" />
          </g>
          <rect x={0} y={0} width={W} height={18} fill="#3b2a1e" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
