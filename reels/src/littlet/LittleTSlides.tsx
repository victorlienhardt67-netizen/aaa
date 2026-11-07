/** Little T — visuels fixes semaine 1 : carrousels 4:5, couvertures de Reels, stories, avatar. */
import React from "react";
import { AbsoluteFill } from "remotion";
import { SF } from "../lib/tokens";
import { SteelBg } from "../scenes/Bistro";
import { Block, HAND } from "../kuhn/KuhnReel";
import { L, LTBig, LTFood, LTGrill, LTMap, LTSulfu, LTVS, LittleLogo } from "./LittleT";

const DONE = -60;
const Note: React.FC<{ text: string; x: number; y: number; size?: number; color?: string; rotate?: number }> = ({ text, x, y, size = 64, color = L.ink, rotate = -3 }) => (
  <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0", rotate: `${rotate}deg`, fontFamily: HAND, fontWeight: 700, fontSize: size, color, whiteSpace: "pre", textAlign: "center", lineHeight: 1.05 }}>{text}</div>
);
const Pager: React.FC<{ i: number; n: number; dark?: boolean }> = ({ i, n, dark }) => (
  <div style={{ position: "absolute", bottom: 56, width: "100%", display: "flex", justifyContent: "center", gap: 14 }}>
    {Array.from({ length: n }).map((_, k) => <div key={k} style={{ width: k === i ? 46 : 14, height: 14, borderRadius: 7, background: k === i ? L.red : dark ? "rgba(246,238,220,.35)" : "rgba(23,18,14,.25)" }} />)}
  </div>
);
const Handle: React.FC<{ dark?: boolean }> = ({ dark }) => <div style={{ position: "absolute", top: 56, right: 66, fontFamily: SF, fontWeight: 700, fontSize: 28, letterSpacing: 3, color: dark ? "rgba(246,238,220,.7)" : "rgba(23,18,14,.55)" }}>@LLTTLE_T</div>;
const Body: React.FC<{ text: string; y: number; dark?: boolean }> = ({ text, y, dark }) => <div style={{ position: "absolute", left: 90, right: 90, top: y, textAlign: "center", fontFamily: SF, fontWeight: 600, fontSize: 40, lineHeight: 1.3, color: dark ? L.paper : L.ink }}>{text}</div>;

/* ===== Carrousel 1 · Lundi · « Little T, ton spot burgers & tacos » (4 slides) ===== */
const N1 = 4;
export const T1S1: React.FC = () => (
  <AbsoluteFill>
    <LTGrill id="t11" />
    <div style={{ position: "absolute", top: 110, width: "100%", display: "flex", justifyContent: "center" }}><LittleLogo scale={0.7} /></div>
    <LTBig text="TON SPOT" at={DONE} y={420} size={110} />
    <LTBig text="BURGERS & TACOS" at={DONE} y={540} size={84} face={L.paper} side={L.red} rotate={2} />
    <LTFood src="burger.png" w={470} x={300} y={920} rot={-6} />
    <LTFood src="tacos.png" w={500} x={790} y={960} rot={6} />
    <LTVS at={DONE} x={545} y={930} />
    <Note text="glisse →" x={880} y={1180} color={L.paper} size={60} />
    <Pager i={0} n={N1} dark />
  </AbsoluteFill>
);
export const T1S2: React.FC = () => (
  <AbsoluteFill>
    <LTSulfu id="t12" />
    <Handle />
    <LTBig text="LES BURGERS" at={DONE} y={200} size={116} face={L.red} side={L.redDeep} />
    <LTFood src="burger.png" w={700} x={540} y={720} />
    <Body text="Pain brioché, steak, cheddar qui coule. Simple, généreux, fait pour être partagé (ou pas)." y={1090} />
    <Pager i={1} n={N1} />
  </AbsoluteFill>
);
export const T1S3: React.FC = () => (
  <AbsoluteFill>
    <SteelBg id="t13" />
    <Handle dark />
    <LTBig text="LES TACOS" at={DONE} y={200} size={124} />
    <LTFood src="tacos.png" w={900} x={540} y={720} />
    <Body text="Galette grillée, viande, frites et sauce fromagère : le combo qui cale pour la soirée." y={1090} dark />
    <Pager i={2} n={N1} dark />
  </AbsoluteFill>
);
export const T1S4: React.FC = () => (
  <AbsoluteFill>
    <LTGrill id="t14" heat={0.8} />
    <LTBig text="ON EST SUR TA ROUTE" at={DONE} y={170} size={84} />
    <LTMap ats={[DONE, DONE, DONE]} y={430} />
    <Block text="COMMANDE → LIEN EN BIO" at={DONE} x={540} y={1000} size={56} bg={L.red} fg={L.paper} rotate={-2} />
    <Pager i={3} n={N1} dark />
  </AbsoluteFill>
);

/* ===== Carrousel 2 · Jeudi · « Dis-moi ta soirée, je te dis quoi commander » (5 slides) ===== */
const N2 = 5;
export const T2S1: React.FC = () => (
  <AbsoluteFill>
    <LTSulfu id="t21" />
    <Handle />
    <LTBig text="DIS-MOI" at={DONE} y={190} size={130} face={L.red} side={L.redDeep} />
    <LTBig text="TA SOIRÉE…" at={DONE} y={330} size={110} rotate={2} />
    <Note text="…je te dis quoi commander" x={540} y={490} size={74} rotate={-3} />
    <LTFood src="sac.png" w={460} x={540} y={900} rot={-4} />
    <Note text="glisse →" x={880} y={1180} size={60} />
    <Pager i={0} n={N2} />
  </AbsoluteFill>
);
const Mood: React.FC<{ i: number; id: string; mood: string; arrow: string; img: string; w: number; note: string; dark?: boolean }> = ({ i, id, mood, arrow, img, w, note, dark }) => (
  <AbsoluteFill>
    {dark ? <LTGrill id={id} heat={0.8} /> : <LTSulfu id={id} />}
    <Handle dark={dark} />
    <Note text={mood} x={540} y={170} size={84} color={dark ? L.paper : L.ink} rotate={-3} />
    <LTBig text={arrow} at={DONE} y={300} size={96} face={dark ? L.cheddar : L.red} side={dark ? L.redDeep : L.redDeep} rotate={2} />
    <LTFood src={img} w={w} x={540} y={760} />
    <Body text={note} y={1100} dark={dark} />
    <Pager i={i} n={N2} dark={dark} />
  </AbsoluteFill>
);
export const T2S2: React.FC = () => <Mood i={1} id="t22" mood="soirée match entre potes" arrow="→ LES BURGERS" img="burger.png" w={640} note="Un chacun, et on goûte celui du voisin." dark />;
export const T2S3: React.FC = () => <Mood i={2} id="t23" mood="grosse journée, grosse faim" arrow="→ LE TACOS" img="tacos.png" w={880} note="Viande, frites, sauce fromagère : ça cale jusqu'au lendemain." />;
export const T2S4: React.FC = () => <Mood i={3} id="t24" mood="flemme de cuisiner" arrow="→ À EMPORTER" img="sac.png" w={460} note="Tu commandes, tu passes, c'est prêt." dark />;
export const T2S5: React.FC = () => (
  <AbsoluteFill>
    <LTSulfu id="t25" />
    <LTBig text="ET TOI," at={DONE} y={260} size={130} face={L.red} side={L.redDeep} />
    <LTBig text="C'EST QUELLE SOIRÉE ?" at={DONE} y={410} size={76} rotate={2} />
    <div style={{ position: "absolute", left: 540, top: 640, translate: "-50% 0", background: L.paper, border: `6px solid ${L.ink}`, borderRadius: 40, padding: "26px 44px", boxShadow: "10px 12px 0 rgba(23,18,14,.9)" }}>
      <span style={{ fontFamily: SF, fontWeight: 700, fontSize: 50, color: L.ink, whiteSpace: "nowrap" }}>💬 réponds en commentaire</span>
    </div>
    <Block text="COMMANDE → LIEN EN BIO" at={DONE} x={540} y={900} size={56} bg={L.red} fg={L.paper} rotate={-2} />
    <Note text="📲 envoie ce post au pote qui hésite toujours" x={540} y={1060} size={52} rotate={-2} />
    <Pager i={4} n={N2} />
  </AbsoluteFill>
);

/* ===== Couvertures + stories + avatar ===== */
export const LTCover1: React.FC = () => (
  <AbsoluteFill>
    <LTGrill id="lc1" />
    <LTBig text="BURGER" at={DONE} y={430} size={160} />
    <LTBig text="OU TACOS ?" at={DONE} y={610} size={130} face={L.paper} side={L.red} rotate={2} />
    <LTFood src="burger.png" w={460} x={300} y={1060} rot={-6} />
    <LTFood src="tacos.png" w={480} x={790} y={1090} rot={6} />
    <LTVS at={DONE} x={545} y={1080} />
  </AbsoluteFill>
);
export const LTCover2: React.FC = () => (
  <AbsoluteFill>
    <SteelBg id="lc2" />
    <LTBig text="LE TACOS" at={DONE} y={430} size={150} />
    <LTBig text="EN 4 ÉTAPES" at={DONE} y={600} size={110} face={L.paper} side={L.red} rotate={2} />
    <LTFood src="tacos.png" w={900} x={540} y={1050} rot={-4} />
  </AbsoluteFill>
);
export const LTStoryPoll: React.FC = () => (
  <AbsoluteFill>
    <LTGrill id="ls1" />
    <LTBig text="CE SOIR" at={DONE} y={300} size={150} />
    <LTBig text="T'ES TEAM QUOI ?" at={DONE} y={470} size={96} face={L.paper} side={L.red} rotate={2} />
    <LTFood src="burger.png" w={420} x={290} y={880} rot={-6} />
    <LTFood src="tacos.png" w={460} x={800} y={910} rot={6} />
    <Note text="place le sondage ici ↓" x={540} y={1180} size={62} color={L.paper} />
    <div style={{ position: "absolute", left: 140, right: 140, top: 1280, height: 230, border: "4px dashed rgba(246,238,220,.5)", borderRadius: 30 }} />
  </AbsoluteFill>
);
export const LTStoryQ: React.FC = () => (
  <AbsoluteFill>
    <LTSulfu id="ls2" />
    <LTBig text="TON TACOS" at={DONE} y={300} size={140} face={L.red} side={L.redDeep} />
    <LTBig text="IDÉAL ?" at={DONE} y={460} size={120} rotate={2} />
    <LTFood src="galette.png" w={700} x={540} y={850} />
    <Note text={"viande, sauce, frites…\ndis-nous tout 👇"} x={540} y={1100} size={70} />
    <div style={{ position: "absolute", left: 140, right: 140, top: 1300, height: 280, border: "4px dashed rgba(23,18,14,.4)", borderRadius: 30 }} />
  </AbsoluteFill>
);
export const LTStoryNew: React.FC<{ n: 1 | 2 }> = ({ n }) => (
  <AbsoluteFill>
    <LTGrill id={`lsn${n}`} heat={0.9} />
    <LTBig text="NOUVELLE VIDÉO" at={DONE} y={300} size={100} />
    <Note text={n === 1 ? "burger ou tacos :\nle grand débat" : "le tacos, monté\nen 4 étapes"} x={540} y={450} size={72} color={L.paper} />
    <div style={{ position: "absolute", left: 210, right: 210, top: 680, height: 760, border: "4px dashed rgba(246,238,220,.5)", borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: SF, fontWeight: 700, fontSize: 30, color: "rgba(246,238,220,.6)", letterSpacing: 3 }}>PARTAGER LE REEL ICI</div>
    </div>
  </AbsoluteFill>
);
export const LTStoryOpen: React.FC = () => (
  <AbsoluteFill>
    <LTSulfu id="lso" />
    <LTBig text="CE SOIR," at={DONE} y={300} size={140} face={L.red} side={L.redDeep} />
    <LTBig text="ON T'ATTEND" at={DONE} y={460} size={110} rotate={2} />
    <LTFood src="sac.png" w={460} x={540} y={900} />
    <div style={{ position: "absolute", left: 140, right: 140, top: 1220, height: 220, border: "4px dashed rgba(23,18,14,.4)", borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: SF, fontWeight: 700, fontSize: 30, color: "rgba(23,18,14,.5)", letterSpacing: 3 }}>HORAIRES + ADRESSE (STICKER)</div>
    </div>
  </AbsoluteFill>
);
export const LTAvatar: React.FC = () => (
  <AbsoluteFill>
    <LTGrill id="lav" heat={0.9} />
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><LittleLogo scale={0.95} /></AbsoluteFill>
  </AbsoluteFill>
);

export const LT_STILLS: { id: string; c: React.FC; h: number }[] = [
  { id: "LT-C1-1", c: T1S1, h: 1350 }, { id: "LT-C1-2", c: T1S2, h: 1350 }, { id: "LT-C1-3", c: T1S3, h: 1350 }, { id: "LT-C1-4", c: T1S4, h: 1350 },
  { id: "LT-C2-1", c: T2S1, h: 1350 }, { id: "LT-C2-2", c: T2S2, h: 1350 }, { id: "LT-C2-3", c: T2S3, h: 1350 }, { id: "LT-C2-4", c: T2S4, h: 1350 }, { id: "LT-C2-5", c: T2S5, h: 1350 },
  { id: "LT-Cover1", c: LTCover1, h: 1920 }, { id: "LT-Cover2", c: LTCover2, h: 1920 },
  { id: "LT-StoryPoll", c: LTStoryPoll, h: 1920 }, { id: "LT-StoryQuestions", c: LTStoryQ, h: 1920 }, { id: "LT-StoryOpen", c: LTStoryOpen, h: 1920 },
  { id: "LT-StoryNew1", c: () => <LTStoryNew n={1} />, h: 1920 }, { id: "LT-StoryNew2", c: () => <LTStoryNew n={2} />, h: 1920 },
  { id: "LT-Avatar", c: LTAvatar, h: 1080 },
];
