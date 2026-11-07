/**
 * Business / growth scenes (first used on Robin 05). Object-driven like Objects.tsx, with new
 * grounds and moves so nothing repeats Robin 04: studio sweep + live gauge, glossy floor + capsule
 * rain, museum bell jar, perspective track + rolling cart, and a zoom-through word.
 * Times are SOURCE seconds (useAt()).
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { clamp, easeIn, easeInOut, easeOut, prog } from "../lib/anim";
import { C, H, HELV, POP, SF, W } from "../lib/tokens";
import { useAt } from "../edit/clock";
import { Txt } from "../components/Txt";

type Line = { at: number; text: string };

const spring = (f: number, a: number, dur = 18) => {
  const t = Math.max(0, Math.min(1, (f - a) / dur));
  return f < a ? 0 : 1 - Math.exp(-6 * t) * Math.cos(9 * t);
};

const shake = (f: number, a: number, amp = 10, dur = 8) => {
  const k = 1 - prog(f, a, a + dur, easeOut);
  return k > 0 && f >= a ? `${Math.sin(f * 2.7) * amp * k}px ${Math.cos(f * 3.1) * amp * k}px` : "0px 0px";
};

const Grain: React.FC<{ id: string; opacity?: number }> = ({ id, opacity = 0.2 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "overlay" }}>
      <filter id={`${id}-g`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 2) % 50} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={W} height={H} filter={`url(#${id}-g)`} />
    </svg>
  );
};

/** Seamless light-grey studio sweep (product-shot ground). */
const StudioBg: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #F3F3F1 0%, #E4E4E1 58%, #CFCFCB 100%)" }}>
    <AbsoluteFill style={{ background: "radial-gradient(60% 40% at 50% 38%, rgba(255,255,255,.9) 0%, rgba(255,255,255,0) 70%)" }} />
    <Grain id={id} opacity={0.18} />
  </AbsoluteFill>
);

/* ---------------- 1. hook: gauge needle shoots up while the figure counts ---------------- */

export const MdGauge: React.FC<{
  lead: Line;
  dial: { cx: number; cy: number; r: number; a0: number; a1: number }; // dial centre/radius as fractions of the image width, sweep in degrees (0 = up)
  climb: { from: number; to: number };
  figure: { at: number; value: number; unit: string; unitAt: number };
  span: Line;
}> = ({ lead, dial, climb, figure, span }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const gw = 860;
  const gx = 540 - gw / 2;
  const gy = 330;
  const enter = spring(f, at(lead.at) - 2, 20);
  const k = prog(f, at(climb.from), at(climb.to), easeInOut);
  const settle = f > at(climb.to) ? Math.exp(-(f - at(climb.to)) / 6) * Math.sin((f - at(climb.to)) / 1.6) * 4 : 0;
  const jitter = k > 0 && k < 1 ? (random(`j${f}`) - 0.5) * 3 : 0;
  const ang = dial.a0 + (dial.a1 - dial.a0) * k * 0.92 + settle + jitter;
  const cx = gx + dial.cx * gw;
  const cy = gy + dial.cy * gw;
  const r = dial.r * gw;
  const n = figure.value * prog(f, at(figure.at) - 4, at(climb.to), easeOut);
  const shown = n.toFixed(1).replace(".", ",");
  const sp = prog(f, at(span.at) - 1, at(span.at) + 8);
  return (
    <AbsoluteFill style={{ overflow: "hidden", translate: shake(f, at(climb.to), 8, 8) }}>
      <StudioBg id="gauge" />
      <Txt text={lead.text} role="secInk" size={60} x={540} y={150} align="center" at={at(lead.at)} rate={0.7} />
      {/* contact shadow on the sweep */}
      <div style={{ position: "absolute", left: 540 - 380, top: gy + gw * 0.86, width: 760, height: 70, borderRadius: "50%", background: "rgba(0,0,0,.28)", filter: "blur(26px)", opacity: enter }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, translate: `0 ${(1 - enter) * -1100}px` }}>
        <Img src={staticFile("img/gauge.png")} style={{ position: "absolute", left: gx, top: gy, width: gw }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* lime sweep trail */}
          <path
            d={(() => {
              const pts: string[] = [];
              const steps = 40;
              for (let i = 0; i <= steps; i++) {
                const a = ((dial.a0 + ((ang - dial.a0) * i) / steps) * Math.PI) / 180;
                pts.push(`${cx + Math.sin(a) * r * 0.82},${cy - Math.cos(a) * r * 0.82}`);
              }
              return `M ${pts.join(" L ")}`;
            })()}
            fill="none"
            stroke={C.lime}
            strokeWidth={18}
            strokeLinecap="round"
            opacity={0.85 * Math.min(1, k * 4)}
            style={{ filter: "drop-shadow(0 0 12px rgba(213,255,56,.8))" }}
          />
          <g transform={`rotate(${ang} ${cx} ${cy})`}>
            <path d={`M ${cx - 9} ${cy + 30} L ${cx} ${cy - r * 0.86} L ${cx + 9} ${cy + 30} Z`} fill={C.lime} stroke="#0A0A0A" strokeWidth={2} />
          </g>
          <circle cx={cx} cy={cy} r={26} fill="#1a1a1a" stroke="#cfcfcf" strokeWidth={5} />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1290, textAlign: "center", opacity: prog(f, at(figure.at) - 4, at(figure.at) + 2) }}>
        <span style={{ fontFamily: HELV, fontWeight: 700, fontSize: 230, letterSpacing: "-0.055em", color: "#0A0A0A", lineHeight: 1 }}>{shown}</span>
        <span style={{ fontFamily: HELV, fontWeight: 700, fontSize: 96, letterSpacing: "-0.04em", color: "#0A0A0A", marginLeft: 22 }}>{figure.unit}</span>
      </div>
      <Txt text="par mois" role="secInk" size={64} x={540} y={1530} align="center" at={at(figure.unitAt) - 1} />
      <div style={{ position: "absolute", left: "50%", top: 1650, translate: "-50% 0", padding: "14px 40px 20px", borderRadius: 60, background: "#0A0A0A", opacity: sp, scale: String(0.85 + 0.15 * sp), whiteSpace: "nowrap" }}>
        <span style={{ fontFamily: SF, fontWeight: 600, fontSize: 56, color: C.lime, letterSpacing: "-0.02em" }}>{span.text}</span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 2. jar on a glossy floor, capsule rain, capsule labels ---------------- */

const Capsule: React.FC<{ x: number; y: number; rot: number; s?: number }> = ({ x, y, rot, s = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 110 * s, height: 46 * s, rotate: `${rot}deg`, borderRadius: 999, overflow: "hidden", boxShadow: "0 8px 14px rgba(0,0,0,.45)", display: "flex" }}>
    <div style={{ flex: 1, background: "linear-gradient(180deg,#ffffff,#cfcfcf)" }} />
    <div style={{ flex: 1, background: `linear-gradient(180deg,#E9FF8A,${C.limeBottom})` }} />
  </div>
);

export const MdJar: React.FC<{
  head: { at: number; small: string; big: string; bigAt: number; big2: string; big2At: number };
  where: Line;
  pills: Line[];
}> = ({ head, where, pills }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const drop = spring(f, a0, 18);
  const floor = 1290;
  const jw = 430;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#060606" }}>
      {/* glossy floor */}
      <div style={{ position: "absolute", left: 0, right: 0, top: floor, bottom: 0, background: "linear-gradient(180deg, #1b1b1b 0%, #050505 70%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: floor - 2, height: 3, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.35), rgba(255,255,255,0))" }} />
      <AbsoluteFill style={{ background: "radial-gradient(55% 35% at 50% 52%, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 70%)" }} />
      {/* capsule rain landing on the floor */}
      {Array.from({ length: 26 }).map((_, i) => {
        const t0 = at(head.bigAt) + i * 1.3;
        const x = 60 + random(`cx${i}`) * 900;
        const restY = floor - 40 + random(`cy${i}`) * 90;
        const p = prog(f, t0, t0 + 14, easeIn);
        const rot = random(`cr${i}`) * 360 + (1 - p) * 300;
        if (f < t0) return null;
        return <Capsule key={i} x={x} y={-120 + (restY + 120) * p} rot={rot} s={0.7 + random(`cs${i}`) * 0.4} />;
      })}
      {/* jar + reflection */}
      <div style={{ position: "absolute", left: 540 - jw / 2, top: 0, width: jw, height: floor, translate: `0 ${(1 - drop) * -1400}px` }}>
        <Img src={staticFile("img/jar.png")} style={{ position: "absolute", bottom: 0, width: "100%", filter: "drop-shadow(0 20px 30px rgba(0,0,0,.6))" }} />
        <Img
          src={staticFile("img/jar.png")}
          style={{ position: "absolute", top: "100%", width: "100%", transform: "scaleY(-1)", opacity: 0.22, maskImage: "linear-gradient(0deg, rgba(0,0,0,.9), rgba(0,0,0,0) 45%)", WebkitMaskImage: "linear-gradient(0deg, rgba(0,0,0,.9), rgba(0,0,0,0) 45%)" }}
        />
      </div>
      <Txt text={head.small} role="sec" size={60} x={80} y={140} at={a0} />
      <Txt text={head.big} role="strong" size={130} x={70} y={200} at={at(head.bigAt) - 1} />
      <Txt text={head.big2} role="strongLime" size={130} x={70} y={330} at={at(head.big2At) - 1} />
      <Txt text={where.text} role="sec" size={60} x={84} y={480} at={at(where.at) - 1} />
      {/* capsule labels shoot out of the jar and settle on the floor line */}
      {pills.map((p, i) => {
        const a = at(p.at) - 2;
        const q = prog(f, a, a + 12, easeOut);
        const sx = 540;
        const sy = 760;
        const tx = [290, 790, 540][i] ?? 540;
        const ty = [1420, 1530, 1660][i] ?? 1660;
        const arc = Math.sin(q * Math.PI) * -260;
        if (f < a) return null;
        const last = i === pills.length - 1 && pills.length > 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: sx + (tx - sx) * q,
              top: sy + (ty - sy) * q + arc,
              translate: "-50% -50%",
              rotate: `${(1 - q) * (i % 2 ? 40 : -40)}deg`,
              scale: String(0.4 + 0.6 * q),
              padding: last ? "10px 36px 14px" : "16px 46px 22px",
              borderRadius: 999,
              background: last ? "#F4F4F2" : `linear-gradient(90deg, #F4F4F2 0 50%, ${C.lime} 50% 100%)`,
              boxShadow: "0 18px 34px rgba(0,0,0,.55)",
              fontFamily: HELV,
              fontWeight: 700,
              fontSize: last ? 54 : 70,
              letterSpacing: "-0.035em",
              color: "#0A0A0A",
              whiteSpace: "nowrap",
            }}
          >
            {p.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------- 3. type only: the word gets literally enormous ---------------- */

export const ZoomWord: React.FC<{ small: string; word: string; first: number; second: number }> = ({ small, word, first, second }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a = at(first) - 1;
  const b = at(second) - 1;
  const p = prog(f, a, a + 6);
  const two = f >= b;
  const z = two ? interpolate(f, [b, b + 22], [1, 7.5], { ...clamp, easing: easeIn }) : 0.92 + 0.08 * p;
  const bg = two ? C.lime : "#0A0A0A";
  const fg = two ? "#0A0A0A" : "#F4F4F2";
  return (
    <AbsoluteFill style={{ backgroundColor: bg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ textAlign: "center", scale: String(z), transformOrigin: "50% 62%", opacity: Math.min(1, p * 2), filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined }}>
        <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 80, letterSpacing: "-0.04em", color: fg, lineHeight: 0.9, opacity: two ? interpolate(f, [b, b + 6], [1, 0], clamp) : 1 }}>{small}</div>
        <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 230, letterSpacing: "-0.06em", color: two ? fg : C.lime, lineHeight: 0.95 }}>{word}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 4. museum bell jar with a turning plaque ---------------- */

export const MdVitrine: React.FC<{
  lead: Line;
  plaqueA: { at: number; small: string; big: string; bigAt: number };
  plaqueB: { at: number; small: string; big: string; bigAt: number; note: Line };
  echo?: Line; // the other speaker repeating the point
}> = ({ lead, plaqueA, plaqueB, echo }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(lead.at);
  const dome = prog(f, a0, a0 + 16, easeOut);
  const flip = prog(f, at(plaqueB.at) - 2, at(plaqueB.at) + 8, easeInOut);
  const side = flip < 0.5 ? plaqueA : plaqueB;
  const sc = Math.abs(Math.cos(flip * Math.PI));
  const us = flip >= 0.5;
  const ped = { x: 540, top: 1180, w: 560 };
  const dw = 520;
  const dh = 760;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#070707" }}>
      {/* museum spot from above */}
      <AbsoluteFill style={{ background: `radial-gradient(38% 46% at 50% 44%, ${us ? "rgba(213,255,56,.16)" : "rgba(255,255,255,.14)"} 0%, rgba(0,0,0,0) 72%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1460, bottom: 0, background: "linear-gradient(180deg,#141414,#050505)" }} />
      <Txt text={lead.text} role="sec" size={60} x={540} y={150} align="center" at={a0} />
      {/* pedestal */}
      <div style={{ position: "absolute", left: ped.x - ped.w / 2, top: ped.top, width: ped.w, height: 300, background: "linear-gradient(90deg,#2a2a2a 0%,#3b3b3b 45%,#1c1c1c 100%)", boxShadow: "0 40px 60px rgba(0,0,0,.7)" }} />
      <div style={{ position: "absolute", left: ped.x - ped.w / 2 - 20, top: ped.top - 24, width: ped.w + 40, height: 30, background: "linear-gradient(180deg,#4a4a4a,#2a2a2a)", borderRadius: 4 }} />
      {/* the unicorn */}
      <div style={{ position: "absolute", left: 540 - 220, top: ped.top - 24 - 470, width: 440, height: 470, display: "flex", alignItems: "flex-end", justifyContent: "center", opacity: prog(f, a0 + 4, a0 + 12) }}>
        <Img src={staticFile("img/unicorn.png")} style={{ maxWidth: "100%", maxHeight: "100%", filter: `drop-shadow(0 20px 20px rgba(0,0,0,.6)) ${us ? "drop-shadow(0 0 30px rgba(213,255,56,.35))" : ""}` }} />
      </div>
      {/* glass bell jar lowering onto the pedestal */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, translate: `0 ${(1 - dome) * -1300}px` }}>
        <defs>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
            <stop offset="0.18" stopColor="#fff" stopOpacity={0.05} />
            <stop offset="0.8" stopColor="#fff" stopOpacity={0.03} />
            <stop offset="1" stopColor="#fff" stopOpacity={0.18} />
          </linearGradient>
        </defs>
        <path
          d={`M ${540 - dw / 2} ${ped.top - 24} L ${540 - dw / 2} ${ped.top - 24 - dh + dw / 2} A ${dw / 2} ${dw / 2} 0 0 1 ${540 + dw / 2} ${ped.top - 24 - dh + dw / 2} L ${540 + dw / 2} ${ped.top - 24} Z`}
          fill="url(#glass)"
          stroke="rgba(255,255,255,.45)"
          strokeWidth={3}
        />
        <path d={`M ${540 - dw / 2 + 40} ${ped.top - 120} L ${540 - dw / 2 + 40} ${ped.top - dh + dw / 2 - 20} A ${dw / 2 - 40} ${dw / 2 - 40} 0 0 1 ${540 - 40} ${ped.top - dh - 4}`} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={8} strokeLinecap="round" />
        <circle cx={540} cy={ped.top - 24 - dh - 16} r={20} fill="#d9d9d9" />
      </svg>
      {/* museum plaque on the pedestal, turning over */}
      <div style={{ position: "absolute", left: 540, top: ped.top + 70, translate: "-50% 0", scale: `1 ${Math.max(0.02, sc)}`, padding: "18px 44px 24px", minWidth: 420, textAlign: "center", borderRadius: 10, background: us ? C.lime : "linear-gradient(180deg,#e9e9e6,#bdbdb8)", boxShadow: "0 10px 24px rgba(0,0,0,.5)" }}>
        <div style={{ fontFamily: SF, fontWeight: 600, fontSize: 36, letterSpacing: "0.08em", color: "#333", textTransform: "uppercase" }}>{side.small}</div>
        <div style={{ fontFamily: HELV, fontWeight: 700, fontSize: 92, letterSpacing: "-0.04em", color: "#0A0A0A", lineHeight: 1, opacity: f >= at(side.bigAt) - 1 ? 1 : 0 }}>{side.big}</div>
      </div>
      <Txt text={plaqueB.note.text} role="sec" size={60} x={540} y={1560} align="center" at={at(plaqueB.note.at) - 1} />
      {echo ? <Txt text={echo.text} role="strongLime" size={96} x={540} y={1650} align="center" at={at(echo.at) - 1} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------- 5. cart rolling in on a perspective track, parcels drop in ---------------- */

export const MdCart: React.FC<{
  head: { at: number; small: string; big: string; bigAt: number };
  who: { at: number; small: string; big: string; bigAt: number };
  boxesAt: number;
}> = ({ head, who, boxesAt }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const roll = prog(f, a0, a0 + 20, easeOut);
  const speed = 1 - roll;
  const cw = 820;
  const cx = interpolate(roll, [0, 1], [-900, 540 - cw / 2]);
  const tilt = f > a0 + 20 ? Math.exp(-(f - a0 - 20) / 6) * Math.sin((f - a0 - 20) / 2) * 4 : 0;
  const floorY = 1330;
  const off = (f * 40 * Math.max(0.05, speed)) % 240;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0b0b0b" }}>
      {/* perspective track */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="track" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#151515" />
            <stop offset="1" stopColor="#2a2a2a" />
          </linearGradient>
        </defs>
        <polygon points={`0,${floorY - 220} ${W},${floorY - 220} ${W},${H} 0,${H}`} fill="url(#track)" />
        {Array.from({ length: 9 }).map((_, i) => {
          const x = ((i * 240 - off) % (W + 240)) - 120;
          return <polygon key={i} points={`${x},${floorY + 120} ${x + 140},${floorY + 120} ${x + 160},${floorY + 140} ${x + 20},${floorY + 140}`} fill={C.lime} opacity={0.8} />;
        })}
        <line x1={0} x2={W} y1={floorY - 220} y2={floorY - 220} stroke="rgba(255,255,255,.18)" strokeWidth={2} />
        {/* speed streaks */}
        {Array.from({ length: 10 }).map((_, i) => {
          const y = 760 + random(`sy${i}`) * 500;
          const len = 200 + random(`sl${i}`) * 300;
          const x = ((f * 70 + random(`sx${i}`) * 2000) % 2200) - 600;
          return <line key={i} x1={W - x} x2={W - x + len} y1={y} y2={y} stroke="#fff" strokeOpacity={0.35 * speed} strokeWidth={4} strokeLinecap="round" />;
        })}
      </svg>
      <div style={{ position: "absolute", left: cx, top: floorY - cw * 0.955 + 10, width: cw, rotate: `${tilt}deg`, transformOrigin: "50% 100%", filter: speed > 0.05 ? `blur(${speed * 8}px)` : undefined }}>
        {/* parcels dropping into the basket */}
        {[0, 1, 2].map((i) => {
          const t = at(boxesAt) + i * 3;
          const p = prog(f, t, t + 8, easeIn);
          if (f < t) return null;
          const bx = [200, 380, 290][i];
          const by = [90, 100, 20][i];
          return (
            <div key={i} style={{ position: "absolute", left: bx, top: -500 + (by + 500) * p, width: 190, height: 150, rotate: `${[-8, 6, -3][i]}deg`, background: "linear-gradient(180deg,#f4f4f2,#cfcfca)", borderRadius: 8, boxShadow: "0 10px 18px rgba(0,0,0,.4)", zIndex: 0 }}>
              <div style={{ position: "absolute", left: 84, top: 0, bottom: 0, width: 22, background: C.lime }} />
            </div>
          );
        })}
        <Img src={staticFile("img/cart.png")} style={{ position: "relative", width: "100%", display: "block", filter: "drop-shadow(0 30px 30px rgba(0,0,0,.7))" }} />
      </div>
      <Txt text={head.small} role="sec" size={60} x={540} y={170} align="center" at={a0} />
      <Txt text={head.big} role="strongLime" size={150} x={540} y={234} align="center" at={at(head.bigAt) - 1} />
      <Txt text={who.small} role="sec" size={58} x={540} y={1560} align="center" at={at(who.at) - 1} />
      <Txt text={who.big} role="strong" size={130} x={540} y={1626} align="center" at={at(who.bigAt) - 1} />
    </AbsoluteFill>
  );
};
