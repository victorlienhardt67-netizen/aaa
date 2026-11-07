/**
 * Little T (burgers & tacos, secteur Pfaffenhoffen · Ingwiller · Saverne) — test semaine 1.
 * DA « comptoir » : aliments détourés (générés ElevenLabs Seedream 5 Pro + BiRefNet) qui tombent
 * et s'empilent sur papier sulfurisé, inox et grill ; titres extrudés jaune cheddar / rouge tomate ;
 * notes manuscrites façon ticket de commande. Mêmes briques que Charpente Kuhn, procédés propres.
 */
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { clamp, easeIn, easeInOut, easeOut, prog } from "../lib/anim";
import { FPS, H, SF, W } from "../lib/tokens";
import { SteelBg } from "../scenes/Bistro";
import { Block, DISPLAY, Extruded, HAND, Pen, PenLayer, addShake, spring, thud } from "../kuhn/KuhnReel";
import W1 from "./vo1.words.json";
import W2 from "./vo2.words.json";

export const L = {
  red: "#E3321C",
  redDeep: "#7A1408",
  cheddar: "#FFB81C",
  ink: "#17120E",
  paper: "#F6EEDC",
};
const T = (s: number) => Math.round(s * FPS);

/* ---------------- grounds ---------------- */
const Grain: React.FC<{ id: string; o?: number }> = ({ id, o = 0.18 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: o, mixBlendMode: "overlay" }}>
      <filter id={`${id}-g`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 2) % 40} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width={W} height={H} filter={`url(#${id}-g)`} />
    </svg>
  );
};

/** Papier sulfurisé froissé avec auréoles de gras. */
export const SulfuBg: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ backgroundColor: "#F1E6CC" }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.55, mixBlendMode: "multiply" }}>
      <filter id={`${id}-p`}><feTurbulence type="fractalNoise" baseFrequency="0.004 0.02" numOctaves={5} seed={8} /><feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.55  0 0 0 0 0.42  0 0 0 0.9 -0.2" /></filter>
      <rect width={W} height={H} filter={`url(#${id}-p)`} />
    </svg>
    {[{ x: 180, y: 380, r: 160 }, { x: 900, y: 1500, r: 220 }, { x: 820, y: 260, r: 90 }].map((s, i) => (
      <div key={i} style={{ position: "absolute", left: s.x - s.r, top: s.y - s.r, width: s.r * 2, height: s.r * 2, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(200,150,60,.22), rgba(200,150,60,.08) 70%, rgba(0,0,0,0))" }} />
    ))}
    <AbsoluteFill style={{ background: "radial-gradient(85% 65% at 50% 45%, rgba(0,0,0,0) 50%, rgba(60,30,0,.28) 100%)" }} />
    <Grain id={id} />
  </AbsoluteFill>
);

/** Grill : barres sombres en diagonale, braises qui respirent. */
export const GrillBg: React.FC<{ id: string; heat?: number }> = ({ id, heat = 1 }) => {
  const f = useCurrentFrame();
  const b = 0.75 + Math.sin(f / 9) * 0.1;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0E0A08" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(70% 50% at 50% 60%, rgba(255,90,20,${0.35 * heat * b}), rgba(0,0,0,0) 70%)` }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 22 }).map((_, i) => (
          <line key={i} x1={-400 + i * 110} y1={0} x2={-400 + i * 110 + 700} y2={H} stroke="#2B2522" strokeWidth={26} />
        ))}
        {Array.from({ length: 22 }).map((_, i) => (
          <line key={`h${i}`} x1={-400 + i * 110 + 6} y1={0} x2={-400 + i * 110 + 706} y2={H} stroke="rgba(255,255,255,.08)" strokeWidth={3} />
        ))}
      </svg>
      <Grain id={id} o={0.22} />
    </AbsoluteFill>
  );
};

/** Aliment détouré centré. */
const Food: React.FC<{ src: string; w: number; x: number; y: number; rot?: number; scale?: number; style?: React.CSSProperties; sh?: number }> = ({ src, w, x, y, rot = 0, scale = 1, style, sh = 1 }) => (
  <Img src={staticFile(`img/littlet/${src}`)} style={{ position: "absolute", left: x, top: y, width: w, translate: "-50% -50%", rotate: `${rot}deg`, scale: String(scale), filter: `drop-shadow(0 ${26 * sh}px ${24 * sh}px rgba(0,0,0,${0.42 * sh}))`, ...style }} />
);

/** Note manuscrite « ticket » sans crayon. */
const Note: React.FC<{ text: string; at: number; x: number; y: number; size?: number; color?: string; rotate?: number; dur?: number }> = ({ text, at, x, y, size = 80, color = L.ink, rotate = -4, dur = 9 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = prog(f, at, at + dur, easeOut);
  return <div style={{ position: "absolute", left: x, top: y, rotate: `${rotate}deg`, clipPath: `inset(-30% ${(1 - p) * 100}% -30% 0)`, fontFamily: HAND, fontWeight: 700, fontSize: size, color, whiteSpace: "nowrap", lineHeight: 1 }}>{text}</div>;
};

/** Gros titre jaune cheddar à tranche rouge. */
const Big: React.FC<{ text: string; at: number; y: number; size: number; x?: number; rotate?: number; face?: string; side?: string }> = ({ text, at, y, size, x = 540, rotate = -3, face = L.cheddar, side = L.redDeep }) => (
  <Extruded text={text} at={at} x={x} y={y} size={size} face={face} side={side} rotate={rotate} />
);

/** Badge « VS » qui claque. */
const VS: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const f = useCurrentFrame();
  const p = spring(f, at, 12);
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% -50%", width: 230, height: 230, borderRadius: "50%", background: L.red, border: `10px solid ${L.paper}`, display: "flex", alignItems: "center", justifyContent: "center", scale: String(0.3 + 0.7 * p), rotate: `${(1 - p) * -90 - 8}deg`, boxShadow: "0 20px 40px rgba(0,0,0,.45)" }}>
      <span style={{ fontFamily: DISPLAY, fontSize: 110, color: L.paper, letterSpacing: "-0.04em" }}>VS</span>
    </div>
  );
};

/** Gouttes de cheddar qui coulent. */
const Drips: React.FC<{ at: number; x: number; y: number; n?: number; w?: number }> = ({ at, x, y, n = 5, w = 300 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: n }).map((_, i) => {
        const p = prog(f, at + i * 3, at + i * 3 + 22, easeIn);
        const len = 40 + random(`dr${i}`) * 120;
        const cx = x - w / 2 + (i + 0.5) * (w / n);
        return (
          <g key={i}>
            <rect x={cx - 9} y={y} width={18} height={len * p} rx={9} fill={L.cheddar} />
            <circle cx={cx} cy={y + len * p} r={14 * Math.min(1, p * 2)} fill={L.cheddar} />
          </g>
        );
      })}
    </svg>
  );
};

/** Logo proposé (à remplacer par le vrai si existant) : LITTLE + T dans un rond rouge. */
export const LittleLogo: React.FC<{ p?: number; scale?: number; dark?: boolean }> = ({ p = 1, scale = 1, dark = true }) => {
  const a = interpolate(p, [0, 0.5], [0, 1], { ...clamp, easing: easeOut });
  const b = interpolate(p, [0.3, 0.8], [0, 1], { ...clamp, easing: easeOut });
  return (
    <div style={{ transform: `scale(${scale})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 150, lineHeight: 1, color: dark ? L.paper : L.ink, opacity: a, translate: `${(1 - a) * -40}px 0`, letterSpacing: "-0.03em" }}>LITTLE</span>
        <div style={{ width: 170, height: 170, borderRadius: "50%", background: L.red, display: "flex", alignItems: "center", justifyContent: "center", scale: String(0.3 + 0.7 * spring(b * 30, 0, 20)), boxShadow: "0 14px 30px rgba(0,0,0,.35)" }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 130, color: L.cheddar, lineHeight: 1, marginTop: -6 }}>T</span>
        </div>
      </div>
      <div style={{ fontFamily: SF, fontWeight: 600, fontSize: 40, letterSpacing: 18, color: L.cheddar, opacity: b }}>BURGERS · TACOS</div>
    </div>
  );
};

/** Carte du secteur (positions réelles lat/lon, approchées). */
const TOWNS = [
  { n: "Saverne", lat: 48.741, lon: 7.362 },
  { n: "Ingwiller", lat: 48.873, lon: 7.48 },
  { n: "Pfaffenhoffen", lat: 48.842, lon: 7.607 },
];
const Map: React.FC<{ ats: number[]; y?: number; dark?: boolean }> = ({ ats, y = 1010, dark = true }) => {
  const f = useCurrentFrame();
  const px = (lon: number) => 160 + ((lon - 7.33) / 0.31) * 760;
  const py = (lat: number) => y + ((48.9 - lat) / 0.18) * 300;
  const c = dark ? L.paper : L.ink;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <path d={`M${px(TOWNS[0].lon)} ${py(TOWNS[0].lat)} Q 520 ${y + 120} ${px(TOWNS[1].lon)} ${py(TOWNS[1].lat)} T ${px(TOWNS[2].lon)} ${py(TOWNS[2].lat)}`} fill="none" stroke={c} strokeOpacity={0.35} strokeWidth={4} strokeDasharray="12 12" />
      {TOWNS.map((t, i) => {
        const p = spring(f, ats[i], 12);
        if (f < ats[i]) return null;
        const x = px(t.lon), yy = py(t.lat);
        return (
          <g key={t.n} transform={`translate(${x} ${yy}) scale(${p})`}>
            <path d="M0 0 C -30 -40, -30 -70, 0 -76 C 30 -70, 30 -40, 0 0 Z" fill={L.red} stroke={L.paper} strokeWidth={4} />
            <circle cx={0} cy={-50} r={10} fill={L.cheddar} />
            <text x={0} y={42} textAnchor="middle" fontFamily={SF} fontWeight={600} fontSize={36} fill={c}>{t.n}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------- captions (générique) ---------------- */
type Wd = { text: string; type: string; start: number; end: number };
const makeCaptions = (raw: Wd[], key: RegExp, end: number) => {
  const words = raw.filter((w) => w.type === "word" && /[\p{L}\d]/u.test(w.text));
  const groups: [number, number][] = [];
  let s = 0;
  words.forEach((w, i) => { if (/[.,:?!…]$/.test(w.text) || i - s + 1 >= 4) { groups.push([s, i]); s = i + 1; } });
  if (s < words.length) groups.push([s, words.length - 1]);
  const Cap: React.FC<{ ink?: boolean }> = ({ ink }) => {
    const f = useCurrentFrame();
    const t = f / FPS;
    const gi = groups.findIndex(([a], i) => { const n = groups[i + 1]; return t >= words[a].start - 0.05 && (n ? t < words[n[0]].start - 0.05 : true); });
    if (gi < 0 || t > end) return null;
    const [a, b] = groups[gi];
    return (
      <div style={{ position: "absolute", left: 70, right: 70, top: 1238, textAlign: "center", lineHeight: 1.05 }}>
        {words.slice(a, b + 1).map((w, k) => {
          const on = t >= w.start - 0.03;
          const p = prog(f, T(w.start - 0.05), T(w.start - 0.05) + 5);
          const isKey = key.test(w.text.replace(/[,.:…]$/, ""));
          return (
            <span key={a + k} style={{
              display: "inline-block", margin: "0 11px", fontFamily: isKey ? DISPLAY : SF, fontWeight: isKey ? 400 : 700,
              fontSize: isKey ? 80 : 64, color: isKey ? (ink ? L.red : L.cheddar) : ink ? L.ink : L.paper,
              opacity: on ? p : 0, transform: `translateY(${(1 - p) * 16}px) scale(${0.9 + 0.1 * p}) rotate(${isKey ? -2 : 0}deg)`, filter: `blur(${(1 - p) * 6}px)`,
              textShadow: ink ? "none" : "0 3px 0 rgba(0,0,0,.6), 0 8px 26px rgba(0,0,0,.6)",
              WebkitTextStroke: isKey && !ink ? `2px ${L.ink}` : undefined, paintOrder: "stroke fill",
            }}>{w.text.replace(/[,:…]$/, "")}</span>
          );
        })}
      </div>
    );
  };
  return Cap;
};

const Whip: React.FC<{ first: boolean; children: React.ReactNode; dir?: number }> = ({ first, children, dir = 1 }) => {
  const f = useCurrentFrame();
  if (first) return <>{children}</>;
  const p = prog(f, 0, 7, easeOut);
  return <AbsoluteFill style={{ translate: `${(1 - p) * 760 * dir}px 0`, rotate: `${(1 - p) * 4 * dir}deg`, filter: p < 1 ? `blur(${(1 - p) * 22}px)` : undefined }}>{children}</AbsoluteFill>;
};

/* ======================= REEL 1 · Burger ou tacos ? ======================= */
const CAP1 = makeCaptions(W1 as Wd[], /burger|tacos|brioché|steak|cheddar|coule|galette|grillée|viande|frites|fromagère|défendent|team|commentaire|Little|T\.|Burgers|Pfaffenhoffen|Ingwiller|Saverne/i, 21.4);
const V1 = 21.12;
export const LT1_FRAMES = T(V1 + 1.9);

const A1: React.FC = () => {
  const f = useCurrentFrame();
  const dA = spring(f, T(1.3) - 6, 15), dB = spring(f, T(2.56) - 6, 15);
  const sh = addShake(thud(f, T(1.3) + 2, 14), thud(f, T(2.56) + 2, 14), thud(f, T(2.3), 10));
  return (
    <AbsoluteFill style={{ translate: `${sh.x}px ${sh.y}px`, scale: String(interpolate(f, [0, T(3.5)], [1.07, 1], clamp)) }}>
      <GrillBg id="a1" />
      <Big text="CE SOIR ?" at={4} y={250} size={150} />
      <Food src="burger.png" w={560} x={290} y={820 - (1 - dA) * 1500} rot={-6 + (1 - dA) * 20} />
      <Food src="tacos.png" w={540} x={790} y={860 - (1 - dB) * 1500} rot={6 - (1 - dB) * 20} />
      <VS at={T(2.3)} x={545} y={840} />
    </AbsoluteFill>
  );
};

const LabelArrow: React.FC<{ text: string; at: number; x: number; y: number; to: [number, number]; side?: "l" | "r"; ink?: boolean }> = ({ text, at, x, y, to, side = "l", ink }) => {
  const sx = side === "l" ? x + text.length * 18 + 20 : x - 20;
  return (
    <>
      <Note text={text} at={at} x={side === "l" ? x : x - text.length * 36} y={y} size={78} color={ink ? L.ink : L.paper} rotate={side === "l" ? -4 : 3} />
      <PenLayer>
        <Pen d={`M${sx} ${y + 60} Q ${(sx + to[0]) / 2} ${y + 120}, ${to[0]} ${to[1]}`} at={at + 4} dur={7} color={L.red} width={8} />
      </PenLayer>
    </>
  );
};

const B1: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(3.5);
  const at = (s: number) => T(s) - o;
  const rise = spring(f, 0, 18);
  const sq = 1 + 0.05 * prog(f, at(5.84), at(5.95)) * (1 - prog(f, at(5.95), at(6.2)));
  return (
    <AbsoluteFill>
      <SulfuBg id="b1" />
      <Big text="LE BURGER" at={at(3.68)} y={220} size={120} face={L.red} side={L.redDeep} />
      <Food src="burger.png" w={640} x={540} y={800 + (1 - rise) * 500} scale={sq} />
      <Drips at={at(7.0)} x={550} y={930} n={6} w={380} />
      <LabelArrow text="pain brioché" at={at(4.6)} x={50} y={370} to={[330, 560]} ink />
      <LabelArrow text="double steak" at={at(5.6)} x={1040} y={370} to={[800, 760]} side="r" ink />
      <LabelArrow text="cheddar qui coule" at={at(6.4)} x={200} y={1120} to={[420, 960]} ink />
    </AbsoluteFill>
  );
};

const C1: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(7.76);
  const at = (s: number) => T(s) - o;
  const rise = spring(f, 0, 18);
  return (
    <AbsoluteFill>
      <SteelBg id="c1" />
      <Big text="LE TACOS" at={at(7.92)} y={220} size={124} />
      <Food src="tacos.png" w={900} x={540} y={800 + (1 - rise) * 500} />
      <LabelArrow text="galette grillée" at={at(8.83)} x={50} y={440} to={[330, 640]} />
      <LabelArrow text="viande" at={at(9.76)} x={990} y={470} to={[760, 700]} side="r" />
      <LabelArrow text="frites" at={at(10.28)} x={60} y={1070} to={[380, 900]} />
      <LabelArrow text="sauce fromagère" at={at(10.88)} x={1000} y={1070} to={[700, 900]} side="r" />
    </AbsoluteFill>
  );
};

const D1: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(12.0);
  const at = (s: number) => T(s) - o;
  const tilt = Math.sin((f / 12) * Math.PI) * 9 * (1 - prog(f, at(13.3), at(13.9))) ;
  const cx = 540, cy = 760, arm = 320;
  const lx = cx - arm * Math.cos((tilt * Math.PI) / 180), ly = cy - arm * Math.sin((tilt * Math.PI) / 180);
  const rx = cx + arm * Math.cos((tilt * Math.PI) / 180), ry = cy + arm * Math.sin((tilt * Math.PI) / 180);
  return (
    <AbsoluteFill>
      <GrillBg id="d1" heat={0.7} />
      <Big text="FRANCHEMENT ?" at={2} y={230} size={104} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <rect x={cx - 14} y={cy} width={28} height={380} fill="#B9BDC2" />
        <rect x={cx - 140} y={cy + 370} width={280} height={30} rx={8} fill="#8E9398" />
        <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#D7DADD" strokeWidth={18} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={24} fill={L.red} />
        {[[lx, ly], [rx, ry]].map(([x, y], i) => (
          <g key={i}><line x1={x} y1={y} x2={x} y2={y + 150} stroke="#D7DADD" strokeWidth={5} /><ellipse cx={x} cy={y + 160} rx={150} ry={22} fill="#C9CCD0" /></g>
        ))}
      </svg>
      <Food src="burger.png" w={260} x={lx} y={ly + 70} sh={0.6} />
      <Food src="tacos.png" w={300} x={rx} y={ry + 80} sh={0.6} />
      <Block text="LES DEUX SE DÉFENDENT" at={at(12.9)} x={540} y={1110} size={58} bg={L.cheddar} fg={L.ink} rotate={-2} />
    </AbsoluteFill>
  );
};

const E1: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(13.96);
  const at = (s: number) => T(s) - o;
  const sh = addShake(thud(f, at(14.4), 12), thud(f, at(14.55), 12));
  const bub = spring(f, at(15.3), 14);
  return (
    <AbsoluteFill style={{ translate: `${sh.x}px ${sh.y}px` }}>
      <SulfuBg id="e1" />
      <Big text="T'ES TEAM QUOI ?" at={2} y={230} size={96} face={L.red} side={L.redDeep} />
      <Block text="TEAM BURGER 🍔" at={at(14.4)} x={540} y={470} size={86} bg={L.ink} fg={L.cheddar} rotate={-4} />
      <Block text="TEAM TACOS 🌮" at={at(14.55)} x={540} y={650} size={86} bg={L.red} fg={L.paper} rotate={3} />
      {f >= at(15.3) ? (
        <div style={{ position: "absolute", left: 540, top: 900, translate: "-50% 0", scale: String(0.3 + 0.7 * bub), background: L.paper, border: `6px solid ${L.ink}`, borderRadius: 40, padding: "26px 44px", boxShadow: "10px 12px 0 rgba(23,18,14,.9)" }}>
          <span style={{ fontFamily: SF, fontWeight: 700, fontSize: 50, color: L.ink, whiteSpace: "nowrap" }}>💬 dis-le en commentaire</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const F1: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(16.24);
  const at = (s: number) => T(s) - o;
  return (
    <AbsoluteFill>
      <GrillBg id="f1" heat={0.8} />
      <div style={{ position: "absolute", top: 380, width: "100%", display: "flex", justifyContent: "center" }}><LittleLogo p={prog(f, 0, 26, (x) => x)} scale={0.95} /></div>
      <Map ats={[at(20.4), at(19.72), at(18.72)]} y={830} />
    </AbsoluteFill>
  );
};

const SC1: [number, number, React.FC, boolean][] = [
  [0, 3.5, A1, false], [3.5, 7.76, B1, true], [7.76, 12.0, C1, false], [12.0, 13.96, D1, false], [13.96, 16.24, E1, true], [16.24, LT1_FRAMES / FPS, F1, false],
];

export const LittleT1: React.FC = () => {
  const f = useCurrentFrame();
  const cur = SC1.find(([a, b]) => f >= T(a) && f < T(b));
  return (
    <AbsoluteFill style={{ background: L.ink }}>
      {SC1.map(([a, b, S], i) => (
        <Sequence key={i} from={T(a)} durationInFrames={T(b) - T(a)}><Whip first={i === 0} dir={i % 2 ? 1 : -1}><S /></Whip></Sequence>
      ))}
      {f < T(16.24) ? <CAP1 ink={cur ? cur[3] : false} /> : null}
      <Audio src={staticFile("media/littlet/vo1.mp3")} />
    </AbsoluteFill>
  );
};

/* ======================= REEL 2 · Le tacos en 4 étapes ======================= */
const CAP2 = makeCaptions(W2 as Wd[], /tacos|galette|viande|frites|sauce|fromagère|plie|grille|croustille|Little|T\.|choisis|bio|Un$|Deux|Trois|Quatre/i, 16.9);
const V2 = 16.72;
export const LT2_FRAMES = T(V2 + 1.9);

const StepTag: React.FC<{ n: string; label: string; at: number; y: number }> = ({ n, label, at, y }) => {
  const f = useCurrentFrame();
  const p = spring(f, at, 12);
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: y, display: "flex", alignItems: "center", gap: 18, translate: `${(1 - p) * -400}px 0` }}>
      <div style={{ width: 92, height: 92, borderRadius: "50%", background: L.red, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 56, color: L.cheddar }}>{n}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 64, color: L.paper, textShadow: `4px 4px 0 ${L.ink}` }}>{label}</div>
    </div>
  );
};

const A2: React.FC = () => {
  const f = useCurrentFrame();
  const rise = spring(f, 4, 18);
  return (
    <AbsoluteFill>
      <SulfuBg id="a2" />
      <Big text="UN TACOS," at={2} y={230} size={130} face={L.red} side={L.redDeep} />
      <Big text="ÇA SE MONTE COMMENT ?" at={T(0.8)} y={390} size={72} rotate={2} />
      <Food src="tacos.png" w={880} x={540} y={850 + (1 - rise) * 600} rot={-4} />
    </AbsoluteFill>
  );
};

const B2: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(2.1);
  const at = (s: number) => T(s) - o;
  const drop = (s: number) => spring(f, at(s) - 5, 14);
  const g = drop(2.88), v = drop(4.56), fr = drop(6.16);
  const sauceIn = prog(f, at(7.7), at(8.0), easeOut), sauceOut = prog(f, at(8.9), at(9.15), easeIn);
  const blob = prog(f, at(8.0), at(8.9), easeOut);
  const fold = prog(f, at(9.28), at(9.75), easeInOut);
  const sh = addShake(thud(f, at(2.88), 8), thud(f, at(4.56), 10), thud(f, at(6.16), 10));
  return (
    <AbsoluteFill style={{ translate: `${sh.x}px ${sh.y}px` }}>
      <SteelBg id="b2" />
      <div style={{ position: "absolute", inset: 0, scale: `${1 - fold * 0.55} ${1 - fold * 0.1}`, transformOrigin: "540px 900px", opacity: 1 - prog(f, at(9.6), at(9.85)) }}>
        <Food src="galette.png" w={860} x={540} y={900 - (1 - g) * 1400} sh={0.5} />
        <Food src="viande.png" w={560} x={540} y={890 - (1 - v) * 1400} rot={10} sh={0.4} />
        <Food src="frites.png" w={560} x={545} y={910 - (1 - fr) * 1400} rot={-8} sh={0.4} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <ellipse cx={540} cy={910} rx={250 * blob} ry={170 * blob} fill={L.cheddar} opacity={0.92} />
          <ellipse cx={500} cy={880} rx={90 * blob} ry={50 * blob} fill="#FFE08A" opacity={0.7} />
        </svg>
      </div>
      {fold > 0.7 ? <Food src="tacos.png" w={820} x={540} y={900} style={{ opacity: prog(f, at(9.6), at(9.85)) }} /> : null}
      {sauceIn > 0 && sauceOut < 1 ? <Food src="sauce.png" w={560} x={580} y={560 - (1 - sauceIn) * 600 - sauceOut * 600} rot={-6} /> : null}
      <StepTag n="1" label="LA GALETTE" at={at(2.16)} y={240} />
      <StepTag n="2" label="LA VIANDE" at={at(3.84)} y={350} />
      <StepTag n="3" label="LES FRITES" at={at(5.44)} y={460} />
      <StepTag n="4" label="LA SAUCE" at={at(7.0)} y={570} />
      <Note text="…et on plie !" at={at(9.1)} x={560} y={1130} size={90} color={L.paper} rotate={-5} />
    </AbsoluteFill>
  );
};

const C2: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(9.9);
  const at = (s: number) => T(s) - o;
  const press = spring(f, at(11.2), 10);
  const marks = prog(f, at(11.3), at(11.9));
  const sh = thud(f, at(11.2) + 2, 14, 12);
  return (
    <AbsoluteFill style={{ translate: `${sh.x}px ${sh.y}px` }}>
      <GrillBg id="c2" heat={1 + marks * 0.6} />
      <Big text="ON LE GRILLE" at={at(10.9)} y={230} size={120} />
      <Food src="tacos.png" w={880} x={540} y={820} scale={1 - 0.04 * press * (1 - prog(f, at(11.5), at(11.9)))} />
      {Array.from({ length: 6 }).map((_, i) => {
        const t = ((f + i * 9) % 50) / 50;
        return <div key={i} style={{ position: "absolute", left: 300 + i * 90 + Math.sin(f / 8 + i) * 20, top: 600 - t * 300, width: 60, height: 160, borderRadius: 40, background: "rgba(255,255,255,.22)", filter: "blur(18px)", opacity: (1 - t) * marks }} />;
      })}
      <Block text="ÇA CROUSTILLE" at={at(12.16)} x={540} y={1090} size={70} bg={L.cheddar} fg={L.ink} rotate={-3} />
    </AbsoluteFill>
  );
};

const D2: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(13.2);
  const at = (s: number) => T(s) - o;
  return (
    <AbsoluteFill>
      <GrillBg id="d2" heat={0.8} />
      <div style={{ position: "absolute", top: 420, width: "100%", display: "flex", justifyContent: "center" }}><LittleLogo p={prog(f, 0, 26, (x) => x)} scale={0.95} /></div>
      <Note text="ce soir, c'est toi qui choisis" at={at(14.08)} x={150} y={800} size={78} color={L.paper} rotate={-3} dur={14} />
      <Block text="COMMANDE → LIEN EN BIO" at={at(15.88)} x={540} y={960} size={56} bg={L.red} fg={L.paper} rotate={-2} />
    </AbsoluteFill>
  );
};

const SC2: [number, number, React.FC, boolean][] = [
  [0, 2.1, A2, true], [2.1, 9.9, B2, false], [9.9, 13.2, C2, false], [13.2, LT2_FRAMES / FPS, D2, false],
];

export const LittleT2: React.FC = () => {
  const f = useCurrentFrame();
  const cur = SC2.find(([a, b]) => f >= T(a) && f < T(b));
  return (
    <AbsoluteFill style={{ background: L.ink }}>
      {SC2.map(([a, b, S], i) => (
        <Sequence key={i} from={T(a)} durationInFrames={T(b) - T(a)}><Whip first={i === 0} dir={i % 2 ? 1 : -1}><S /></Whip></Sequence>
      ))}
      {f < T(13.2) ? <CAP2 ink={cur ? cur[3] : false} /> : null}
      <Audio src={staticFile("media/littlet/vo2.mp3")} />
    </AbsoluteFill>
  );
};

export { SulfuBg as LTSulfu, GrillBg as LTGrill, Food as LTFood, Note as LTNote, Big as LTBig, VS as LTVS, Map as LTMap, Drips as LTDrips };
