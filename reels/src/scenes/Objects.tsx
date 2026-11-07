/**
 * Object-driven motion scenes (first used on Robin 04, v2). Every scene is built around a real
 * cut-out (neutral tones + one lime detail) that moves: drop, swing, rise, fall, power-on.
 * Procedures come from the references other than a8d5: editorial collage on paper (6177),
 * halos (96c1), objects on textured grounds (082a). Times are SOURCE seconds (useAt()).
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { clamp, easeIn, easeInOut, easeOut, prog } from "../lib/anim";
import { C, H, HELV, SF, W } from "../lib/tokens";
import { useAt } from "../edit/clock";
import { Txt } from "../components/Txt";

type Head = { at: number; small: string; big: string; bigAt: number };

const shake = (f: number, a: number, amp = 12, dur = 9) => {
  const k = 1 - prog(f, a, a + dur, easeOut);
  return k > 0 && f >= a ? `${Math.sin(f * 2.7) * amp * k}px ${Math.cos(f * 3.1) * amp * k}px` : "0px 0px";
};

/** Damped spring 0→1 (overshoot), for objects that land. */
const spring = (f: number, a: number, dur = 18) => {
  const t = Math.max(0, Math.min(1, (f - a) / dur));
  return f < a ? 0 : 1 - Math.exp(-6 * t) * Math.cos(9 * t);
};

/* ---------------- grounds ---------------- */

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

/** 6177: off-white paper with fibres and a soft window light. */
export const PaperBg: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ backgroundColor: "#ECEBE7" }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.55, mixBlendMode: "multiply" }}>
      <filter id={`${id}-p`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves={4} seed={7} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.55  0 0 0 0 0.53  0 0 0 0.5 0" />
      </filter>
      <rect width={W} height={H} filter={`url(#${id}-p)`} />
    </svg>
    <AbsoluteFill style={{ background: "radial-gradient(80% 60% at 35% 25%, rgba(255,255,255,.55) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,.16) 100%)" }} />
    <Grain id={id} opacity={0.25} />
  </AbsoluteFill>
);

/** 082a: dark mottled concrete, no grid. */
export const ConcreteBg: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ backgroundColor: "#141414" }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.6 }}>
      <filter id={`${id}-c`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={5} seed={3} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0.9 -0.25" />
      </filter>
      <rect width={W} height={H} filter={`url(#${id}-c)`} />
    </svg>
    <AbsoluteFill style={{ background: "radial-gradient(75% 55% at 50% 45%, rgba(0,0,0,0) 30%, rgba(0,0,0,.8) 100%)" }} />
    <Grain id={id} opacity={0.22} />
  </AbsoluteFill>
);

/** 96c1: black with soft light halos breathing. */
export const HaloBg: React.FC<{ id: string; x: number; y: number; lime?: number }> = ({ id, x, y, lime = 0 }) => {
  const f = useCurrentFrame();
  const b = 1 + Math.sin(f / 22) * 0.05;
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      <div style={{ position: "absolute", left: x - 700 * b, top: y - 700 * b, width: 1400 * b, height: 1400 * b, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,.16), rgba(255,255,255,0))" }} />
      <div style={{ position: "absolute", left: x - 420, top: y - 420, width: 840, height: 840, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(213,255,56,${0.55 * lime}), rgba(213,255,56,0))` }} />
      <Grain id={id} opacity={0.2} />
    </AbsoluteFill>
  );
};

/* ---------------- shared pieces ---------------- */

/** 6177: bold title on a colour block that wipes in from the left. */
export const BlockTitle: React.FC<{ text: string; at: number; x: number; y: number; size: number; tone?: "lime" | "black" | "white"; rotate?: number; dim?: number }> = ({
  text,
  at,
  x,
  y,
  size,
  tone = "lime",
  rotate = 0,
  dim = 0,
}) => {
  const f = useCurrentFrame();
  const w = prog(f, at, at + 6, easeOut);
  const t = prog(f, at + 2, at + 9);
  const bg = tone === "lime" ? C.lime : tone === "black" ? "#0A0A0A" : "#F4F4F2";
  const fg = tone === "black" ? "#F4F4F2" : "#0A0A0A";
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0", rotate: `${rotate}deg`, filter: dim ? `grayscale(1) brightness(${1 - 0.45 * dim})` : undefined }}>
      <div style={{ position: "relative", padding: `${size * 0.08}px ${size * 0.22}px ${size * 0.16}px`, clipPath: `inset(0 ${(1 - w) * 100}% 0 0)` }}>
        <div style={{ position: "absolute", inset: 0, background: bg, boxShadow: "0 18px 40px rgba(0,0,0,.25)" }} />
        <div style={{ position: "relative", fontFamily: HELV, fontWeight: 700, fontSize: size, letterSpacing: "-0.04em", lineHeight: 1, color: fg, whiteSpace: "nowrap", opacity: t, translate: `${(1 - t) * 30}px 0` }}>
          {text}
        </div>
      </div>
    </div>
  );
};

/** Paper-cut sticker edge for collage cut-outs. */
const sticker = "drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(0 26px 30px rgba(0,0,0,.32))";

const Star: React.FC<{ x: number; y: number; r: number; p: number }> = ({ x, y, r, p }) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`;
  }).join(" ");
  return <polygon points={pts} fill={C.lime} stroke="#0A0A0A" strokeWidth={3} opacity={Math.min(1, p * 2)} transform={`translate(${x} ${y}) rotate(${(1 - p) * 120}) scale(${Math.max(0.001, p)}) translate(${-x} ${-y})`} />;
};

/* ---------------- 1. hook: France → Europe (editorial collage) ---------------- */

export const MdEurope: React.FC<{ lead: { at: number; text: string }; france: { at: number; text: string }; strikeAt: number; europe: { at: number; text: string } }> = ({ lead, france, strikeAt, europe }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const drop = spring(f, at(lead.at), 20);
  const st = prog(f, at(strikeAt), at(strikeAt) + 5, easeIn);
  const z = prog(f, at(strikeAt) + 2, at(europe.at) + 4, easeInOut);
  const towerH = interpolate(z, [0, 1], [1080, 470]);
  const towerY = interpolate(z, [0, 1], [330, 640]);
  const cx = 540;
  const cy = towerY + towerH * 0.56;
  const R = 330;
  return (
    <AbsoluteFill style={{ translate: shake(f, at(europe.at), 10, 8), overflow: "hidden" }}>
      <PaperBg id="eu" />
      <Txt text={lead.text} role="secInk" size={60} x={540} y={150} align="center" at={at(lead.at)} rate={0.8} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#0A0A0A" strokeWidth={3} strokeDasharray="10 14" opacity={z * 0.5} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = -Math.PI / 2 + (i * Math.PI * 2) / 12;
          const p = prog(f, at(strikeAt) + 3 + i * 0.6, at(strikeAt) + 9 + i * 0.6, easeOut);
          return <Star key={i} x={cx + Math.cos(a) * R} y={cy + Math.sin(a) * R} r={34} p={p} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: "50%", top: towerY, height: towerH, translate: `-50% ${(1 - drop) * -900}px`, rotate: `${(1 - drop) * -8}deg` }}>
        <Img src={staticFile("img/eiffel.png")} style={{ height: "100%", filter: sticker }} />
      </div>
      <BlockTitle text={france.text} at={at(france.at) - 1} x={540} y={interpolate(z, [0, 1], [1290, 1110])} size={interpolate(z, [0, 1], [150, 96])} tone="black" rotate={-3} dim={st} />
      {/* lime tape slapped across "la France" */}
      <div
        style={{
          position: "absolute",
          left: 540,
          top: interpolate(z, [0, 1], [1360, 1160]),
          width: 760 * st,
          height: 64,
          translate: "-50% 0",
          rotate: "-9deg",
          background: "repeating-linear-gradient(90deg, rgba(213,255,56,.95) 0 18px, rgba(205,247,50,.9) 18px 22px)",
          boxShadow: "0 6px 14px rgba(0,0,0,.18)",
          clipPath: "polygon(0 8%, 3% 0, 97% 4%, 100% 0, 100% 92%, 97% 100%, 3% 96%, 0 100%)",
          opacity: st ? 1 : 0,
        }}
      />
      <BlockTitle text={europe.text} at={at(europe.at) - 1} x={540} y={1390} size={200} tone="lime" rotate={2} />
    </AbsoluteFill>
  );
};

/* ---------------- 2. bust rising in a halo, brain lighting up ---------------- */

export const MdBust: React.FC<{ head: Head; accent: { at: number; text: string }; glowAt: number }> = ({ head, accent, glowAt }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const rise = prog(f, a0, a0 + 16, easeOut);
  const g = prog(f, at(glowAt) - 2, at(glowAt) + 8);
  const pulse = g * (0.8 + 0.2 * Math.sin((f - at(glowAt)) / 3));
  const ring = prog(f, at(glowAt), at(glowAt) + 22, easeOut);
  const arrow = prog(f, at(accent.at), at(accent.at) + 12, easeInOut);
  const push = interpolate(f, [a0, a0 + 90], [1, 1.07], clamp);
  const bx = 635; // brain centre on screen
  const by = 760;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <HaloBg id="bust" x={bx} y={by + 300} lime={pulse * 0.6} />
      <AbsoluteFill style={{ scale: String(push), transformOrigin: `${bx}px ${by}px` }}>
        <div style={{ position: "absolute", left: bx - 230, top: by - 230, width: 460, height: 460, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(213,255,56,${0.75 * pulse}), rgba(213,255,56,0))`, filter: "blur(10px)" }} />
        <div style={{ position: "absolute", left: 250, top: 640, width: 700, translate: `0 ${(1 - rise) * 700}px`, opacity: Math.min(1, rise * 1.6), filter: `blur(${(1 - rise) * 18}px) drop-shadow(0 40px 60px rgba(0,0,0,.7)) brightness(${0.85 + 0.25 * g})` }}>
          <Img src={staticFile("img/bust_lime.png")} style={{ width: "100%", display: "block" }} />
        </div>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <circle cx={bx} cy={by} r={120 + ring * 420} fill="none" stroke={C.lime} strokeWidth={4} opacity={(1 - ring) * g} />
          <path d={`M 250 540 C 300 680, 420 760, ${bx - 120} ${by - 10}`} fill="none" stroke={C.lime} strokeWidth={6} strokeDasharray="14 12" pathLength={undefined} strokeLinecap="round" opacity={arrow} style={{ clipPath: `inset(0 ${(1 - arrow) * 100}% 0 0)` }} />
          <path d={`M ${bx - 150} ${by - 40} L ${bx - 116} ${by - 8} L ${bx - 160} ${by + 4}`} fill="none" stroke={C.lime} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={prog(f, at(accent.at) + 10, at(accent.at) + 13)} />
        </svg>
      </AbsoluteFill>
      <Txt text={head.small} role="sec" size={62} x={80} y={170} at={a0} />
      <Txt text={head.big} role="strong" size={150} x={70} y={234} at={at(head.bigAt) - 1} />
      <Txt text={accent.text} role="strongLime" size={118} x={74} y={392} at={at(accent.at) - 1} />
    </AbsoluteFill>
  );
};

/* ---------------- 3. dominoes falling end to end, counter, vest drops ---------------- */

export const MdDomino: React.FC<{
  head: Head;
  tiles: string[];
  fallAt: number;
  since: { at: number; text: string };
  count: { at: number; from: number; to: number; toAt: number; unit: string };
  vest: { at: number; text: string };
}> = ({ head, tiles, fallAt, since, count, vest }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const tw = 140;
  const th = 340;
  const gap = 175;
  const x0 = 30; // room on the right for the last tile to lie flat
  const base = 900;
  const vd = prog(f, at(vest.at) - 4, at(vest.at) + 4, easeIn);
  const land = at(vest.at) + 4;
  const n = f >= at(count.toAt) ? count.to : f >= at(count.at) ? count.from : null;
  const roll = prog(f, at(count.toAt), at(count.toAt) + 6);
  const dust = prog(f, land, land + 20);
  return (
    <AbsoluteFill style={{ translate: shake(f, land, 16, 10), overflow: "hidden" }}>
      <ConcreteBg id="dom" />
      <Txt text={head.small} role="sec" size={60} x={540} y={150} align="center" at={at(head.at)} />
      <Txt text={head.big} role="strongLime" size={150} x={540} y={214} align="center" at={at(head.bigAt) - 1} />
      {/* floor line */}
      <div style={{ position: "absolute", left: 80, right: 80, top: base, height: 3, background: "rgba(255,255,255,.25)" }} />
      {tiles.map((t, i) => {
        const a = at(fallAt) + i * 4;
        const last = i === tiles.length - 1;
        const r = interpolate(f, [a, a + 7], [0, last ? 90 : 58], { ...clamp, easing: easeIn });
        const show = prog(f, at(head.at) + i * 2, at(head.at) + i * 2 + 8);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0 + i * gap,
              top: base - th,
              width: tw,
              height: th,
              borderRadius: 16,
              background: "linear-gradient(90deg,#fdfdfb 0%,#e9e8e3 70%,#cfcec8 100%)",
              border: "3px solid #0A0A0A",
              boxShadow: "6px 10px 0 rgba(0,0,0,.35)",
              transformOrigin: "100% 100%",
              rotate: `${r}deg`,
              opacity: show,
              translate: `0 ${(1 - show) * -60}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "absolute", left: tw / 2 - 11, top: 38, width: 22, height: 22, borderRadius: 11, background: C.lime, border: "2px solid #0A0A0A" }} />
            <div style={{ rotate: "-90deg", fontFamily: HELV, fontWeight: 700, fontSize: Math.min(64, 360 / t.length), letterSpacing: "-0.03em", color: "#0A0A0A", whiteSpace: "nowrap", translate: "0 36px" }}>{t}</div>
          </div>
        );
      })}
      <Txt text={since.text} role="sec" size={58} x={540} y={970} align="center" at={at(since.at) - 1} />
      {n !== null ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1040, textAlign: "center", fontFamily: HELV, fontWeight: 700, fontSize: 190, letterSpacing: "-0.05em", color: "#F4F4F2", lineHeight: 1 }}>
          <span style={{ display: "inline-block", overflow: "hidden", height: 200, verticalAlign: "top" }}>
            <span style={{ display: "block", translate: `0 ${f >= at(count.toAt) ? (1 - roll) * -100 : 0}%`, color: f >= at(count.toAt) ? C.lime : "#F4F4F2" }}>{n}</span>
          </span>
          <span style={{ fontSize: 110, marginLeft: 24, color: "#cfcfcf" }}>{count.unit}</span>
        </div>
      ) : null}
      {/* the vest drops from above and lands */}
      <div style={{ position: "absolute", left: "50%", top: 1270, width: 500, translate: `-50% ${(1 - vd) * -1500}px`, rotate: `${(1 - vd) * 14 - 4}deg`, opacity: f >= at(vest.at) - 4 ? 1 : 0 }}>
        <Img src={staticFile("img/vest.png")} style={{ width: "100%", display: "block", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.7))" }} />
      </div>
      <div style={{ position: "absolute", left: 540 - 380 - dust * 120, top: 1600, width: 760 + dust * 240, height: 80, borderRadius: "50%", background: "rgba(220,220,210,.35)", filter: "blur(22px)", opacity: f >= land ? 1 - dust : 0 }} />
      <BlockTitle text={vest.text} at={land + 2} x={540} y={1715} size={110} tone="white" rotate={-3} />
    </AbsoluteFill>
  );
};

/* ---------------- 4. vintage TV powering on, news band, heat haze ---------------- */

export const MdTV: React.FC<{
  head: Head;
  onAt: number;
  screen: { x: number; y: number; w: number; h: number }; // screen rect in the TV image, fractions
  news: { at: number; title: string; band: { at: number; text: string } };
  punch: { at: number; small: string; big: string; bigAt: number };
}> = ({ head, onAt, screen, news, punch }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const tvW = 940;
  const tvX = 70;
  const tvY = 460;
  const slide = prog(f, a0, a0 + 14, easeOut);
  const on = f - at(onAt);
  const lineH = interpolate(on, [0, 4, 9], [0.004, 0.004, 1], clamp);
  const lineW = interpolate(on, [0, 4], [0, 1], clamp);
  const heat = prog(f, at(punch.bigAt) - 2, at(punch.bigAt) + 10);
  const sx = tvX + screen.x * tvW;
  const sy = tvY + screen.y * tvW;
  const sw = screen.w * tvW;
  const sh = screen.h * tvW;
  const newsOn = f >= at(news.at) - 1;
  const glitch = newsOn && f < at(news.at) + 4;
  const bandP = prog(f, at(news.band.at) - 1, at(news.band.at) + 6);
  const marquee = `${news.band.text} · `.repeat(6);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <ConcreteBg id="tv" />
      <Txt text={head.small} role="sec" size={62} x={540} y={150} align="center" at={a0} />
      <Txt text={head.big} role="strong" size={130} x={540} y={214} align="center" at={at(head.bigAt) - 1} />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="heat">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves={2} seed={Math.floor(f / 2)} />
          <feDisplacementMap in="SourceGraphic" scale={heat * 26} />
        </filter>
      </svg>
      <AbsoluteFill style={{ translate: `0 ${(1 - slide) * 900}px`, filter: heat > 0.01 ? "url(#heat)" : `blur(${(1 - slide) * 14}px)` }}>
        <Img src={staticFile("img/tv.png")} style={{ position: "absolute", left: tvX, top: tvY, width: tvW, filter: "drop-shadow(0 50px 60px rgba(0,0,0,.75))" }} />
        {/* screen content composited over the cut-out's dark screen */}
        <div style={{ position: "absolute", left: sx, top: sy, width: sw, height: sh, overflow: "hidden", borderRadius: 34, background: "#030303" }}>
          {on >= 0 ? (
            <div style={{ position: "absolute", left: "50%", top: "50%", width: `${lineW * 100}%`, height: `${lineH * 100}%`, translate: "-50% -50%", background: on < 9 ? "#fff" : "radial-gradient(120% 90% at 50% 40%, #222 0%, #0b0b0b 80%)", boxShadow: on < 9 ? "0 0 40px #fff" : undefined, overflow: "hidden" }}>
              {on >= 9 ? (
                <>
                  {!newsOn ? (
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: SF, fontWeight: 700, fontSize: 40, color: "#fff", letterSpacing: "0.1em" }}>
                        <div style={{ width: 22, height: 22, borderRadius: 11, background: C.lime, opacity: Math.floor(f / 10) % 2 ? 0.3 : 1 }} />
                        DIRECT
                      </div>
                      <div style={{ fontFamily: HELV, fontWeight: 700, fontSize: 84, color: "#F4F4F2", letterSpacing: "-0.04em" }}>en ce moment</div>
                    </div>
                  ) : (
                    <div style={{ position: "absolute", inset: 0, translate: glitch ? `${(random(`g${f}`) - 0.5) * 40}px 0` : undefined }}>
                      <div style={{ position: "absolute", left: 40, right: 30, top: sh * 0.14, fontFamily: HELV, fontWeight: 700, fontSize: 96, lineHeight: 0.95, letterSpacing: "-0.045em", color: "#F4F4F2" }}>{news.title}</div>
                      <div style={{ position: "absolute", left: 0, right: 0, bottom: sh * 0.1, height: 86, background: C.lime, translate: `${(1 - bandP) * -100}% 0`, overflow: "hidden", display: "flex", alignItems: "center" }}>
                        <div style={{ whiteSpace: "nowrap", fontFamily: HELV, fontWeight: 700, fontSize: 58, color: "#0A0A0A", translate: `${-((f - at(news.band.at)) * 7) % 600}px 0` }}>{marquee}</div>
                      </div>
                    </div>
                  )}
                  {/* scanlines + curvature vignette */}
                  <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 2px, rgba(0,0,0,0) 2px 5px)" }} />
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(closest-side, rgba(0,0,0,0) 70%, rgba(0,0,0,.6) 100%)" }} />
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        {/* screen glow on the wall */}
        <div style={{ position: "absolute", left: sx - 80, top: sy - 80, width: sw + 160, height: sh + 160, borderRadius: 80, background: "rgba(213,255,56,.10)", filter: "blur(60px)", opacity: on >= 9 ? 1 : 0, mixBlendMode: "screen" }} />
      </AbsoluteFill>
      <Txt text={punch.small} role="sec" size={60} x={540} y={1470} align="center" at={at(punch.at) - 1} />
      <BlockTitle text={punch.big} at={at(punch.bigAt) - 1} x={540} y={1540} size={150} tone="lime" rotate={-2} />
    </AbsoluteFill>
  );
};

/* ---------------- 5. padlock swinging on a chain, tags, Paris behind ---------------- */

const Tag: React.FC<{ text: string; at: number; x: number; y: number; lime?: boolean }> = ({ text, at, x, y, lime }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + 8);
  const sw = (f >= at ? Math.exp(-(f - at) / 18) * Math.sin((f - at) / 3.2) * 22 : 0) + Math.sin(f / 25) * 2;
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transformOrigin: "50% 0", rotate: `${sw}deg`, opacity: p, scale: String(0.7 + 0.3 * p) }}>
      <div style={{ width: 4, height: 90, background: "#d8d8d8", marginLeft: "calc(50% - 2px)" }} />
      <div style={{ position: "relative", padding: "38px 34px 26px", borderRadius: 18, background: lime ? C.lime : "#F4F4F2", boxShadow: "0 18px 30px rgba(0,0,0,.5)", fontFamily: HELV, fontWeight: 700, fontSize: 64, letterSpacing: "-0.035em", color: "#0A0A0A", whiteSpace: "nowrap", clipPath: "polygon(16% 0, 84% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)" }}>
        <div style={{ position: "absolute", left: "calc(50% - 11px)", top: 10, width: 22, height: 22, borderRadius: 11, background: "#111" }} />
        {text}
      </div>
    </div>
  );
};

export const MdLock: React.FC<{
  head: Head;
  lockAt: number;
  left: { at: number; text: string };
  right: { at: number; text: string };
  city: { at: number; text: string; sub: { at: number; text: string } };
  end: number;
}> = ({ head, lockAt, left, right, city, end }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a = at(lockAt);
  const drop = spring(f, a, 22);
  const swing = f >= a ? Math.exp(-(f - a) / 30) * Math.sin((f - a) / 6) * 9 + Math.sin(f / 30) * 1.5 : 0;
  const c = prog(f, at(city.at) - 2, at(city.at) + 14, easeOut);
  const headOut = prog(f, at(city.at) - 3, at(city.at) + 4);
  const fade = interpolate(f, [at(end) + 4, at(end) + 26], [0, 1], clamp);
  const pivot = { x: 540, y: -20 };
  const len = 620;
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505", overflow: "hidden" }}>
      {/* spotlight cone */}
      <div style={{ position: "absolute", left: 540 - 700, top: -200, width: 1400, height: 1700, background: "radial-gradient(50% 60% at 50% 30%, rgba(255,255,255,.14) 0%, rgba(255,255,255,0) 70%)" }} />
      {/* Paris rises behind */}
      <div style={{ position: "absolute", left: "50%", bottom: 0, height: 1500, translate: `-50% ${(1 - c) * 60}%`, opacity: c * 0.85, filter: "brightness(.95)" }}>
        <Img src={staticFile("img/eiffel.png")} style={{ height: "100%" }} />
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,5,5,0) 70%, rgba(5,5,5,.75) 100%)" }} />
      <AbsoluteFill style={{ transformOrigin: `${pivot.x}px ${pivot.y}px`, rotate: `${swing}deg`, translate: `0 ${(1 - drop) * -900}px` }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const y = pivot.y + i * (len / 12) + 20;
            return i % 2 ? (
              <rect key={i} x={540 - 6} y={y - 24} width={12} height={78} rx={6} fill="none" stroke="#bdbdbd" strokeWidth={9} />
            ) : (
              <ellipse key={i} cx={540} cy={y + 14} rx={26} ry={40} fill="none" stroke="#e2e2e2" strokeWidth={10} />
            );
          })}
        </svg>
        <div style={{ position: "absolute", left: 540 - 230, top: pivot.y + len - 20, width: 460 }}>
          <Img src={staticFile("img/padlock.png")} style={{ width: "100%", display: "block", filter: "drop-shadow(0 40px 50px rgba(0,0,0,.8))" }} />
        </div>
        <Tag text={left.text} at={at(left.at) - 1} x={180} y={pivot.y + len + 540} />
        <Tag text={right.text} at={at(right.at) - 1} x={660} y={pivot.y + len + 570} lime />
      </AbsoluteFill>
      <div style={{ opacity: 1 - headOut, filter: headOut ? `blur(${headOut * 12}px)` : undefined }}>
        <Txt text={head.small} role="sec" size={62} x={540} y={1460} align="center" at={at(head.at)} />
        <Txt text={head.big} role="strong" size={140} x={540} y={1524} align="center" at={at(head.bigAt) - 1} />
      </div>
      <BlockTitle text={city.text} at={at(city.at) - 1} x={540} y={1470} size={170} tone="lime" rotate={-2} />
      <Txt text={city.sub.text} role="sec" size={62} x={540} y={1700} align="center" at={at(city.sub.at) - 1} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
