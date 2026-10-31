/**
 * Scenes first used on Robin 08 ("l'anti-vente"). Object-driven where an object carries the
 * idea (TV end-screen that collapses, a flock of cursors with one going against the current),
 * type-only otherwise. All procedures are new to the series. Times are SOURCE seconds (useAt()).
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { clamp, easeIn, easeInOut, easeOut, prog } from "../lib/anim";
import { C, H, HELV, POP, SF, W } from "../lib/tokens";
import { useAt } from "../edit/clock";
import { Txt } from "../components/Txt";
import { ConcreteBg, HaloBg } from "./Objects";

type Head = { at: number; small: string; big: string; bigAt: number };

// tv.png: screen rectangle as fractions of the cut-out
const TV = { src: "img/tv.png", ratio: 908 / 803, sx: 0.094, sy: 0.18, sw: 0.65, sh: 0.63 };

/* ---------------- 1. type-only: a word that compounds ---------------- */

export const TxCompound: React.FC<{ head: Head; long: { at: number; text: string }; word: string; from: number; to: number; copies?: number }> = ({ head, long, word, from, to, copies = 6 }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const n = interpolate(f, [at(from), at(to)], [0, copies], { ...clamp, easing: easeIn });
  let y = 1720;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A", overflow: "hidden" }}>
      <Txt text={head.small} role="sec" size={60} x={80} y={170} at={at(head.at)} />
      <Txt text={head.big} role="strongLime" size={150} x={70} y={232} at={at(head.bigAt) - 1} />
      <Txt text={long.text} role="sec" size={54} x={80} y={420} at={at(long.at) - 1} />
      {Array.from({ length: copies }).map((_, i) => {
        const size = 70 * Math.pow(1.32, i);
        y -= size * 0.92;
        const p = Math.max(0, Math.min(1, n - i));
        const last = i === copies - 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 80,
              top: y,
              fontFamily: POP,
              fontWeight: 600,
              fontSize: size,
              lineHeight: 1,
              letterSpacing: "-0.05em",
              whiteSpace: "nowrap",
              color: last ? C.lime : "#F4F4F2",
              opacity: p * (last ? 1 : 0.35 + 0.65 * (i / copies)),
              translate: `0 ${(1 - p) * 40}px`,
            }}
          >
            {word}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------- 2. TV: video plays to the end, a hard-sell end-screen slams in, everything collapses ---------------- */

export const MdTvCta: React.FC<{ head: Head; endAt: number; cta: { at: number; text: string }; collapseAt: number; fall: { at: number; small: string; big: string; bigAt: number } }> = ({ head, endAt, cta, collapseAt, fall }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const tw = 900;
  const th = tw / TV.ratio;
  const tx = (W - tw) / 2;
  const ty = 620;
  const dolly = interpolate(f, [a0, at(collapseAt)], [0.92, 1.06], clamp);
  const progress = interpolate(f, [a0 + 6, at(endAt)], [0, 1], { ...clamp, easing: easeInOut });
  const ctaP = prog(f, at(cta.at) - 2, at(cta.at) + 6, easeOut);
  const c = at(collapseAt);
  const g = Math.max(0, f - c);
  const drop = g * g * 1.9; // gravity
  const tilt = g * 1.6;
  const shakeK = 1 - prog(f, c, c + 10);
  const sh = f >= c ? `${Math.sin(f * 2.9) * 14 * shakeK}px ${Math.cos(f * 3.3) * 14 * shakeK}px` : "0px 0px";
  return (
    <AbsoluteFill style={{ translate: sh }}>
      <ConcreteBg id="tvcta" />
      <Txt text={head.small} role="sec" size={62} x={540} y={200} align="center" at={a0} />
      <Txt text={head.big} role="strong" size={120} x={540} y={262} align="center" at={at(head.bigAt) - 1} />
      <div style={{ position: "absolute", left: tx, top: ty, width: tw, height: th, scale: String(dolly), translate: `0 ${drop}px`, rotate: `${tilt}deg` }}>
        <Img src={staticFile(TV.src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        {/* screen content drawn over the (opaque) glass */}
        <div style={{ position: "absolute", left: tw * TV.sx, top: th * TV.sy, width: tw * TV.sw, height: th * TV.sh, background: "#0d0d0d", overflow: "hidden", borderRadius: 34, boxShadow: "inset 0 0 40px rgba(0,0,0,.8)" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 60% at 50% 45%, #2a2a2a, #0b0b0b)" }} />
          <svg width={110} height={110} viewBox="0 0 24 24" style={{ position: "absolute", left: "50%", top: "42%", translate: "-50% -50%", opacity: 1 - ctaP }}>
            <circle cx={12} cy={12} r={11} fill="rgba(255,255,255,.12)" />
            <path d="M10 8l6 4-6 4z" fill="#fff" />
          </svg>
          <div style={{ position: "absolute", left: 24, right: 24, bottom: 26, height: 10, borderRadius: 5, background: "rgba(255,255,255,.18)" }}>
            <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 5, background: "#fff" }} />
          </div>
          {/* end-screen hard sell */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", opacity: ctaP }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", translate: "-50% -50%", scale: String(0.6 + 0.4 * ctaP), opacity: ctaP, padding: "26px 40px", borderRadius: 22, background: C.lime, fontFamily: HELV, fontWeight: 700, fontSize: 52, color: "#0A0A0A", whiteSpace: "nowrap", boxShadow: "0 0 60px rgba(213,255,56,.5)" }}>
            {cta.text}
          </div>
        </div>
      </div>
      {/* debris after the collapse */}
      {f >= c
        ? Array.from({ length: 14 }).map((_, i) => {
            const vx = (random(`dx${i}`) - 0.5) * 30;
            const vy = -10 - random(`dy${i}`) * 18;
            const x = W / 2 + vx * g;
            const y = ty + th / 2 + vy * g + 1.2 * g * g;
            return <div key={i} style={{ position: "absolute", left: x, top: y, width: 18 + random(`s${i}`) * 26, height: 10 + random(`h${i}`) * 18, background: i % 3 ? "#8a8a8a" : C.lime, rotate: `${g * (10 + i * 7)}deg`, opacity: 1 - prog(f, c + 16, c + 30) }} />;
          })
        : null}
      <Txt text={fall.small} role="sec" size={62} x={540} y={1300} align="center" at={at(fall.at) - 1} />
      <Txt text={fall.big} role="strongLime" size={150} x={540} y={1366} align="center" at={at(fall.bigAt) - 1} rate={0.7} />
    </AbsoluteFill>
  );
};

/* ---------------- 3. a flock of grey cursors, one lime cursor against the current ---------------- */

export const MdFlock: React.FC<{ head: Head; crowd: { at: number; text: string }; turnAt: number; against: { at: number; small: string; big: string; bigAt: number }; nobody: { at: number; text: string } }> = ({ head, crowd, turnAt, against, nobody }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const cols = 5;
  const rows = 5;
  const appear = prog(f, at(crowd.at) - 4, at(crowd.at) + 12);
  const crowdIn = at(head.at); // the crowd is already drifting when the scene opens
  const turn = prog(f, at(turnAt), at(turnAt) + 12, easeInOut);
  const drift = f * 6; // the crowd flows to the right
  const special = { r: 3, c: 2 };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <HaloBg id="flock" x={540} y={1100} lime={turn * 0.8} />
      <Txt text={head.small} role="sec" size={58} x={540} y={170} align="center" at={at(head.at)} rate={0.8} />
      <Txt text={head.big} role="strong" size={110} x={540} y={230} align="center" at={at(head.bigAt) - 1} />
      {Array.from({ length: rows * cols }).map((_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const isSpecial = r === special.r && c === special.c;
        const baseX = ((c * 260 + (r % 2) * 130 + drift) % (W + 260)) - 200;
        const y = 520 + r * 190;
        const pi = prog(f, crowdIn + i * 0.8, crowdIn + 12 + i * 0.8);
        if (isSpecial) {
          // stays visible, turns around and swims left against the flow
          const sx = interpolate(turn, [0, 1], [baseX, 540]) - Math.max(0, f - at(turnAt) - 12) * 5;
          return (
            <div key={i} style={{ position: "absolute", left: sx, top: y, width: 180, opacity: pi, scale: String(1 + 0.35 * turn), rotate: `${180 * turn}deg`, filter: turn > 0.5 ? "drop-shadow(0 0 30px rgba(213,255,56,.7))" : "grayscale(1) brightness(.75)" }}>
              <Img src={staticFile("img/cursor.png")} style={{ width: "100%" }} />
            </div>
          );
        }
        return (
          <div key={i} style={{ position: "absolute", left: baseX, top: y, width: 150, opacity: pi * (1 - 0.45 * turn), filter: "grayscale(1) brightness(.7)" }}>
            <Img src={staticFile("img/cursor.png")} style={{ width: "100%" }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1580, textAlign: "center", opacity: appear * (1 - turn) }}>
        <span style={{ fontFamily: SF, fontWeight: 500, fontStyle: "italic", fontSize: 58, color: "#DADADA" }}>{crowd.text}</span>
      </div>
      <Txt text={against.small} role="sec" size={58} x={540} y={1520} align="center" at={at(against.at) - 1} />
      <Txt text={against.big} role="strongLime" size={128} x={540} y={1582} align="center" at={at(against.bigAt) - 1} rate={0.7} />
      <Txt text={nobody.text} role="caps" size={64} x={540} y={1760} align="center" at={at(nobody.at) - 1} />
    </AbsoluteFill>
  );
};

/* ---------------- 4. type-only ending: "anti-" slams in front of the word ---------------- */

export const TxAnti: React.FC<{ word: { at: number; prefix: string; text: string }; end: { at: number; small: string; big: string; bigAt: number } }> = ({ word, end }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a = at(word.at) - 2;
  const pw = prog(f, a - 6, a);
  const slam = prog(f, a, a + 6, easeIn);
  const k = 1 - prog(f, a + 6, a + 14);
  const sh = slam >= 1 ? `${Math.sin(f * 3) * 10 * k}px 0px` : "0px 0px";
  return (
    <AbsoluteFill style={{ backgroundColor: "#F1F1EF", alignItems: "center", justifyContent: "center", translate: sh }}>
      <div style={{ display: "flex", alignItems: "baseline", fontFamily: POP, fontWeight: 600, letterSpacing: "-0.05em", lineHeight: 1, marginTop: -200 }}>
        <span style={{ fontSize: 170, color: "#0B0B0B", background: C.lime, padding: "0 16px 10px", translate: `${(1 - slam) * -700}px 0`, opacity: slam > 0 ? 1 : 0 }}>{word.prefix}</span>
        <span style={{ fontSize: 170, color: "#0B0B0B", opacity: pw, translate: `${slam * 10}px 0` }}>{word.text}</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1130, textAlign: "center" }}>
        <div style={{ fontFamily: SF, fontWeight: 500, fontStyle: "italic", fontSize: 58, color: "#444", opacity: prog(f, at(end.at) - 1, at(end.at) + 6) }}>{end.small}</div>
        <div style={{ fontFamily: HELV, fontWeight: 700, fontSize: 112, letterSpacing: "-0.03em", color: "#0B0B0B", opacity: prog(f, at(end.bigAt) - 1, at(end.bigAt) + 6), translate: `0 ${(1 - prog(f, at(end.bigAt) - 1, at(end.bigAt) + 8)) * 30}px` }}>{end.big}</div>
      </div>
    </AbsoluteFill>
  );
};
