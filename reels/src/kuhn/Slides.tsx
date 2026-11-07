/**
 * Charpente Kuhn — visuels fixes de la semaine 1 : carrousels 4:5 (1080×1350), couvertures de Reels
 * et fonds de stories (1080×1920). Même DA que les Reels : objets détourés sur fonds tactiles,
 * titres extrudés Archivo Black, annotations Caveat au crayon, accent orange chantier.
 * Rendu image par image : `npx remotion still src/index.ts <id> out/kuhn/<id>.png`.
 */
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { SF } from "../lib/tokens";
import { WoodBg } from "../scenes/Bistro";
import { ConcreteBg, PaperBg } from "../scenes/Objects";
import { Block, Cut, Extruded, HAND, HaloWarm, K, KuhnLogo, Pen, PenLayer } from "./KuhnReel";

const DONE = -60; // les animations sont terminées à l'image 0
const SW = 1080;

/* ---------- pièces fixes ---------- */
const Note: React.FC<{ text: string; x: number; y: number; size?: number; color?: string; rotate?: number; center?: boolean }> = ({ text, x, y, size = 64, color = K.ink, rotate = -3, center }) => (
  <div style={{ position: "absolute", left: x, top: y, translate: center ? "-50% 0" : undefined, rotate: `${rotate}deg`, fontFamily: HAND, fontWeight: 700, fontSize: size, color, whiteSpace: "pre", lineHeight: 1.05, textAlign: center ? "center" : "left" }}>{text}</div>
);
const Body: React.FC<{ text: string; y: number; color?: string; size?: number }> = ({ text, y, color = K.ink, size = 40 }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top: y, textAlign: "center", fontFamily: SF, fontWeight: 500, fontSize: size, lineHeight: 1.3, color }}>{text}</div>
);
const Num: React.FC<{ n: string; x?: number; y?: number; dark?: boolean }> = ({ n, x = 90, y = 90, dark }) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily: "ArchivoBlack", fontSize: 150, lineHeight: 1, color: "transparent", WebkitTextStroke: `4px ${dark ? K.cream : K.orange}` }}>{n}</div>
);
const Pager: React.FC<{ i: number; n: number; dark?: boolean }> = ({ i, n, dark }) => (
  <div style={{ position: "absolute", bottom: 60, width: "100%", display: "flex", justifyContent: "center", gap: 14 }}>
    {Array.from({ length: n }).map((_, k) => (
      <div key={k} style={{ width: k === i ? 46 : 14, height: 14, borderRadius: 7, background: k === i ? K.orange : dark ? "rgba(243,236,221,.35)" : "rgba(27,23,18,.25)" }} />
    ))}
  </div>
);
const Handle: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div style={{ position: "absolute", top: 60, right: 70, fontFamily: SF, fontWeight: 600, fontSize: 28, letterSpacing: 3, color: dark ? "rgba(243,236,221,.7)" : "rgba(27,23,18,.55)" }}>@CHARPENTEKUHN</div>
);
const Swipe: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <Note text="glisse →" x={760} y={1190} size={60} color={dark ? K.cream : K.ink} rotate={-4} />
);

/* ======== CARROUSEL 1 · Lundi · « Votre charpentier dans le Bas-Rhin » (5 slides) ======== */
const C1N = 5;
export const C1S1: React.FC = () => (
  <AbsoluteFill>
    <WoodBg id="c11" tone={K.wood} />
    <div style={{ position: "absolute", top: 110, width: "100%", display: "flex", justifyContent: "center" }}><KuhnLogo p={1} scale={0.62} /></div>
    <Extruded text="VOTRE CHARPENTIER" at={DONE} x={540} y={470} size={84} rotate={-2} />
    <Extruded text="DANS LE BAS-RHIN" at={DONE} x={540} y={575} size={84} face={K.orange} rotate={1} />
    <Cut src="tradi.png" w={760} x={540} y={930} rot={-3} />
    <Swipe dark />
    <Pager i={0} n={C1N} dark />
  </AbsoluteFill>
);
export const C1S2: React.FC = () => (
  <AbsoluteFill>
    <ConcreteBg id="c12" />
    <HaloWarm x={540} y={760} />
    <Handle dark />
    <Num n="01" dark />
    <Extruded text="CHARPENTES" at={DONE} x={540} y={300} size={104} rotate={-2} />
    <Extruded text="TRADITIONNELLES" at={DONE} x={540} y={415} size={84} face={K.orange} rotate={1} />
    <Cut src="tradi.png" w={900} x={540} y={820} />
    <Body text="Le bois massif assemblé, pour une charpente solide et des combles qui restent libres." y={1100} color={K.cream} size={38} />
    <Pager i={1} n={C1N} dark />
  </AbsoluteFill>
);
export const C1S3: React.FC = () => (
  <AbsoluteFill>
    <PaperBg id="c13" />
    <Handle />
    <Num n="02" />
    <Extruded text="OSSATURE BOIS" at={DONE} x={540} y={300} size={100} face={K.ink} side={K.orange} rotate={-2} />
    <Extruded text="& EXTENSIONS" at={DONE} x={540} y={415} size={84} face={K.orange} side={K.orangeDeep} rotate={1} />
    <Cut src="extension.png" w={880} x={540} y={810} />
    <Body text="Une pièce en plus, construite en bois, en accord avec votre maison." y={1100} size={38} />
    <Pager i={2} n={C1N} />
  </AbsoluteFill>
);
export const C1S4: React.FC = () => (
  <AbsoluteFill>
    <WoodBg id="c14" tone="#5A3820" />
    <Handle dark />
    <Num n="03" dark />
    <Extruded text="TERRASSES" at={DONE} x={540} y={290} size={96} rotate={-2} />
    <Extruded text="CARPORTS · COUVERTURE" at={DONE} x={540} y={400} size={70} face={K.orange} rotate={1} />
    <Cut src="carport.png" w={880} x={540} y={810} />
    <Body text="Du dehors au toit : on s'occupe de tout ce qui est en bois au-dessus de vos têtes." y={1100} color={K.cream} size={38} />
    <Pager i={3} n={C1N} dark />
  </AbsoluteFill>
);
export const C1S5: React.FC = () => (
  <AbsoluteFill>
    <ConcreteBg id="c15" />
    <HaloWarm x={540} y={600} k={1.3} />
    <Extruded text="UN PROJET ?" at={DONE} x={540} y={210} size={120} face={K.orange} rotate={-2} />
    <Note text={"charpente, extension,\ncarport, toiture…"} x={540} y={390} size={70} color={K.cream} rotate={-2} center />
    <div style={{ position: "absolute", top: 600, width: "100%", display: "flex", justifyContent: "center" }}><KuhnLogo p={1} scale={0.7} /></div>
    <Block text="DEVIS → LIEN EN BIO" at={DONE} x={540} y={1000} size={54} rotate={-1} />
    <div style={{ position: "absolute", top: 1120, width: "100%", textAlign: "center", fontFamily: SF, fontWeight: 600, fontSize: 34, letterSpacing: 2, color: K.cream }}>contact@charpentekuhn.fr · tout le Bas-Rhin</div>
    <Pager i={4} n={C1N} dark />
  </AbsoluteFill>
);

/* ======== CARROUSEL 2 · Jeudi · « 5 signes que votre charpente doit être vérifiée » (7 slides) ======== */
const C2N = 7;
const GRAPH = "#3A342C";
const Sign: React.FC<{ i: number; n: string; title: string; title2?: string; note: string; children?: React.ReactNode }> = ({ i, n, title, title2, note, children }) => (
  <AbsoluteFill>
    <PaperBg id={`c2${i}`} />
    <Handle />
    <Num n={n} />
    <Extruded text={title} at={DONE} x={540} y={290} size={84} face={K.ink} side={K.orange} rotate={-2} />
    {title2 ? <Extruded text={title2} at={DONE} x={540} y={390} size={84} face={K.ink} side={K.orange} rotate={1} /> : null}
    {children}
    <Note text={note} x={540} y={1060} size={56} rotate={-2} center />
    <Pager i={i} n={C2N} />
  </AbsoluteFill>
);
export const C2S1: React.FC = () => (
  <AbsoluteFill>
    <ConcreteBg id="c21" />
    <HaloWarm x={540} y={820} k={1.2} />
    <Handle dark />
    <Extruded text="5 SIGNES" at={DONE} x={540} y={170} size={150} face={K.orange} rotate={-3} />
    <Extruded text="QUE VOTRE CHARPENTE" at={DONE} x={540} y={360} size={70} rotate={-1} />
    <Extruded text="DOIT ÊTRE VÉRIFIÉE" at={DONE} x={540} y={450} size={70} rotate={1} />
    <Cut src="poutre.png" w={820} x={540} y={830} rot={-4} />
    <Note text="le n°3 est le plus discret" x={540} y={1080} size={58} color={K.cream} rotate={-3} center />
    <Pager i={0} n={C2N} dark />
  </AbsoluteFill>
);
export const C2S2: React.FC = () => (
  <Sign i={1} n="01" title="LE FAÎTAGE" title2="S'AFFAISSE" note={"la ligne du toit n'est plus droite\n(regardez-la de loin, de face)"}>
    <PenLayer>
      {/* maison de face, faîtage en creux */}
      <path d="M250 980 L250 800 L830 800 L830 980" fill="none" stroke={GRAPH} strokeWidth={7} strokeLinecap="round" />
      <path d="M200 810 L340 640 C 470 690, 610 690, 740 640 L880 810" fill="none" stroke={GRAPH} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M340 640 L740 640" fill="none" stroke={K.orange} strokeWidth={5} strokeDasharray="14 12" />
      <Pen d="M540 600 L540 668" at={DONE} />
      <Pen d="M522 650 L540 672 L558 650" at={DONE} />
    </PenLayer>
    <Note text="creux" x={580} y={570} size={54} color={K.orange} rotate={-4} />
  </Sign>
);
export const C2S3: React.FC = () => (
  <Sign i={2} n="02" title="DES TRACES" title2="D'HUMIDITÉ" note={"auréoles, bois noirci ou moisi\nsous la toiture"}>
    <PenLayer>
      <path d="M140 960 L540 560 L940 960" fill="none" stroke={GRAPH} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M300 800 L780 800" fill="none" stroke={GRAPH} strokeWidth={8} strokeLinecap="round" />
      <ellipse cx={660} cy={720} rx={70} ry={48} fill="rgba(90,70,40,.35)" />
      <ellipse cx={668} cy={728} rx={42} ry={28} fill="rgba(70,55,30,.35)" />
      <Pen d="M560 720 a100 75 0 1 0 200 0 a100 75 0 1 0 -200 0" at={DONE} />
      <path d="M660 640 C 655 600, 665 590, 660 560" stroke="#6E8FA8" strokeWidth={6} fill="none" strokeDasharray="10 10" />
    </PenLayer>
  </Sign>
);
export const C2S4: React.FC = () => (
  <Sign i={3} n="03" title="PETITS TROUS" title2="+ SCIURE" note={"possible attaque d'insectes\n(capricorne, vrillettes…)"}>
    <Cut src="poutre.png" w={800} x={540} y={760} rot={-3} />
    <PenLayer>
      <Pen d="M420 700 a120 80 0 1 0 240 0 a120 80 0 1 0 -240 0" at={DONE} />
    </PenLayer>
  </Sign>
);
export const C2S5: React.FC = () => (
  <Sign i={4} n="04" title="DU BOIS QUI" title2="S'EFFRITE" note={"bois mou qui s'enfonce au tournevis :\npourriture ou champignon possible"}>
    <PenLayer>
      <rect x={200} y={640} width={680} height={200} rx={6} fill="#B98A55" stroke={GRAPH} strokeWidth={6} />
      {Array.from({ length: 7 }).map((_, i) => (
        <path key={i} d={`M210 ${665 + i * 25} C 400 ${655 + i * 25}, 600 ${680 + i * 25}, 870 ${662 + i * 25}`} stroke="rgba(80,50,20,.35)" strokeWidth={3} fill="none" />
      ))}
      <path d="M560 640 C 600 700, 690 690, 720 760 C 740 800, 700 840, 680 840 L560 840 C 520 780, 590 740, 560 640 Z" fill="#5A3F25" opacity={0.85} />
      <Pen d="M500 740 a150 120 0 1 0 300 0 a150 120 0 1 0 -300 0" at={DONE} />
    </PenLayer>
  </Sign>
);
export const C2S6: React.FC = () => (
  <Sign i={5} n="05" title="DES TUILES" title2="DÉPLACÉES" note={"après un coup de vent, l'eau\npeut s'infiltrer jusqu'au bois"}>
    <PenLayer>
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 6 }).map((_, c) => {
          const off = r === 1 && c === 3;
          return <rect key={`${r}${c}`} x={200 + c * 115 + (r % 2) * 40 + (off ? 30 : 0)} y={600 + r * 85 + (off ? -26 : 0)} width={108} height={80} rx={10} fill={off ? K.orange : "#9C4A33"} stroke={GRAPH} strokeWidth={4} transform={off ? "rotate(-12 585 680)" : undefined} />;
        }),
      )}
      <Pen d="M500 655 a120 80 0 1 0 240 0 a120 80 0 1 0 -240 0" at={DONE} color={GRAPH} />
    </PenLayer>
  </Sign>
);
export const C2S7: React.FC = () => (
  <AbsoluteFill>
    <ConcreteBg id="c27" />
    <HaloWarm x={540} y={640} k={1.3} />
    <Extruded text="UN DE CES SIGNES ?" at={DONE} x={540} y={200} size={86} face={K.orange} rotate={-2} />
    <Note text={"mieux vaut vérifier tôt\nque réparer tard."} x={540} y={350} size={74} color={K.cream} rotate={-2} center />
    <Cut src="tradi.png" w={620} x={540} y={720} />
    <Block text="DIAGNOSTIC → LIEN EN BIO" at={DONE} x={540} y={960} size={50} rotate={-1} />
    <Note text={"📌 enregistre ce post\npour ta prochaine visite au grenier"} x={540} y={1090} size={50} color={K.cream} rotate={-2} center />
    <Pager i={6} n={C2N} dark />
  </AbsoluteFill>
);

/* ======== COUVERTURES DE REELS (1080×1920, texte dans la zone 3:4 de la grille) ======== */
export const Cover1: React.FC = () => (
  <AbsoluteFill>
    <WoodBg id="cv1" tone={K.wood} />
    <Extruded text="FERMETTE" at={DONE} x={540} y={430} size={140} rotate={-3} />
    <Extruded text="OU TRADI ?" at={DONE} x={540} y={590} size={130} face={K.orange} rotate={2} />
    <Cut src="fermette.png" w={560} x={300} y={1040} rot={-7} />
    <Cut src="tradi.png" w={560} x={790} y={1090} rot={6} />
    <Note text="ça change tout pour vos combles" x={540} y={1330} size={66} color={K.cream} rotate={-3} center />
  </AbsoluteFill>
);
export const Cover2: React.FC = () => (
  <AbsoluteFill>
    <PaperBg id="cv2" />
    <Extruded text="OSSATURE BOIS" at={DONE} x={540} y={430} size={100} face={K.ink} side={K.orange} rotate={-3} />
    <Extruded text="POURQUOI SI RAPIDE ?" at={DONE} x={540} y={570} size={70} face={K.orange} side={K.orangeDeep} rotate={2} />
    <Cut src="extension.png" w={900} x={540} y={1060} />
    <Note text="3 raisons, en 25 secondes" x={540} y={1360} size={66} rotate={-3} center />
  </AbsoluteFill>
);

/* ======== STORIES (1080×1920) ======== */
export const StoryPoll: React.FC = () => (
  <AbsoluteFill>
    <WoodBg id="st1" tone={K.wood} />
    <Extruded text="VOS COMBLES," at={DONE} x={540} y={330} size={100} rotate={-2} />
    <Extruded text="VOUS EN FAITES QUOI ?" at={DONE} x={540} y={450} size={72} face={K.orange} rotate={1} />
    <Cut src="combles.png" w={760} x={540} y={900} />
    <Note text="place le sondage ici ↓" x={540} y={1330} size={62} color={K.cream} rotate={-3} center />
    <div style={{ position: "absolute", left: 140, right: 140, top: 1420, height: 220, border: "4px dashed rgba(243,236,221,.5)", borderRadius: 30 }} />
  </AbsoluteFill>
);
export const StoryQuestions: React.FC = () => (
  <AbsoluteFill>
    <ConcreteBg id="st2" />
    <HaloWarm x={540} y={700} k={1.2} />
    <Extruded text="UNE QUESTION" at={DONE} x={540} y={330} size={100} rotate={-2} />
    <Extruded text="SUR VOTRE TOIT ?" at={DONE} x={540} y={450} size={84} face={K.orange} rotate={1} />
    <Cut src="crayon.png" w={520} x={560} y={760} rot={-8} />
    <Note text={"on répond à tout\ndans la semaine 👇"} x={540} y={930} size={72} color={K.cream} rotate={-3} center />
    <div style={{ position: "absolute", left: 140, right: 140, top: 1180, height: 300, border: "4px dashed rgba(243,236,221,.5)", borderRadius: 30 }} />
  </AbsoluteFill>
);
export const StoryNew: React.FC<{ n: 1 | 2 }> = ({ n }) => (
  <AbsoluteFill>
    <ConcreteBg id={`stn${n}`} />
    <HaloWarm x={540} y={900} k={1.3} />
    <Extruded text="NOUVELLE VIDÉO" at={DONE} x={540} y={330} size={96} face={K.orange} rotate={-2} />
    <Note text={n === 1 ? "fermette ou traditionnelle :\nlaquelle sous votre toit ?" : "extension en ossature bois :\npourquoi ça va si vite ?"} x={540} y={470} size={66} color={K.cream} rotate={-2} center />
    <div style={{ position: "absolute", left: 210, right: 210, top: 690, height: 760, border: "4px dashed rgba(243,236,221,.5)", borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: SF, fontWeight: 600, fontSize: 30, color: "rgba(243,236,221,.6)", letterSpacing: 3 }}>PARTAGER LE REEL ICI</div>
    </div>
  </AbsoluteFill>
);

export const LogoSquare: React.FC = () => (
  <AbsoluteFill>
    <ConcreteBg id="lg" />
    <HaloWarm x={540} y={540} k={1.2} />
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ marginTop: 20 }}><KuhnLogo p={1} scale={1.05} /></div></AbsoluteFill>
  </AbsoluteFill>
);

export const STILLS: { id: string; c: React.FC; h: number }[] = [
  { id: "C1-1", c: C1S1, h: 1350 }, { id: "C1-2", c: C1S2, h: 1350 }, { id: "C1-3", c: C1S3, h: 1350 }, { id: "C1-4", c: C1S4, h: 1350 }, { id: "C1-5", c: C1S5, h: 1350 },
  { id: "C2-1", c: C2S1, h: 1350 }, { id: "C2-2", c: C2S2, h: 1350 }, { id: "C2-3", c: C2S3, h: 1350 }, { id: "C2-4", c: C2S4, h: 1350 }, { id: "C2-5", c: C2S5, h: 1350 }, { id: "C2-6", c: C2S6, h: 1350 }, { id: "C2-7", c: C2S7, h: 1350 },
  { id: "Logo", c: LogoSquare, h: 1080 }, { id: "Cover1", c: Cover1, h: 1920 }, { id: "Cover2", c: Cover2, h: 1920 },
  { id: "StoryPoll", c: StoryPoll, h: 1920 }, { id: "StoryQuestions", c: StoryQuestions, h: 1920 },
  { id: "StoryNew1", c: () => <StoryNew n={1} />, h: 1920 }, { id: "StoryNew2", c: () => <StoryNew n={2} />, h: 1920 },
];
export const STILL_W = SW;
