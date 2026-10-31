/**
 * Opinion / rant scenes (first used on Robin 04 — "le pays"). Same a8d5 language as Motion.tsx and
 * Story.tsx: dark grid, letter-by-letter titles, lime accent, chains and branches. Times are SOURCE
 * seconds, resolved with useAt().
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { blurIn, clamp, easeOut, prog } from "../lib/anim";
import { C, SF } from "../lib/tokens";
import { useAt } from "../edit/clock";
import { DarkGridBg } from "../components/Backgrounds";
import { Branch, DuoCutout, LabelBox, VLine } from "../components/Graphics";
import { Phone } from "../components/Phone";
import { Txt } from "../components/Txt";
import { fill, font } from "../components/type";

type Head = { at: number; small: string; big: string; bigAt: number };

/* ---------------- labels linked end to end ("tu mets ça bout à bout") ---------------- */

export const MdChain: React.FC<{ head: Head; links: { at: number; text: string }[]; since: Head; last: { at: number; text: string } }> = ({ head, links, since, last }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const y0 = 470;
  const step = 150;
  const lp = prog(f, at(last.at) - 1, at(last.at) + 8);
  return (
    <AbsoluteFill>
      <DarkGridBg id="chain" />
      <Txt text={head.small} role="sec" size={62} x={540} y={150} align="center" at={at(head.at)} />
      <Txt text={head.big} role="strongLime" size={150} x={540} y={214} align="center" at={at(head.bigAt) - 1} />
      {links.map((l, i) => (
        <React.Fragment key={i}>
          {i ? <VLine x={540} y={y0 + (i - 1) * step + 100} len={step - 100} at={at(l.at) - 4} dur={4} /> : null}
          <div style={{ position: "absolute", left: 540, top: y0 + i * step, translate: "-50% 0" }}>
            <LabelBox at={at(l.at) - 1}>
              <span style={{ ...font.strong, ...fill.whiteBright, fontSize: 64 }}>{l.text}</span>
            </LabelBox>
          </div>
        </React.Fragment>
      ))}
      <VLine x={540} y={y0 + (links.length - 1) * step + 100} len={110} at={at(since.at) - 6} />
      <Txt text={since.small} role="sec" size={58} x={540} y={y0 + links.length * step + 80} align="center" at={at(since.at) - 1} />
      <Txt text={since.big} role="strong" size={130} x={540} y={y0 + links.length * step + 144} align="center" at={at(since.bigAt) - 1} />
      <div
        style={{
          position: "absolute",
          left: 540,
          top: 1440,
          translate: "-50% 0",
          padding: "14px 44px 22px",
          borderRadius: 26,
          background: C.lime,
          opacity: lp,
          scale: String(1.25 - 0.25 * lp),
          filter: lp < 1 ? `blur(${(1 - lp) * 12}px)` : undefined,
          boxShadow: "0 20px 50px rgba(213,255,56,.25)",
        }}
      >
        <span style={{ ...font.strong, fontSize: 112, color: "#0A0A0A", whiteSpace: "nowrap" }}>{last.text}</span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- news alert on a lock screen ---------------- */

export const MdNews: React.FC<{ head: Head; phoneAt: number; alert: { at: number; title: string; sub: { at: number; text: string } }; punch: Head }> = ({ head, phoneAt, alert, punch }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(phoneAt);
  const rise = prog(f, a0, a0 + 14);
  const n = prog(f, at(alert.at) - 1, at(alert.at) + 9, easeOut);
  const s = prog(f, at(alert.sub.at) - 1, at(alert.sub.at) + 6);
  const buzz = Math.sin(f / 1.4) * 4 * n * (1 - prog(f, at(alert.at) + 8, at(alert.at) + 24));
  return (
    <AbsoluteFill>
      <DarkGridBg circles={{ x: 540, y: 980 }} id="news" />
      <Txt text={head.small} role="sec" size={62} x={540} y={150} align="center" at={at(head.at)} />
      <Txt text={head.big} role="strong" size={130} x={540} y={214} align="center" at={at(head.bigAt) - 1} />
      <div style={{ position: "absolute", left: 540 - 260, top: 430, translate: `0 ${(1 - rise) * 500}px`, rotate: `${buzz}deg`, opacity: Math.min(1, rise * 1.5), filter: rise < 1 ? `blur(${(1 - rise) * 16}px)` : undefined }}>
        <Phone width={520} screenOff>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 70% at 50% 0%, #2c3218 0%, #0c0c0c 70%)" }} />
          <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", fontFamily: SF, fontWeight: 500, fontSize: 40, color: "#cfcfcf" }}>en ce moment</div>
          <div
            style={{
              position: "absolute",
              left: 22,
              right: 22,
              top: 300,
              padding: "22px 24px 26px",
              borderRadius: 34,
              background: "rgba(38,38,38,.92)",
              border: "2px solid rgba(255,255,255,.08)",
              opacity: n,
              translate: `0 ${(1 - n) * -40}px`,
              scale: String(0.9 + 0.1 * n),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.lime, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={28} height={28} viewBox="0 0 24 24"><path d="M12 3L2 21h20L12 3zm0 6v6m0 2.5v.5" stroke="#0A0A0A" strokeWidth={2.6} fill="none" strokeLinecap="round" /></svg>
              </div>
              <div style={{ fontFamily: SF, fontWeight: 600, fontSize: 30, color: "#9a9a9a", letterSpacing: "0.08em" }}>ALERTE</div>
            </div>
            <div style={{ fontFamily: SF, fontWeight: 700, fontSize: 52, color: "#fff", lineHeight: 1.08, letterSpacing: "-0.02em" }}>{alert.title}</div>
            <div style={{ fontFamily: SF, fontWeight: 600, fontSize: 52, color: C.lime, lineHeight: 1.1, opacity: s }}>{alert.sub.text}</div>
          </div>
        </Phone>
      </div>
      <Txt text={punch.small} role="sec" size={60} x={540} y={1560} align="center" at={at(punch.at) - 1} />
      <Txt text={punch.big} role="strongLime" size={150} x={540} y={1622} align="center" at={at(punch.bigAt) - 1} />
    </AbsoluteFill>
  );
};

/* ---------------- roots: one attachment branching to what it holds ---------------- */

export const MdRoots: React.FC<{
  head: Head;
  left: { at: number; text: string };
  right: { at: number; text: string };
  city: { at: number; text: string; img: string; sub: { at: number; text: string } };
  end: number; // fade to black from this source time
}> = ({ head, left, right, city, end }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const hub = { x: 540, y: 560 };
  return (
    <AbsoluteFill>
      <DarkGridBg circles={{ x: hub.x, y: hub.y }} id="roots" />
      <Txt text={head.small} role="sec" size={62} x={540} y={170} align="center" at={at(head.at)} />
      <Txt text={head.big} role="strong" size={140} x={540} y={234} align="center" at={at(head.bigAt) - 1} />
      <div style={{ position: "absolute", left: hub.x - 22, top: hub.y - 22, width: 44, height: 44, borderRadius: 22, background: C.lime, boxShadow: "0 0 30px rgba(213,255,56,.7)", ...blurIn(f, at(head.bigAt), 8) }} />
      <Branch d={`M ${hub.x} ${hub.y} C ${hub.x} 760, 230 700, 230 900`} at={at(left.at) - 6} />
      <Branch d={`M ${hub.x} ${hub.y} C ${hub.x} 760, 850 700, 850 900`} at={at(right.at) - 6} />
      <Branch d={`M ${hub.x} ${hub.y} L ${hub.x} 1090`} at={at(city.at) - 6} />
      <div style={{ position: "absolute", left: 230, top: 920, translate: "-50% 0" }}>
        <LabelBox at={at(left.at) - 1}>
          <span style={{ ...font.strong, ...fill.whiteBright, fontSize: 64, whiteSpace: "nowrap" }}>{left.text}</span>
        </LabelBox>
      </div>
      <div style={{ position: "absolute", left: 850, top: 920, translate: "-50% 0" }}>
        <LabelBox at={at(right.at) - 1}>
          <span style={{ ...font.strong, ...fill.whiteBright, fontSize: 64, whiteSpace: "nowrap" }}>{right.text}</span>
        </LabelBox>
      </div>
      <DuoCutout src={city.img} width={270} at={at(city.at) - 2} id="cityImg" duotone={false} style={{ left: 405, top: 1080 }} />
      <Txt text={city.text} role="capsLime" size={150} x={540} y={1610} align="center" at={at(city.at) - 1} />
      <Txt text={city.sub.text} role="sec" size={60} x={540} y={1780} align="center" at={at(city.sub.at) - 1} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: interpolate(f, [at(end) + 4, at(end) + 26], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
