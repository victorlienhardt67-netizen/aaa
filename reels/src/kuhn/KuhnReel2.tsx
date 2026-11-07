/**
 * Charpente Kuhn — Reel #2 « Extension en ossature bois : pourquoi ça avance si vite ? »
 * Même DA que le Reel #1 (objets détourés sur fonds tactiles, titres extrudés, crayon de charpentier),
 * procédés différents : chaîne d'atelier, murs qui s'emboîtent, outil barré, pile de bandeaux.
 */
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { clamp, easeIn, easeInOut, easeOut, prog } from "../lib/anim";
import { FPS, SF } from "../lib/tokens";
import { WoodBg } from "../scenes/Bistro";
import { ConcreteBg, PaperBg } from "../scenes/Objects";
import { Block, Cut, DISPLAY, Dust, Extruded, Hand, HaloWarm, K, KuhnLogo, Pen, PenLayer, addShake, spring, thud } from "./KuhnReel";
import WORDS from "./vo2.words.json";

type Wd = { text: string; type: string; start: number; end: number };
const words = (WORDS as Wd[]).filter((w) => w.type === "word" && /[\p{L}\d]/u.test(w.text));
const T = (s: number) => Math.round(s * FPS);
const VO_END = 23.44;
export const KUHN2_FRAMES = T(VO_END + 1.9);

/* ---------- captions ---------- */
const GROUPS: [number, number][] = (() => {
  const g: [number, number][] = [];
  let s = 0;
  words.forEach((w, i) => {
    if (/[.,:?!…]$/.test(w.text) || i - s + 1 >= 4) { g.push([s, i]); s = i + 1; }
  });
  if (s < words.length) g.push([s, words.length - 1]);
  return g;
})();
const KEY = /ossature|bois|vite|atelier|abri|assemble|séchage|maçonnerie|sec|propre|court|pièce|travaux|Kuhn|extensions|Un$|Deux|Trois/i;
const Captions: React.FC<{ ink?: boolean }> = ({ ink }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const gi = GROUPS.findIndex(([a], i) => {
    const next = GROUPS[i + 1];
    return t >= words[a].start - 0.05 && (next ? t < words[next[0]].start - 0.05 : true);
  });
  if (gi < 0 || t > VO_END + 0.3) return null;
  const [a, b] = GROUPS[gi];
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1238, textAlign: "center", lineHeight: 1.05 }}>
      {words.slice(a, b + 1).map((w, k) => {
        const on = t >= w.start - 0.03;
        const p = prog(f, T(w.start - 0.05), T(w.start - 0.05) + 5);
        const isKey = KEY.test(w.text.replace(/[,.:]$/, ""));
        return (
          <span key={a + k} style={{
            display: "inline-block", margin: "0 11px", fontFamily: isKey ? DISPLAY : SF, fontWeight: isKey ? 400 : 600,
            fontSize: isKey ? 78 : 64, color: isKey ? K.orange : ink ? K.ink : K.cream,
            opacity: on ? p : 0, transform: `translateY(${(1 - p) * 16}px) scale(${0.92 + 0.08 * p})`, filter: `blur(${(1 - p) * 6}px)`,
            textShadow: ink ? "none" : "0 3px 0 rgba(0,0,0,.55), 0 8px 26px rgba(0,0,0,.6)",
            WebkitTextStroke: isKey && !ink ? "2px #1B1712" : undefined, paintOrder: "stroke fill",
          }}>{w.text.replace(/[,:]$/, "")}</span>
        );
      })}
    </div>
  );
};

/** Gros numéro en contour qui claque. */
const BigNum: React.FC<{ n: string; at: number; dark?: boolean }> = ({ n, at, dark }) => {
  const f = useCurrentFrame();
  const p = spring(f, at, 14);
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: 70, top: 150, fontFamily: DISPLAY, fontSize: 300, lineHeight: 1, color: "transparent", WebkitTextStroke: `6px ${dark ? K.cream : K.orange}`, scale: String(0.5 + 0.5 * p), opacity: Math.min(1, p * 2), rotate: "-4deg" }}>{n}</div>
  );
};

/* ---------- scenes (temps en secondes de la voix off) ---------- */

/** 0–4 s : la maison + extension monte, le chrono s'emballe. */
const R1: React.FC = () => {
  const f = useCurrentFrame();
  const rise = spring(f, 2, 20);
  const watch = spring(f, T(1.8), 14);
  const tick = Math.sin(f * 1.3) * 8 * prog(f, T(1.9), T(2.4));
  return (
    <AbsoluteFill style={{ scale: String(interpolate(f, [0, T(4)], [1.06, 1], clamp)) }}>
      <PaperBg id="r1p" />
      <Extruded text="OSSATURE BOIS" at={4} x={540} y={240} size={110} face={K.ink} side={K.orange} rotate={-2} />
      <Block text="ÇA AVANCE VITE" at={T(1.85)} x={540} y={385} size={66} rotate={-2} />
      <Cut src="extension.png" w={880} x={520} y={800 + (1 - rise) * 500} style={{ opacity: Math.min(1, rise * 2) }} />
      <Cut src="chrono.png" w={250} x={900 + (1 - watch) * 400} y={640} rot={12 + tick} />
      <Hand text="3 raisons ↓" at={T(3.1)} x={330} y={1125} size={84} rotate={-3} dur={10} />
    </AbsoluteFill>
  );
};

/** 4–7.2 s : 1 · les murs défilent sur la chaîne de l'atelier. */
const R2: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(4.0);
  const at = (s: number) => T(s) - o;
  const belt = f * 9;
  return (
    <AbsoluteFill>
      <ConcreteBg id="r2c" />
      <HaloWarm x={540} y={820} />
      <BigNum n="1" at={0} dark />
      <Extruded text="EN ATELIER" at={at(5.5)} x={620} y={330} size={104} face={K.orange} rotate={-3} />
      {/* tapis */}
      <div style={{ position: "absolute", left: -20, right: -20, top: 1040, height: 26, background: "#2A2622", boxShadow: "0 10px 20px rgba(0,0,0,.5)" }} />
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", top: 1046, left: ((i * 90 + belt) % 1260) - 90, width: 14, height: 14, borderRadius: 7, background: "#57504A" }} />
      ))}
      {[0, 1, 2].map((i) => {
        const x = -400 + ((f * 9 + i * 520) % 1560);
        return <Cut key={i} src="mur.png" w={420} x={x} y={729} shadow={0.8} />;
      })}
      <Hand text="à l'abri de la pluie" at={at(6.25)} x={300} y={1100} size={80} color={K.cream} rotate={-3} dur={10} />
    </AbsoluteFill>
  );
};

/** 7.2–12 s : 2 · sur place, les murs s'emboîtent ; la truelle est barrée. */
const R3: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(7.2);
  const at = (s: number) => T(s) - o;
  const drops = [at(8.0), at(8.4), at(8.88)];
  const sh = addShake(...drops.map((d) => thud(f, d + 4, 10)));
  const trow = spring(f, at(9.5), 16);
  const shrink = prog(f, at(9.45), at(9.8), easeInOut);
  return (
    <AbsoluteFill style={{ translate: `${sh.x}px ${sh.y}px` }}>
      <WoodBg id="r3w" tone="#6A4224" />
      <BigNum n="2" at={0} dark />
      <Extruded text="SUR PLACE" at={6} x={640} y={300} size={100} rotate={-2} />
      <div style={{ position: "absolute", inset: 0, scale: String(1 - 0.35 * shrink), translate: `${-200 * shrink}px ${-60 * shrink}px` }}>
        {drops.map((d, i) => {
          const p = spring(f, d - 4, 14);
          return <Cut key={i} src="mur.png" w={300} x={240 + i * 300} y={790 - (1 - p) * 1400} shadow={0.9} />;
        })}
        {drops.map((d, i) => <Dust key={i} at={d + 4} x={240 + i * 300} y={1000} n={10} />)}
        <Block text="ON ASSEMBLE" at={at(8.88)} x={540} y={1080} size={58} />
      </div>
      {trow > 0 ? <Cut src="truelle.png" w={520} x={760 + (1 - trow) * 600} y={820} rot={-10} /> : null}
      <PenLayer>
        <Pen d="M540 650 L980 1000" at={at(10.55)} dur={6} width={16} />
        <Pen d="M980 650 L540 1000" at={at(10.7)} dur={6} width={16} />
      </PenLayer>
      <Hand text="pas d'attente de séchage" at={at(9.5)} x={300} y={1120} size={70} color={K.cream} rotate={-3} dur={12} />
    </AbsoluteFill>
  );
};

/** 12–15.84 s : 3 · sec, propre, court : trois bandeaux qui s'empilent. */
const R4: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(12.0);
  const at = (s: number) => T(s) - o;
  const watch = spring(f, at(14.85), 14);
  return (
    <AbsoluteFill>
      <PaperBg id="r4p" />
      <BigNum n="3" at={0} />
      <Block text="CHANTIER SEC" at={at(13.2)} x={540} y={520} size={86} bg={K.ink} fg={K.cream} rotate={-3} />
      <Block text="PLUS PROPRE" at={at(13.95)} x={560} y={690} size={86} rotate={2} />
      <Block text="PLUS COURT" at={at(14.85)} x={520} y={860} size={86} bg={K.ink} fg={K.cream} rotate={-2} />
      <Cut src="chrono.png" w={240} x={900} y={1100 + (1 - watch) * 600} rot={-10} />
      <Hand text="chez vous" at={at(15.2)} x={130} y={1060} size={90} rotate={-4} dur={8} />
    </AbsoluteFill>
  );
};

/** 15.84–19.72 s : résultat, une pièce en plus. */
const R5: React.FC = () => {
  const f = useCurrentFrame();
  const o = T(15.84);
  const at = (s: number) => T(s) - o;
  const z = interpolate(f, [0, at(19.7)], [1.15, 1], { ...clamp, easing: easeOut });
  return (
    <AbsoluteFill>
      <WoodBg id="r5w" tone={K.wood} />
      <HaloWarm x={540} y={820} k={1.5} />
      <Extruded text="+1 PIÈCE" at={at(16.85)} x={540} y={260} size={150} face={K.orange} rotate={-3} />
      <Cut src="extension.png" w={980} x={540} y={830} scale={z} />
      <PenLayer>
        <Pen d="M526 914 a230 165 0 1 0 460 0 a230 165 0 1 0 -460 0" at={at(17.1)} dur={10} width={10} />
      </PenLayer>
      <Hand text="sans des mois de travaux" at={at(17.8)} x={150} y={1090} size={78} color={K.cream} rotate={-3} dur={14} />
    </AbsoluteFill>
  );
};

/** 19.72 s → fin : signature. */
const R6: React.FC = () => {
  const f = useCurrentFrame();
  const t = (s: number) => T(s) - T(19.72);
  const q = (s: number) => prog(f, t(s), t(s) + 10);
  return (
    <AbsoluteFill>
      <ConcreteBg id="r6c" />
      <HaloWarm x={540} y={760} k={1.2} />
      <div style={{ position: "absolute", top: 520, width: "100%", display: "flex", justifyContent: "center" }}><KuhnLogo p={prog(f, 0, 40, (x) => x)} /></div>
      <div style={{ position: "absolute", top: 1000, width: "100%", textAlign: "center", fontFamily: SF, fontWeight: 600, fontSize: 38, letterSpacing: 4, color: K.cream, opacity: q(20.84) }}>OSSATURE BOIS & EXTENSIONS · BAS-RHIN</div>
      <Block text="DEVIS → LIEN EN BIO" at={t(21.9)} x={540} y={1080} size={46} rotate={-1} />
    </AbsoluteFill>
  );
};

const SCENES: [number, number, React.FC, boolean][] = [
  [0, 4.0, R1, true],
  [4.0, 7.2, R2, false],
  [7.2, 12.0, R3, false],
  [12.0, 15.84, R4, true],
  [15.84, 19.72, R5, false],
  [19.72, KUHN2_FRAMES / FPS, R6, false],
];

const Whip: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame();
  if (first) return <>{children}</>;
  const p = prog(f, 0, 8, easeOut);
  return <AbsoluteFill style={{ translate: `${(1 - p) * 700}px 0`, filter: p < 1 ? `blur(${(1 - p) * 20}px)` : undefined }}>{children}</AbsoluteFill>;
};

export const KuhnReel2: React.FC = () => {
  const f = useCurrentFrame();
  const cur = SCENES.find(([a, b]) => f >= T(a) && f < T(b));
  return (
    <AbsoluteFill style={{ background: K.ink }}>
      {SCENES.map(([a, b, S], i) => (
        <Sequence key={i} from={T(a)} durationInFrames={T(b) - T(a)}>
          <Whip first={i === 0}><S /></Whip>
        </Sequence>
      ))}
      {f < T(19.72) ? <Captions ink={cur ? cur[3] : false} /> : null}
      <Audio src={staticFile("media/kuhn/vo2.mp3")} />
    </AbsoluteFill>
  );
};
// (easeIn kept for future exits)
void easeIn;
void Img;
