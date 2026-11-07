/**
 * Charpente Kuhn — Reel test #1 « Fermette ou charpente traditionnelle ? »
 * Motion design 100 % (aucune face caméra), dans la famille 082a « objets sur fonds tactiles »
 * validée sur Robin 04 v2 / Ravito : vrais objets détourés (générés ElevenLabs Seedream 5 Pro +
 * BiRefNet v2) qui tombent, se posent, se multiplient ; titres extrudés ; annotations au crayon
 * de charpentier (Caveat) ; accent orange chantier. Voix off ElevenLabs « Mathieu ».
 * Temps en secondes de la voix off (transcription Scribe dans vo.words.json).
 */
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { clamp, easeIn, easeInOut, easeOut, prog } from "../lib/anim";
import { FPS, H, SF, W } from "../lib/tokens";
import { WoodBg } from "../scenes/Bistro";
import { ConcreteBg, PaperBg } from "../scenes/Objects";
import WORDS from "./vo.words.json";

export const K = {
  cream: "#F3ECDD",
  ink: "#1B1712",
  orange: "#E8622C",
  orangeDeep: "#8A3412",
  wood: "#6E4526",
};
export const DISPLAY = "ArchivoBlack";
export const HAND = "Caveat";

type Wd = { text: string; type: string; start: number; end: number };
const words = (WORDS as Wd[]).filter((w) => w.type === "word" && /[\p{L}\d]/u.test(w.text));
const T = (s: number) => Math.round(s * FPS);
export const VO_END = 29.2;
export const KUHN_FRAMES = T(VO_END + 1.9);

/* ---------------- motion helpers ---------------- */
export const spring = (f: number, a: number, dur = 18) => {
  const t = Math.max(0, Math.min(1, (f - a) / dur));
  return f < a ? 0 : 1 - Math.exp(-6 * t) * Math.cos(9 * t);
};
export const thud = (f: number, a: number, amp = 12, dur = 9) => {
  const k = 1 - prog(f, a, a + dur, easeOut);
  return f >= a && k > 0 ? { x: Math.sin(f * 2.7) * amp * k, y: Math.cos(f * 3.3) * amp * k } : { x: 0, y: 0 };
};
export const addShake = (...s: { x: number; y: number }[]) => s.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }), { x: 0, y: 0 });

/* ---------------- pieces ---------------- */

/** Objet détouré centré sur (x, y). */
export const Cut: React.FC<{ src: string; w: number; x: number; y: number; rot?: number; scale?: number; style?: React.CSSProperties; shadow?: number }> = ({
  src, w, x, y, rot = 0, scale = 1, style, shadow = 1,
}) => (
  <Img
    src={staticFile(`img/kuhn/${src}`)}
    style={{
      position: "absolute", left: x, top: y, width: w, translate: "-50% -50%", rotate: `${rot}deg`, scale: String(scale),
      filter: `drop-shadow(0 ${28 * shadow}px ${26 * shadow}px rgba(0,0,0,${0.45 * shadow})) drop-shadow(0 4px 4px rgba(0,0,0,${0.3 * shadow}))`,
      ...style,
    }}
  />
);

/** Titre extrudé (082a) : face + tranche empilée + ombre portée. Arrive en ressort. */
export const Extruded: React.FC<{ text: string; at: number; x: number; y: number; size: number; face?: string; side?: string; rotate?: number }> = ({
  text, at, x, y, size, face = K.cream, side = K.orangeDeep, rotate = -3,
}) => {
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

/** Bandeau de couleur qui s'essuie depuis la gauche (6177). */
export const Block: React.FC<{ text: string; at: number; x: number; y: number; size: number; bg?: string; fg?: string; rotate?: number }> = ({
  text, at, x, y, size, bg = K.orange, fg = K.ink, rotate = -2,
}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const w = prog(f, at, at + 6);
  const t = prog(f, at + 2, at + 9);
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0", rotate: `${rotate}deg` }}>
      <div style={{ position: "relative", padding: `${size * 0.1}px ${size * 0.24}px ${size * 0.14}px`, clipPath: `inset(0 ${(1 - w) * 100}% 0 0)` }}>
        <div style={{ position: "absolute", inset: 0, background: bg, boxShadow: "0 18px 40px rgba(0,0,0,.35)" }} />
        <div style={{ position: "relative", fontFamily: DISPLAY, fontSize: size, lineHeight: 1, letterSpacing: "-0.01em", color: fg, whiteSpace: "nowrap", opacity: t, translate: `${(1 - t) * 30}px 0` }}>{text}</div>
      </div>
    </div>
  );
};

/** Trait de crayon tracé (cercle, flèche, rature). */
export const Pen: React.FC<{ d: string; at: number; dur?: number; color?: string; width?: number }> = ({ d, at, dur = 9, color = K.orange, width = 9 }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + dur, easeInOut);
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />;
};
export const PenLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>{children}</svg>
);

/** Écriture au crayon de charpentier : le texte se dévoile, le crayon suit la pointe puis repart. */
export const Hand: React.FC<{ text: string; at: number; x: number; y: number; size: number; color?: string; rotate?: number; dur?: number; pencil?: boolean }> = ({
  text, at, x, y, size, color = K.ink, rotate = -4, dur = 12, pencil = true,
}) => {
  const f = useCurrentFrame();
  if (f < at - 6) return null;
  const p = prog(f, at, at + dur, easeOut);
  const tw = text.length * size * 0.43;
  const inK = prog(f, at - 6, at, easeOut);
  const outK = prog(f, at + dur + 2, at + dur + 10, easeIn);
  const tipX = x + tw * p + outK * 260;
  const tipY = y + size * 0.78 + Math.sin(f * 1.7) * 4 * (1 - p) - outK * 200;
  const pw = 430;
  const ph = pw * (518 / 1400);
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, rotate: `${rotate}deg`, transformOrigin: "0 50%", clipPath: `inset(-30% ${(1 - p) * 100}% -30% 0)`, fontFamily: HAND, fontWeight: 700, fontSize: size, color, whiteSpace: "nowrap", lineHeight: 1 }}>
        {text}
      </div>
      {pencil && outK < 1 ? (
        <Img
          src={staticFile("img/kuhn/crayon.png")}
          style={{
            position: "absolute", width: pw, left: tipX + (1 - inK) * 300, top: tipY - 0.987 * ph - (1 - inK) * 220,
            opacity: Math.min(inK, 1 - outK), filter: "drop-shadow(0 22px 18px rgba(0,0,0,.35))",
          }}
        />
      ) : null}
    </>
  );
};

/** Copeaux / poussière à l'impact. */
export const Dust: React.FC<{ at: number; x: number; y: number; n?: number; spread?: number; color?: string }> = ({ at, x, y, n = 18, spread = 380, color = "rgba(225,200,160,.85)" }) => {
  const f = useCurrentFrame();
  if (f < at || f > at + 26) return null;
  const t = (f - at) / 26;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const dir = random(`d${i}${at}`) < 0.5 ? -1 : 1;
        const vx = dir * (0.3 + random(`v${i}${at}`)) * spread;
        const vy = -(0.2 + random(`u${i}${at}`)) * 160;
        const s = 4 + random(`s${i}${at}`) * 9;
        return <div key={i} style={{ position: "absolute", left: x + vx * t, top: y + vy * t + 260 * t * t, width: s, height: s * 0.6, borderRadius: 2, background: color, opacity: 1 - t, rotate: `${i * 47 + f * 9}deg` }} />;
      })}
    </>
  );
};

export const HaloWarm: React.FC<{ x: number; y: number; k?: number }> = ({ x, y, k = 1 }) => {
  const f = useCurrentFrame();
  const b = 1 + Math.sin(f / 20) * 0.04;
  return <div style={{ position: "absolute", left: x - 650 * b, top: y - 650 * b, width: 1300 * b, height: 1300 * b, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(255,190,120,${0.22 * k}), rgba(255,190,120,0))` }} />;
};

/* ---------------- captions ---------------- */
const GROUPS: [number, number][] = (() => {
  const g: [number, number][] = [];
  let s = 0;
  words.forEach((w, i) => {
    if (/[.,:?!…]$/.test(w.text) || i - s + 1 >= 4) { g.push([s, i]); s = i + 1; }
  });
  if (s < words.length) g.push([s, words.length - 1]);
  return g;
})();
const KEY = /combles|fermette|traditionnelle|perdus|libre|charpente|Kuhn|W,|soixante|centimètres|rapide|économique|chambre|bureau|rangement|aménager|pannes|chevrons|tout/i;

const Captions: React.FC<{ y?: number; ink?: boolean }> = ({ y = 1238, ink = false }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const gi = GROUPS.findIndex(([a], i) => {
    const next = GROUPS[i + 1];
    return t >= words[a].start - 0.05 && (next ? t < words[next[0]].start - 0.05 : true);
  });
  if (gi < 0 || t > VO_END + 0.3) return null;
  const [a, b] = GROUPS[gi];
  const base = ink ? K.ink : K.cream;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: y, textAlign: "center", lineHeight: 1.05 }}>
      {words.slice(a, b + 1).map((w, k) => {
        const i = a + k;
        const on = t >= w.start - 0.03;
        const p = prog(f, T(w.start - 0.05), T(w.start - 0.05) + 5);
        const isKey = KEY.test(w.text);
        return (
          <span key={i} style={{
            display: "inline-block", margin: "0 11px", fontFamily: isKey ? DISPLAY : SF, fontWeight: isKey ? 400 : 600,
            fontSize: isKey ? 78 : 64, letterSpacing: isKey ? "-0.01em" : 0, color: isKey ? K.orange : base,
            opacity: on ? p : 0, transform: `translateY(${(1 - p) * 16}px) scale(${0.92 + 0.08 * p})`, filter: `blur(${(1 - p) * 6}px)`,
            textShadow: ink ? "none" : "0 3px 0 rgba(0,0,0,.55), 0 8px 26px rgba(0,0,0,.6)",
            WebkitTextStroke: isKey && !ink ? "2px #1B1712" : undefined, paintOrder: "stroke fill",
          }}>
            {w.text.replace(/[,:]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

/* ======================= SCENES ======================= */

/** S1 · 0–4.5 s — deux maquettes tombent sur l'établi, « 2 charpentes ». */
const S1Hook: React.FC = () => {
  const f = useCurrentFrame();
  const dA = spring(f, T(1.3) - 7, 16);
  const dB = spring(f, T(1.5) - 7, 16);
  const sh = addShake(thud(f, T(1.3) + 2, 14), thud(f, T(1.5) + 2, 12), thud(f, T(2.96), 8));
  const push = interpolate(f, [0, T(4.5)], [1.08, 1], clamp);
  return (
    <AbsoluteFill style={{ translate: `${sh.x}px ${sh.y}px`, scale: String(push) }}>
      <WoodBg id="s1w" tone={K.wood} />
      <Extruded text="2 CHARPENTES" at={T(1.85)} x={540} y={300} size={112} />
      <Block text="ÇA CHANGE TOUT" at={T(2.96)} x={540} y={460} size={64} />
      <Cut src="fermette.png" w={610} x={300} y={840 - (1 - dA) * 1500} rot={-7 + (1 - dA) * 18} />
      <Cut src="tradi.png" w={600} x={790} y={900 - (1 - dB) * 1500} rot={6 - (1 - dB) * 14} />
      <Dust at={T(1.3) + 2} x={300} y={980} />
      <Dust at={T(1.5) + 2} x={785} y={1030} />
      <Hand text="vos combles ?" at={T(3.88)} x={300} y={1080} size={92} color={K.cream} rotate={-3} dur={10} />
    </AbsoluteFill>
  );
};

/** S2 · 4.5–13.2 s — la fermette : en W, tous les 60 cm, rapide, économique… combles perdus. */
const S2Fermette: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(4.5);
  const at = (s: number) => T(s) - o;
  const rise = prog(f, 0, 14);
  const shrink = prog(f, at(6.85), at(7.5), easeInOut);
  const heroW = interpolate(shrink, [0, 1], [900, 560]);
  const heroX = interpolate(shrink, [0, 1], [540, 330]);
  const heroY = interpolate(shrink, [0, 1], [760, 800]);
  const fall = prog(f, at(10.56), at(11.2), easeIn);
  const gloom = prog(f, at(10.6), at(12.3));
  const stamp = spring(f, at(12.5), 12);
  const sh = addShake(thud(f, at(12.5) + 3, 16, 10), thud(f, at(8.84), 6), thud(f, at(9.72), 6));
  const N = 6;
  return (
    <AbsoluteFill style={{ translate: `${sh.x}px ${sh.y}px` }}>
      <ConcreteBg id="s2c" />
      <HaloWarm x={540} y={760} k={1 - gloom * 0.7} />
      <div style={{ position: "absolute", inset: 0, filter: `grayscale(${gloom * 0.85}) brightness(${1 - gloom * 0.35})` }}>
        <Extruded text="LA FERMETTE" at={4} x={540} y={250} size={104} rotate={-2} />
        {Array.from({ length: N }, (_, k) => N - k).map((k) => {
          const p = spring(f, at(6.95) + k * 3, 14);
          if (p <= 0) return null;
          return (
            <Cut key={k} src="fermette.png" w={560 * (1 - 0.075 * k)} x={330 + 92 * k} y={800 - 62 * k - (1 - p) * 120} shadow={0.6}
              style={{ opacity: Math.min(1, p * 2), filter: `brightness(${1 - k * 0.09}) drop-shadow(0 18px 16px rgba(0,0,0,.4))` }} />
          );
        })}
        <Cut src="fermette.png" w={heroW} x={heroX} y={heroY + (1 - rise) * 160} style={{ opacity: rise, filter: `blur(${(1 - rise) * 16}px) drop-shadow(0 28px 26px rgba(0,0,0,.45))` }} />
        <div style={{ opacity: 1 - shrink }}>
          <Block text="EN W" at={at(6.12)} x={800} y={470} size={86} rotate={-4} />
        </div>
        {(() => {
          const m = prog(f, at(7.35), at(7.9), easeOut);
          const out = prog(f, at(8.55), at(8.85), easeIn);
          return m > 0 && out < 1 ? <Cut src="metre.png" w={760} x={540 + out * 1100} y={1050} style={{ clipPath: `inset(0 ${(1 - m) * 100}% 0 0)` }} shadow={0.7} /> : null;
        })()}
        <Hand text="tous les 60 cm" at={at(7.4)} x={50} y={420} size={92} color={K.orange} rotate={-6} dur={10} />
        {[{ t: "RAPIDE ✓", at: 8.84, x: 300, y: 1010, r: -5 }, { t: "ÉCONOMIQUE ✓", at: 9.72, x: 650, y: 1100, r: 3 }].map((s, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, translate: `0 ${fall * (900 + i * 200)}px`, rotate: `${fall * (i ? 14 : -12)}deg` }}>
            <Block text={s.t} at={at(s.at)} x={s.x} y={s.y} size={54} bg={K.cream} fg={K.ink} rotate={s.r} />
          </div>
        ))}
        <PenLayer>
          <Pen d="M110 640 L560 990" at={at(12.3)} dur={6} width={14} />
          <Pen d="M560 640 L110 990" at={at(12.4)} dur={6} width={14} />
        </PenLayer>
      </div>
      {f >= at(12.5) ? (
        <div style={{
          position: "absolute", left: "50%", top: 640, translate: "-50% -50%", rotate: "-9deg", scale: String(2.2 - stamp * 1.2), opacity: Math.min(1, stamp * 2.5),
          border: `10px solid ${K.orange}`, borderRadius: 14, padding: "12px 34px 18px", background: "rgba(20,14,10,.8)",
          fontFamily: DISPLAY, fontSize: 88, color: K.orange, letterSpacing: "0.02em", whiteSpace: "nowrap", boxShadow: "0 20px 50px rgba(0,0,0,.5)",
        }}>COMBLES PERDUS</div>
      ) : null}
    </AbsoluteFill>
  );
};

/** S3 · 13.2–22.3 s — la traditionnelle tombe, pannes / chevrons au crayon, plongée dans l'espace libre → combles aménagés. */
const S3Tradi: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(13.2);
  const at = (s: number) => T(s) - o;
  const drop = spring(f, at(13.45) - 6, 16);
  const sh = addShake(thud(f, at(13.45) + 2, 16, 10), thud(f, at(15.1), 7));
  const punch = 1 + 0.06 * prog(f, at(15.08), at(15.3)) * (1 - prog(f, at(15.9), at(16.4)));
  const dive = prog(f, at(17.85), at(19.5), easeInOut);
  const swap = prog(f, at(19.15), at(19.6));
  const settle = prog(f, at(19.3), at(20.4), easeOut);
  // combles : maquette détourée (rapport h/w 0.8146), 820 px de large, centrée (540, 760)
  const cw = 820, chh = 820 * 0.8146;
  const cx0 = 540 - cw / 2, cy0 = 760 - chh / 2;
  const P = (rx: number, ry: number) => ({ x: cx0 + rx * cw, y: cy0 + ry * chh });
  const bed = P(0.35, 0.86), desk = P(0.753, 0.81), shelf = P(0.766, 0.592);
  return (
    <AbsoluteFill style={{ translate: `${sh.x}px ${sh.y}px` }}>
      <PaperBg id="s3p" />
      <AbsoluteFill style={{ opacity: 1 - swap, scale: String(punch * (1 + dive * 1.4)), transformOrigin: "540px 930px", filter: dive > 0 ? `blur(${dive * 10}px)` : undefined }}>
        <Extruded text="LA TRADITIONNELLE" at={at(13.96)} x={540} y={250} size={84} face={K.ink} side={K.orange} rotate={-2} />
        <Cut src="tradi.png" w={960} x={540} y={830 - (1 - drop) * 1600} rot={(1 - drop) * 8} />
        <Dust at={at(13.45) + 2} x={540} y={1060} n={26} spread={520} color="rgba(120,85,40,.8)" />
        <Block text="GROSSES PIÈCES DE BOIS" at={at(15.08)} x={540} y={1110} size={50} bg={K.ink} fg={K.cream} rotate={-1} />
        <Hand text="pannes" at={at(16.5)} x={70} y={500} size={96} rotate={-5} dur={9} />
        <Hand text="chevrons" at={at(17.02)} x={680} y={440} size={96} rotate={4} dur={9} />
        <PenLayer>
          <Pen d="M190 600 C 225 650, 245 680, 268 712" at={at(16.75)} dur={6} />
          <Pen d="M248 694 L268 714 L240 718" at={at(16.95)} dur={3} />
          <Pen d="M800 545 C 765 585, 735 615, 705 648" at={at(17.3)} dur={6} />
          <Pen d="M716 622 L704 650 L732 643" at={at(17.5)} dur={3} />
        </PenLayer>
      </AbsoluteFill>
      {swap > 0 ? (
        <AbsoluteFill style={{ opacity: swap, scale: String(1.5 - 0.5 * settle), transformOrigin: "540px 900px" }}>
          <HaloWarm x={540} y={780} k={1.4} />
          <Img src={staticFile("img/kuhn/combles.png")} style={{ position: "absolute", left: cx0, top: cy0, width: cw, filter: "drop-shadow(0 30px 30px rgba(0,0,0,.35))" }} />
          <Extruded text="ESPACE LIBRE" at={at(19.35)} x={540} y={240} size={100} face={K.orange} side={K.orangeDeep} rotate={-2} />
          <PenLayer>
            <Pen d={`M${bed.x - 130} ${bed.y} a130 62 0 1 0 260 0 a130 62 0 1 0 -260 0`} at={at(20.24)} dur={8} />
            <Pen d={`M${desk.x - 100} ${desk.y} a100 70 0 1 0 200 0 a100 70 0 1 0 -200 0`} at={at(20.88)} dur={8} />
            <Pen d={`M${shelf.x - 95} ${shelf.y} a95 60 0 1 0 190 0 a95 60 0 1 0 -190 0`} at={at(21.6)} dur={8} />
          </PenLayer>
          <Hand text="chambre" at={at(20.3)} x={bed.x - 300} y={bed.y + 70} size={84} rotate={-4} dur={8} />
          <Hand text="bureau" at={at(20.94)} x={desk.x - 60} y={desk.y + 80} size={84} rotate={3} dur={8} />
          <Hand text="rangement" at={at(21.62)} x={shelf.x - 330} y={shelf.y - 205} size={84} rotate={-3} dur={8} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/** S4 · 22.3–25.7 s — « Aménager un jour ? » : ça se décide dès la charpente. */
const S4Choice: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(22.3);
  const at = (s: number) => T(s) - o;
  const inL = spring(f, 0, 18), inR = spring(f, 3, 18);
  const dim = prog(f, at(23.75), at(24.3));
  const lift = prog(f, at(24.8), at(25.3), easeOut);
  return (
    <AbsoluteFill>
      <WoodBg id="s4w" tone="#5A3820" />
      <Extruded text="AMÉNAGER" at={2} x={540} y={250} size={128} />
      <Extruded text="UN JOUR ?" at={9} x={540} y={410} size={104} face={K.orange} side={K.orangeDeep} rotate={2} />
      <Cut src="fermette.png" w={430} x={280 - (1 - inL) * 700} y={880} rot={-4}
        style={{ filter: `grayscale(${dim}) brightness(${1 - dim * 0.45}) drop-shadow(0 22px 20px rgba(0,0,0,.45))` }} />
      <Cut src="tradi.png" w={460} x={800 + (1 - inR) * 700} y={890 - lift * 40} rot={4} scale={1 + lift * 0.08} />
      <PenLayer>
        <Pen d="M800 890 m-270 0 a270 190 0 1 0 540 0 a270 190 0 1 0 -540 0" at={at(24.8)} dur={10} width={10} />
        <Pen d="M110 790 L450 970" at={at(23.9)} dur={6} width={10} color="rgba(243,236,221,.85)" />
      </PenLayer>
    </AbsoluteFill>
  );
};

/** Logo proposé : picto de ferme (trait) + KUHN + CHARPENTE. */
export const KuhnLogo: React.FC<{ p: number; scale?: number; color?: string; accent?: string }> = ({ p, scale = 1, color = K.cream, accent = K.orange }) => {
  const pp = (a: number, b: number) => interpolate(p, [a, b], [0, 1], { ...clamp, easing: easeOut });
  return (
    <div style={{ transform: `scale(${scale})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={260} height={150} viewBox="0 0 260 150">
        <path d="M10 140 L130 20 L250 140" fill="none" stroke={color} strokeWidth={14} strokeLinecap="square" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pp(0, 0.35)} />
        <path d="M58 92 L202 92" stroke={accent} strokeWidth={11} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pp(0.25, 0.45)} />
        <path d="M130 20 L130 92" stroke={accent} strokeWidth={11} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pp(0.35, 0.5)} />
      </svg>
      <div style={{ fontFamily: DISPLAY, fontSize: 190, letterSpacing: "0.02em", color, lineHeight: 0.9, opacity: pp(0.3, 0.6), marginTop: 10, transform: `translateY(${(1 - pp(0.3, 0.6)) * 30}px)` }}>KUHN</div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 22, opacity: pp(0.45, 0.75) }}>
        <div style={{ height: 4, width: 70, background: accent }} />
        <div style={{ fontFamily: SF, fontWeight: 600, fontSize: 38, letterSpacing: 16, color: accent }}>CHARPENTE</div>
        <div style={{ height: 4, width: 70, background: accent }} />
      </div>
    </div>
  );
};

/** S5 · 25.7 s → fin — signature. */
const S5Outro: React.FC = () => {
  const f = useCurrentFrame();
  const p = prog(f, 0, 40, (x) => x);
  const t = (s: number) => T(s) - T(25.72);
  const q = (s: number) => prog(f, t(s), t(s) + 10);
  return (
    <AbsoluteFill>
      <ConcreteBg id="s5c" />
      <HaloWarm x={540} y={760} k={1.2} />
      <div style={{ position: "absolute", top: 520, width: "100%", display: "flex", justifyContent: "center" }}>
        <KuhnLogo p={p} />
      </div>
      <div style={{ position: "absolute", top: 1000, width: "100%", textAlign: "center", fontFamily: SF, fontWeight: 600, fontSize: 40, letterSpacing: 4, color: K.cream, opacity: q(26.96), translate: `0 ${(1 - q(26.96)) * 16}px` }}>
        ARTISAN CHARPENTIER · BAS-RHIN
      </div>
      <Block text="DEVIS → LIEN EN BIO" at={t(27.8)} x={540} y={1080} size={46} rotate={-1} />
    </AbsoluteFill>
  );
};

const SlideIn: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame();
  if (first) return <>{children}</>;
  const p = prog(f, 0, 8, easeOut);
  return (
    <AbsoluteFill style={{ translate: `0 ${(1 - p) * 420}px`, filter: p < 1 ? `blur(${(1 - p) * 18}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

const SCENES: [number, number, React.FC, boolean][] = [
  [0, 4.5, S1Hook, false],
  [4.5, 13.2, S2Fermette, false],
  [13.2, 22.3, S3Tradi, true],
  [22.3, 25.72, S4Choice, false],
  [25.72, KUHN_FRAMES / FPS, S5Outro, false],
];

export const KuhnReel: React.FC = () => {
  const f = useCurrentFrame();
  const cur = SCENES.find(([a, b]) => f >= T(a) && f < T(b));
  return (
    <AbsoluteFill style={{ background: K.ink }}>
      {SCENES.map(([a, b, S], i) => (
        <Sequence key={i} from={T(a)} durationInFrames={T(b) - T(a)}>
          <SlideIn first={i === 0}><S /></SlideIn>
        </Sequence>
      ))}
      {f < T(25.72) ? <Captions ink={cur ? cur[3] : false} /> : null}
      <Audio src={staticFile("media/kuhn/vo_a.mp3")} />
    </AbsoluteFill>
  );
};
