import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { blurIn, blurOut, clamp, easeInOut, easeOut, moveBlur, prog } from "../lib/anim";
import { C, H, W } from "../lib/tokens";
import { useAt } from "../edit/clock";
import { DarkGridBg, LightGridBg } from "../components/Backgrounds";
import { Branch, Curve, DashedArc, DuoCutout, LabelBox, VLine } from "../components/Graphics";
import { Feed, Phone, PostGrid } from "../components/Phone";
import { Txt } from "../components/Txt";
import { fill, font } from "../components/type";

const FEED = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * 0.6–3.5 s — hook. a8d5 "highlights covers" passage: phone rises out of focus into the
 * centre of concentric circles, small italic + big bold title types on above it, dashed
 * accent arc, overlapping two-size caption on the lower screen. Feed scrolls fast and settles.
 */
export const MdHook: React.FC = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(0.62);
  const rise = moveBlur(f, a0, a0 + 14, 520, 0, easeOut);
  const scroll = moveBlur(f, at(0.95), at(2.35), 0, 1620, easeInOut);
  return (
    <AbsoluteFill>
      <DarkGridBg circles={{ x: 540, y: 1060 }} id="hook" />
      <Curve d="M 1120 -60 C 860 260, 700 120, 520 380 S 180 760, -80 640" at={a0} dur={18} />
      <div style={{ position: "absolute", left: 540 - 235, top: 560, translate: `0 ${rise.v}px`, scale: String(interpolate(f, [a0, a0 + 14], [0.82, 1], { ...clamp, easing: easeOut })), filter: `blur(${rise.blur}px)` }}>
        <Phone width={470}>
          <Feed width={437} scroll={scroll.v} tiles={FEED} blur={scroll.blur * 0.5} />
        </Phone>
      </div>
      <DashedArc cx={540} cy={1060} r={420} from={-72} to={18} at={at(1.7)} />
      <Txt text="le 47ᵉ" role="sec" size={70} x={250} y={330} at={at(0.94) - 1} />
      <Txt text="scroll" role="strongLime" size={156} x={238} y={384} at={at(1.58) - 1} />
      <Txt text="n'est pas sans" role="secInk" size={54} x={540} y={1268} align="center" at={at(2.4) - 1} glow />
      <Txt text="CONSÉQUENCE" role="strongInk" size={80} x={540} y={1322} align="center" at={at(2.8) - 1} glow />
    </AbsoluteFill>
  );
};

/** 11.8–15.6 s — a8d5 "your LAST / 9posts / show proof | Results" chain, with a draining gauge in the box. */
export const MdHormones: React.FC = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const drain = interpolate(f, [at(14.44), at(15.6)], [1, 0.1], { ...clamp, easing: easeInOut });
  return (
    <AbsoluteFill>
      <DarkGridBg id="horm" />
      <Curve d="M -60 520 C 200 420, 260 120, 520 60 S 900 -20, 1140 120" at={at(11.82)} dur={16} />
      <Txt text="t'es en train de" role="sec" size={58} x={990} y={150} align="right" at={at(11.82)} />
      <Txt text="DÉRÉGLER" role="caps" size={124} x={1000} y={205} align="right" at={at(12.36) - 1} />
      <DuoCutout src="img/brain.png" width={560} at={at(12.5)} id="brainH" style={{ left: 260, top: 410 }} />
      <Txt text="ton système" role="strongLime" size={66} x={540} y={930} align="center" at={at(12.78) - 1} />
      <Txt text="hormonal" role="strongItalic" size={132} x={540} y={986} align="center" at={at(13.22) - 1} />
      <VLine x={540} y={1140} len={110} at={at(13.62)} />
      <Txt text="vider tes stocks de" role="sec" size={56} x={540} y={1270} align="center" at={at(14.44) - 1} />
      <div style={{ position: "absolute", left: 540, top: 1350, translate: "-50% 0" }}>
        <LabelBox at={at(15.1)}>
          <div style={{ ...font.strong, ...fill.lime, fontSize: 100, lineHeight: 1.05 }}>dopamine</div>
          <div style={{ height: 14, marginTop: 8, borderRadius: 7, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
            <div style={{ width: `${drain * 100}%`, height: "100%", background: C.lime }} />
          </div>
        </LabelBox>
      </div>
    </AbsoluteFill>
  );
};

/** 16.9–22.2 s — diagram: wake→sleep curve, the hypnagogic window boxed with a dashed accent. */
export const MdHypno: React.FC = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const win = prog(f, at(17.62), at(17.62) + 14);
  const pulse = interpolate(f, [at(20.38), at(20.38) + 8, at(20.38) + 24], [0, 1, 0.25], clamp);
  return (
    <AbsoluteFill>
      <DarkGridBg id="hyp" />
      <Txt text="il y a une" role="sec" size={62} x={110} y={230} at={at(16.94)} />
      <Txt text="fenêtre de tir" role="strongLime" size={134} x={96} y={292} at={at(17.18) - 1} />
      <Curve d="M 40 760 C 300 740, 380 760, 470 820 S 620 1150, 760 1170 S 960 1180, 1060 1175" at={at(17.0)} dur={24} width={4} drift={0} opacity={1} />
      <Txt text="éveil" role="sec" size={46} x={70} y={680} at={at(17.3)} />
      <Txt text="sommeil" role="sec" size={46} x={1010} y={1210} align="right" at={at(17.42)} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <rect x={420} y={640} width={270} height={620} rx={18} fill={C.lime} opacity={0.08 * win + 0.14 * pulse} />
        <rect x={420} y={640} width={270} height={620} rx={18} fill="none" stroke={C.lime} strokeWidth={6} strokeDasharray="30 18" pathLength={1000} strokeDashoffset={0} opacity={win} style={{ filter: `drop-shadow(0 0 ${8 + pulse * 18}px rgba(213,255,56,${0.4 + pulse * 0.5}))` }} />
      </svg>
      <VLine x={555} y={1262} len={60} at={at(18.4)} />
      <Txt text="la fenêtre" role="sec" size={58} x={555} y={1340} align="center" at={at(18.3) - 1} />
      <Txt text="HYPNAGOGIQUE" role="caps" size={104} x={555} y={1398} align="center" at={at(18.68) - 1} />
      <VLine x={555} y={1515} len={70} at={at(20.9)} />
      <Txt text="la plus" role="sec" size={52} x={555} y={1600} align="center" at={at(21.02) - 1} />
      <div style={{ position: "absolute", left: 555, top: 1660, translate: "-50% 0" }}>
        <LabelBox at={at(21.3)}>
          <div style={{ ...font.strong, ...fill.lime, fontSize: 92, lineHeight: 1.05 }}>importante</div>
        </LabelBox>
      </div>
    </AbsoluteFill>
  );
};

/** 29.7–34.3 s — a8d5 "CONSISTENT BRANDING → same colors / same fonts" branching. */
export const MdSleep: React.FC = () => {
  const at = useAt();
  return (
    <AbsoluteFill>
      <DarkGridBg circles={{ x: 540, y: 560 }} id="slp" />
      <DuoCutout src="img/brain.png" width={520} at={at(29.66)} id="brainS" style={{ left: 280, top: 300 }} />
      <Txt text="c'est ça que ton cerveau va" role="sec" size={58} x={540} y={800} align="center" at={at(29.68)} rate={0.8} />
      <Txt text="traiter" role="strongLime" size={158} x={540} y={856} align="center" at={at(30.8) - 1} />
      <Branch d="M 540 1050 C 540 1250, 270 1230, 270 1420" at={at(31.54)} />
      <Branch d="M 540 1050 C 540 1250, 810 1230, 810 1420" at={at(33.0)} />
      <Txt text="sommeil" role="sec" size={60} x={270} y={1450} align="center" at={at(32.06) - 1} />
      <Txt text="PROFOND" role="caps" size={96} x={270} y={1516} align="center" at={at(32.34) - 1} />
      <Txt text="sommeil" role="sec" size={60} x={810} y={1450} align="center" at={at(33.4) - 1} />
      <Txt text="PARADOXAL" role="capsLime" size={80} x={800} y={1522} align="center" at={at(33.7) - 1} />
      <Curve d="M -40 1800 C 300 1700, 500 1880, 760 1790 S 1000 1660, 1140 1720" at={at(31.0)} dur={20} opacity={0.6} />
    </AbsoluteFill>
  );
};

/**
 * 35.4–40.1 s — the validated test passage. Page 1 = a8d5 "highlights covers" (phone, title,
 * arc, caption on the screen). Page 2 = a8d5 "#3 → your LAST / 9posts / show proof | Results"
 * (phone resolves into the post grid, chain builds down, statue cut-out rises at the bottom).
 */
export const MdInsta: React.FC = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(35.38);
  const enter = moveBlur(f, a0, a0 + 14, 1, 0, easeOut);
  const page1Out = blurOut(f, at(37.98), 6);
  const p2 = at(38.04);
  const grid = blurIn(f, p2, 10, 22);
  return (
    <AbsoluteFill>
      <DarkGridBg circles={f < p2 ? { x: 540, y: 1060 } : null} id="ins" />
      {f < p2 + 1 ? (
        <AbsoluteFill style={page1Out}>
          <div
            style={{
              position: "absolute",
              left: 540 - 240,
              top: 560,
              translate: `${-260 * enter.v}px ${420 * enter.v}px`,
              rotate: `${-10 * enter.v}deg`,
              filter: `blur(${enter.blur * 1.2}px)`,
            }}
          >
            <Phone width={480}>
              <Feed width={446} scroll={interpolate(f, [a0, a0 + 120], [600, 700])} tiles={[10, 11, 12, 13, 14, 15]} />
            </Phone>
          </div>
          <DashedArc cx={540} cy={1060} r={430} from={-75} to={20} at={at(36.7)} />
          <Txt text="dans ta main," role="sec" size={64} x={230} y={330} at={at(35.92) - 1} />
          <Txt text="instagram" role="strongLime" size={150} x={218} y={392} at={at(36.46) - 1} />
          <Txt text="tu crois que c'est" role="secInk" size={54} x={540} y={1300} align="center" at={at(36.94) - 1} glow />
          <Txt text="GRATUIT" role="strongInk" size={128} x={540} y={1356} align="center" at={at(37.36) - 1} glow />
        </AbsoluteFill>
      ) : null}
      {f >= p2 ? (
        <AbsoluteFill>
          <Curve d="M 1140 260 C 880 300, 820 520, 640 560 S 300 520, -60 760" at={p2} dur={16} />
          <Txt text="ça n'est pas" role="sec" size={58} x={990} y={150} align="right" at={at(38.2) - 1} />
          <Txt text="GRATUIT" role="caps" size={124} x={1000} y={205} align="right" at={at(38.52) - 1} />
          <div style={{ position: "absolute", left: 540 - 220, top: 370, ...grid, scale: String(interpolate(f, [p2, p2 + 12], [1.25, 1], { ...clamp, easing: easeOut })) }}>
            <PostGrid width={440} tiles={[10, 11, 12, 13, 14, 15, 16, 17, 18]} />
          </div>
          <Txt text="parce que c'est" role="strongLime" size={64} x={540} y={850} align="center" at={at(38.78) - 1} rate={0.7} />
          <Txt text="toi" role="strongItalic" size={176} x={540} y={900} align="center" at={at(39.28) - 1} rate={1.5} />
          <VLine x={540} y={1086} len={86} at={at(39.36)} />
          <div style={{ position: "absolute", left: 540, top: 1180, translate: "-50% 0" }}>
            <LabelBox at={at(39.42)}>
              <div style={{ ...font.strong, ...fill.lime, fontSize: 96, lineHeight: 1.05 }}>le produit</div>
            </LabelBox>
          </div>
          <DuoCutout src="img/statue.png" width={640} at={at(39.3)} id="statue" style={{ left: 470, top: 1360 }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------- 54.9–58.2 s : typographic sentence with inline picture cards (7014 reference) ---------- */

const Card: React.FC<{ at: number; w: number; kind: "moon" | "sun" | "feed" }> = ({ at, w, kind }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + 10, easeInOut);
  const h = 136;
  return (
    <div style={{ width: w * p, height: h, display: "inline-block", verticalAlign: "middle", margin: `0 ${12 * p}px`, borderRadius: 26, overflow: "hidden", position: "relative", boxShadow: "0 12px 26px rgba(0,0,0,.28)", background: kind === "moon" ? "#0B0B0B" : kind === "sun" ? C.lime : "#fff" }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", translate: "-50% -50%", scale: String(0.6 + 0.4 * p), rotate: `${(1 - p) * -20}deg` }}>
        {kind === "moon" ? (
          <svg width={70} height={70} viewBox="0 0 100 100"><path d="M70 12a40 40 0 1 0 18 52A32 32 0 1 1 70 12z" fill={C.lime} /></svg>
        ) : kind === "sun" ? (
          <svg width={78} height={78} viewBox="0 0 100 100"><circle cx={50} cy={50} r={20} fill="#0A0A0A" />{Array.from({ length: 8 }).map((_, i) => <rect key={i} x={47} y={6} width={6} height={16} rx={3} fill="#0A0A0A" transform={`rotate(${i * 45} 50 50)`} />)}</svg>
        ) : (
          <div style={{ width: w, height: h, overflow: "hidden" }}><PostGrid width={w} tiles={[1, 2, 3, 4, 5, 6, 7, 8, 9]} gap={3} /></div>
        )}
      </div>
    </div>
  );
};

const Wd: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + 6);
  return (
    <span style={{ display: "inline-block", opacity: interpolate(p, [0, 0.4], [0, 1], clamp), translate: `0 ${(1 - p) * 30}px`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined, verticalAlign: "middle", ...style }}>
      {children}
    </span>
  );
};

export const MdRules: React.FC = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const t = (s: number) => at(s) - 1;
  const line: React.CSSProperties = { ...font.pop, fontSize: 112, color: "#0B0B0B", lineHeight: 1.22, whiteSpace: "nowrap", textAlign: "center" };
  const strike = prog(f, at(57.95), at(57.95) + 8);
  const lift = interpolate(f, [at(57.18), at(57.18) + 12], [0, -60], { ...clamp, easing: easeInOut });
  return (
    <AbsoluteFill>
      <LightGridBg id="rules" />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", translate: `0 ${lift}px` }}>
        <div style={line}>
          <Wd at={t(54.94)}>pas de</Wd> <Wd at={t(55.12)}>téléphone</Wd>
        </div>
        <div style={line}>
          <Card at={t(55.52)} w={190} kind="moon" />
          <Wd at={t(55.52)}>le soir,</Wd>
        </div>
        <div style={{ ...line, marginTop: 40 }}>
          <Wd at={t(56.22)}>pas de</Wd> <Wd at={t(56.4)}>téléphone</Wd>
        </div>
        <div style={line}>
          <Card at={t(56.76)} w={190} kind="sun" />
          <Wd at={t(56.76)}>le matin</Wd>
        </div>
        <div style={{ ...line, marginTop: 40, fontSize: 96 }}>
          <Wd at={t(57.18)}>et surtout</Wd> <Wd at={t(57.66)}>pas de</Wd>
        </div>
        <div style={{ ...line, fontSize: 210, position: "relative" }}>
          <Card at={t(57.66)} w={210} kind="feed" />
          <Wd at={t(57.9)} style={{ position: "relative" }}>
            scroll.
            <span style={{ position: "absolute", left: "-3%", top: "54%", height: 22, width: `${106 * strike}%`, background: C.lime, borderRadius: 11, mixBlendMode: "multiply" }} />
          </Wd>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** 58.2–63.1 s — editorial cut-out on paper + reward chips + stacked "encore" build. */
export const MdRat: React.FC = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const mark = prog(f, at(59.12), at(59.12) + 8);
  const hearts = [
    { x: 150, y: 560 },
    { x: 860, y: 520 },
    { x: 90, y: 860 },
    { x: 900, y: 830 },
    { x: 480, y: 470 },
  ];
  const enc = [
    { s: 61.76, size: 110, y: 1330 },
    { s: 62.14, size: 150, y: 1450 },
    { s: 62.52, size: 200, y: 1600 },
  ];
  return (
    <AbsoluteFill>
      <LightGridBg id="rat" />
      <Txt text="sinon, tu vas être" role="secInk" size={58} x={96} y={200} at={at(58.6) - 6} />
      <div style={{ position: "absolute", left: 782, top: 270, width: 250 * mark, height: 150, background: C.lime }} />
      <Txt text="comme un" role="strongInk" size={140} x={88} y={262} at={at(58.78) - 1} />
      <Txt text="rat" role="strongInk" size={140} x={800} y={262} at={at(59.12) - 1} />
      <div style={{ position: "absolute", inset: 0, filter: "grayscale(1) contrast(1.15)" }}>
        <DuoCutout src="img/rat.png" width={820} at={at(58.66)} id="rat" duotone={false} style={{ left: 130, top: 470 }} />
      </div>
      {hearts.map((h, i) => {
        const a = at(60.86) + i * 4;
        const p = prog(f, a, a + 8);
        const fl = interpolate(f, [a, a + 60], [0, -40], clamp);
        return (
          <div key={i} style={{ position: "absolute", left: h.x, top: h.y + fl, width: 92, height: 92, borderRadius: 26, background: C.lime, boxShadow: "0 10px 24px rgba(0,0,0,.25)", display: "flex", alignItems: "center", justifyContent: "center", scale: String(p), rotate: `${(i % 2 ? 8 : -8) * p}deg` }}>
            <svg width={52} height={52} viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9.3-8.7C1.2 8.4 2.7 5 6 5c2 0 3.3 1.1 4 2.3h4C14.7 6.1 16 5 18 5c3.3 0 4.8 3.4 3.3 6.3C19 15.6 12 20 12 20z" fill="#0A0A0A" /></svg>
          </div>
        );
      })}
      <Txt text="dans sa cage" role="secInk" size={60} x={540} y={1000} align="center" at={at(59.42) - 1} />
      <Txt text="à la recherche de" role="secInk" size={52} x={540} y={1100} align="center" at={at(59.88) - 1} />
      <Txt text="micro-récompenses" role="strongInk" size={100} x={540} y={1158} align="center" at={at(60.86) - 1} rate={0.8} />
      {enc.map((e, i) => {
        const a = at(e.s) - 1;
        const p = prog(f, a, a + 7);
        const last = i === enc.length - 1;
        return (
          <div key={i} style={{ position: "absolute", left: 540, top: e.y, translate: `-50% ${(1 - p) * 50}px`, opacity: p, filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined, ...font.pop, fontSize: e.size, lineHeight: 1, color: "#0B0B0B", padding: last ? "0 34px 14px" : 0, background: last ? C.lime : "transparent" }}>
            encore{i < 2 ? "," : ""}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
