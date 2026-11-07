/**
 * Object-driven scenes first used on Robin 07 ("Marina, cinq ans plus tard"). Same rules as
 * Objects.tsx: a real cut-out (neutral tones + one lime detail) that MOVES carries each scene,
 * and every procedure here is new to the series (tilt-up reveal, flip, loupe, squeeze, lights out).
 * Times are SOURCE seconds (useAt()).
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { clamp, easeIn, easeInOut, easeOut, prog } from "../lib/anim";
import { C, H, POP, W } from "../lib/tokens";
import { useAt } from "../edit/clock";
import { Txt } from "../components/Txt";
import { BlockTitle, ConcreteBg, PaperBg } from "./Objects";

type Head = { at: number; small: string; big: string; bigAt: number };

// tower_marina.png geometry (fractions of the cut-out): where the lit penthouse floor sits
const TOWER = { src: "img/tower_marina.png", ratio: 0.479, phY: 0.05 };
// loupe.png geometry: lens centre and radius as fractions of the image width/height (glass punched out)
const LOUPE = { src: "img/loupe.png", cx: 0.4985, cy: 0.348, r: 0.441, ratio: 678 / 991 };

const Grain: React.FC<{ id: string; opacity?: number }> = ({ id, opacity = 0.2 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "overlay" }}>
      <filter id={`${id}-g`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 2) % 40} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={W} height={H} filter={`url(#${id}-g)`} />
    </svg>
  );
};

/** Dusk / night sky with a low haze, for the tower scenes. */
const SkyBg: React.FC<{ id: string; night?: boolean }> = ({ id, night }) => (
  <AbsoluteFill style={{ background: night ? "linear-gradient(180deg,#03060a 0%,#0b1218 55%,#1a2226 100%)" : "linear-gradient(180deg,#0b1318 0%,#1f2c33 50%,#4a4a42 100%)" }}>
    <AbsoluteFill style={{ background: "radial-gradient(90% 40% at 50% 100%, rgba(255,255,255,.12), rgba(0,0,0,0))" }} />
    <Grain id={id} opacity={0.22} />
  </AbsoluteFill>
);

const Glow: React.FC<{ x: number; y: number; r: number; k: number }> = ({ x, y, r, k }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(213,255,56,${0.75 * k}), rgba(213,255,56,0))`, mixBlendMode: "screen" }} />
);

/* ---------------- 1. tilt-up along the tower to the penthouse ---------------- */

export const MdTiltUp: React.FC<{ head: Head; place: { at: number; text: string }; tag: { at: number; text: string } }> = ({ head, place, tag }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const th = 2600; // displayed tower height
  const tw = th * TOWER.ratio;
  // camera travels from the base to the top, arriving on "penthouse"
  const t = interpolate(f, [at(head.at), at(head.bigAt)], [0, 1], { ...clamp, easing: easeInOut });
  const t2 = interpolate(f + 1, [at(head.at), at(head.bigAt)], [0, 1], { ...clamp, easing: easeInOut });
  const top = interpolate(t, [0, 1], [H - th + 80, 380]) - interpolate(f, [at(head.bigAt), at(head.bigAt) + 90], [0, 40], clamp);
  const blur = Math.min(18, Math.abs(t2 - t) * th * 0.06);
  const lit = prog(f, at(head.bigAt) - 2, at(head.bigAt) + 10);
  const phY = top + th * TOWER.phY;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <SkyBg id="tilt" />
      <div style={{ position: "absolute", left: W / 2 - tw / 2, top, width: tw, height: th, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
        <Img src={staticFile(TOWER.src)} style={{ width: "100%", height: "100%" }} />
      </div>
      <Glow x={W / 2} y={phY} r={420} k={lit * (0.8 + 0.2 * Math.sin(f / 6))} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.75) 100%)" }} />
      <Txt text={head.small} role="sec" size={66} x={540} y={1330} align="center" at={at(head.at)} />
      <Txt text={head.big} role="strongLime" size={176} x={540} y={1400} align="center" at={at(head.bigAt) - 1} />
      <Txt text={place.text} role="caps" size={84} x={540} y={1620} align="center" at={at(place.at) - 1} />
      <BlockTitle text={tag.text} at={at(tag.at) - 1} x={830} y={phY + 60} size={58} tone="lime" rotate={-4} />
    </AbsoluteFill>
  );
};

/* ---------------- 2. hourglass flip: two halves of the year ---------------- */

export const MdHourglass: React.FC<{ head: Head; a: { at: number; text: string }; flipAt: number; b: { at: number; text: string }; label: string }> = ({ head, a, flipAt, b, label }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const drop = interpolate(f, [a0, a0 + 12], [-700, 0], { ...clamp, easing: easeOut });
  const bounce = f > a0 + 12 ? Math.sin((f - a0 - 12) / 2.2) * 18 * Math.exp(-(f - a0 - 12) / 7) : 0;
  const fl = interpolate(f, [at(flipAt), at(flipAt) + 14], [0, 180], { ...clamp, easing: easeInOut });
  const fl2 = interpolate(f + 1, [at(flipAt), at(flipAt) + 14], [0, 180], { ...clamp, easing: easeInOut });
  const spinBlur = Math.min(10, Math.abs(fl2 - fl) * 0.5);
  return (
    <AbsoluteFill>
      <PaperBg id="hour" />
      <Txt text={head.small} role="secInk" size={64} x={540} y={170} align="center" at={a0} />
      <Txt text={head.big} role="strongInk" size={150} x={540} y={232} align="center" at={at(head.bigAt) - 1} />
      <div style={{ position: "absolute", left: W / 2 - 290, top: 520, width: 580, height: 1000, translate: `0 ${drop + bounce}px`, rotate: `${fl}deg`, filter: `drop-shadow(0 40px 40px rgba(0,0,0,.28))${spinBlur > 0.5 ? ` blur(${spinBlur}px)` : ""}` }}>
        <Img src={staticFile("img/hourglass.png")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      <BlockTitle text={`${label} · ${a.text}`} at={at(a.at) - 1} x={290} y={1600} size={64} tone="black" rotate={-3} dim={prog(f, at(b.at), at(b.at) + 8)} />
      <BlockTitle text={`${label} · ${b.text}`} at={at(b.at) - 1} x={790} y={1700} size={64} tone="lime" rotate={3} />
    </AbsoluteFill>
  );
};

/* ---------------- 3. two prints under a loupe ---------------- */

const Print: React.FC<{ x: number; y: number; rot: number; at: number; from: number; dim?: number }> = ({ x, y, rot, at, from, dim = 0 }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + 12, easeOut);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 400, height: 640, padding: 18, background: "#F2F2EE", boxShadow: "0 30px 60px rgba(0,0,0,.6)", rotate: `${rot}deg`, translate: `${(1 - p) * from}px ${(1 - p) * 60}px`, opacity: Math.min(1, p * 2), filter: `blur(${(1 - p) * 10}px) grayscale(${dim})` }}>
      <div style={{ width: "100%", height: "100%", overflow: "hidden", background: "linear-gradient(180deg,#1b2a33,#55605c)", position: "relative" }}>
        <Img src={staticFile(TOWER.src)} style={{ position: "absolute", left: "50%", top: 30, width: 180, translate: "-50% 0" }} />
      </div>
    </div>
  );
};

export const MdLoupe: React.FC<{
  head: Head;
  a: { at: number; small: string; big: string; bigAt: number };
  b: { at: number; small: string; big: string; bigAt: number; lookAt: number };
  same: { at: number; text: string };
}> = ({ head, a, b, same }) => {
  const at = useAt();
  const f = useCurrentFrame();
  // print A at x=70, print B at x=610; loupe hovers over the tower top of each print
  const targetA = { x: 270, y: 640 };
  const targetB = { x: 810, y: 660 };
  const inL = prog(f, at(head.bigAt) - 4, at(head.bigAt) + 12, easeOut);
  const mv = prog(f, at(b.lookAt), at(b.lookAt) + 16, easeInOut);
  const lx = interpolate(mv, [0, 1], [targetA.x, targetB.x]) + Math.sin(f / 14) * 8;
  const ly = interpolate(mv, [0, 1], [targetA.y, targetB.y]) + Math.cos(f / 17) * 6 + (1 - inL) * 500;
  const ring = prog(f, at(same.at), at(same.at) + 18, easeInOut);
  const R = 170; // lens radius
  const LW = R / LOUPE.r;
  const LH = LW / LOUPE.ratio;
  return (
    <AbsoluteFill>
      <ConcreteBg id="loupe" />
      <Txt text={head.small} role="sec" size={60} x={540} y={140} align="center" at={at(head.at)} rate={0.8} />
      <Txt text={head.big} role="strong" size={128} x={540} y={200} align="center" at={at(head.bigAt) - 1} />
      <Print x={70} y={470} rot={-4} at={at(a.at)} from={-300} />
      {f >= at(b.at) ? <Print x={610} y={490} rot={4} at={at(b.at)} from={500} /> : null}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={540} cy={790} rx={520} ry={420} fill="none" stroke={C.lime} strokeWidth={7} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring} transform="rotate(-3 540 790)" />
      </svg>
      {/* magnified tower top inside the lens */}
      <div style={{ position: "absolute", left: lx - R, top: ly - R, width: R * 2, height: R * 2, borderRadius: "50%", overflow: "hidden", opacity: inL, background: "#1b2a33", boxShadow: "inset 0 0 30px rgba(0,0,0,.6)" }}>
        <Img src={staticFile(TOWER.src)} style={{ position: "absolute", left: "50%", top: 30, width: 560, translate: "-50% 0" }} />
        <div style={{ position: "absolute", left: R - 140, top: 20, width: 280, height: 150, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(213,255,56,.55), rgba(213,255,56,0))", mixBlendMode: "screen" }} />
      </div>
      <div style={{ position: "absolute", left: lx - LOUPE.cx * LW, top: ly - LOUPE.cy * LH, width: LW, opacity: inL, filter: "drop-shadow(0 30px 30px rgba(0,0,0,.55))", pointerEvents: "none" }}>
        <Img src={staticFile(LOUPE.src)} style={{ width: "100%" }} />
      </div>
      <Txt text={a.small} role="sec" size={54} x={270} y={1170} align="center" at={at(a.bigAt) - 9} />
      <Txt text={a.big} role="strong" size={104} x={270} y={1226} align="center" at={at(a.bigAt) - 1} />
      <Txt text={b.small} role="sec" size={54} x={810} y={1190} align="center" at={at(b.bigAt) - 9} />
      <Txt text={b.big} role="strongLime" size={92} x={810} y={1246} align="center" at={at(b.bigAt) - 1} />
      <Txt text={same.text} role="caps" size={70} x={540} y={1460} align="center" at={at(same.at) + 2} />
    </AbsoluteFill>
  );
};

/* ---------------- 4. type-only: two lime jaws squeeze the words ---------------- */

export const TxSqueeze: React.FC<{ small: { at: number; text: string }; big: { at: number; text: string }; squeezeAt: number }> = ({ small, big, squeezeAt }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const s = prog(f, at(squeezeAt) - 2, at(squeezeAt) + 10, easeIn);
  const hold = interpolate(f, [at(squeezeAt) + 10, at(squeezeAt) + 40], [0, 1], clamp);
  const jaw = interpolate(s, [0, 1], [0, 300]) + Math.sin(f * 2.4) * 3 * s;
  const pb = prog(f, at(big.at) - 1, at(big.at) + 6);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", left: -40 + jaw, top: 0, bottom: 0, width: 80, background: C.lime }} />
      <div style={{ position: "absolute", right: -40 + jaw, top: 0, bottom: 0, width: 80, background: C.lime }} />
      <div style={{ textAlign: "center", scale: `${1 - 0.38 * s} ${1 + 0.06 * s + 0.02 * hold}` }}>
        <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 80, color: "#8C8C8C", letterSpacing: "-0.03em", opacity: prog(f, at(small.at) - 1, at(small.at) + 5) }}>{small.text}</div>
        <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 150, color: "#F4F4F2", letterSpacing: "-0.05em", lineHeight: 1, whiteSpace: "nowrap", opacity: pb, translate: `0 ${(1 - pb) * 40}px` }}>{big.text}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 5. the penthouse light goes out ---------------- */

export const MdLightsOut: React.FC<{ lines: { at: number; text: string; role: "sec" | "strong" | "strongLime"; size: number; y: number; rate?: number }[]; outAt: number; punch: { at: number; text: string } }> = ({ lines, outAt, punch }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(lines[0].at);
  const th = 1000;
  const tw = th * TOWER.ratio;
  const top = H - th - 40;
  const pull = interpolate(f, [a0, a0 + 120], [1.18, 1], { ...clamp, easing: easeOut });
  // flicker, then off
  const o = at(outAt);
  const flick = f < o ? 1 : f < o + 8 ? (random(`fl${f}`) > 0.5 ? 1 : 0.15) : 0;
  const p = prog(f, at(punch.at) - 1, at(punch.at) + 7, easeOut);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: String(pull), transformOrigin: "50% 80%" }}>
        <SkyBg id="night" night />
        <div style={{ position: "absolute", left: W / 2 - tw / 2, top, width: tw, height: th, filter: "brightness(.55) contrast(1.1)" }}>
          <Img src={staticFile(TOWER.src)} style={{ width: "100%", height: "100%" }} />
        </div>
        <Glow x={W / 2} y={top + th * TOWER.phY} r={260} k={flick} />
      </AbsoluteFill>
      {lines.map((l, i) => (
        <Txt key={i} text={l.text} role={l.role} size={l.size} x={540} y={l.y} align="center" at={at(l.at) - 1} rate={l.rate} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 600, textAlign: "center", opacity: p, scale: String(1.4 - 0.4 * p), filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined }}>
        <span style={{ fontFamily: POP, fontWeight: 600, fontSize: 240, letterSpacing: "-0.05em", color: C.lime }}>{punch.text}</span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 6. type-only: a lime marker sweeps behind the key words ---------------- */

export const TxMarker: React.FC<{ lead: { at: number; text: string }; words: { at: number; text: string } }> = ({ lead, words }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const pl = prog(f, at(lead.at) - 1, at(lead.at) + 8);
  const pw = prog(f, at(words.at) - 1, at(words.at) + 5);
  const sweep = prog(f, at(words.at) + 2, at(words.at) + 14, easeInOut);
  return (
    <AbsoluteFill style={{ backgroundColor: "#F1F1EF", justifyContent: "center", padding: "0 80px" }}>
      <Grain id="marker" opacity={0.18} />
      <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 76, lineHeight: 1.12, letterSpacing: "-0.035em", color: "#0B0B0B", opacity: pl, translate: `0 ${(1 - pl) * 30}px` }}>{lead.text}</div>
      <div style={{ position: "relative", display: "inline-block", alignSelf: "flex-start", marginTop: 26, opacity: pw }}>
        <div style={{ position: "absolute", left: -18, right: -18, top: "18%", bottom: "4%", background: C.lime, transformOrigin: "0 50%", scale: `${sweep} 1`, rotate: "-1.5deg" }} />
        <div style={{ position: "relative", fontFamily: POP, fontWeight: 600, fontSize: Math.min(132, 1700 / words.text.length), lineHeight: 1.05, letterSpacing: "-0.05em", color: "#0B0B0B", whiteSpace: "nowrap" }}>{words.text}</div>
      </div>
    </AbsoluteFill>
  );
};
