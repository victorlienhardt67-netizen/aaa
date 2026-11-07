/**
 * Story-telling scenes (first used on Robin 02 — the Dubai story). Same visual language as
 * Motion.tsx (a8d5 grid/type/cut-outs, lime accent); each one is a different procedure so a
 * reel never repeats itself. Times are SOURCE seconds, resolved with useAt().
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { blurIn, clamp, easeIn, easeInOut, easeOut, prog } from "../lib/anim";
import { C, H, HELV, POP, SF, W } from "../lib/tokens";
import { useAt } from "../edit/clock";
import { DarkGridBg } from "../components/Backgrounds";
import { DuoCutout, VLine } from "../components/Graphics";
import { Phone } from "../components/Phone";
import { Txt } from "../components/Txt";
import { fill, font } from "../components/type";

const shake = (f: number, a: number, amp = 10, dur = 8) => {
  const k = 1 - prog(f, a, a + dur, easeOut);
  return k > 0 && f >= a ? `${Math.sin(f * 2.7) * amp * k}px ${Math.cos(f * 3.1) * amp * k}px` : "0px 0px";
};

/* ---------------- split-flap departures board ---------------- */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const Flap: React.FC<{ ch: string; at: number; w: number; h: number; lime?: boolean }> = ({ ch, at, w, h, lime }) => {
  const f = useCurrentFrame();
  const spinning = f >= at && f < at + 7 && ch !== " ";
  const shown = f < at ? " " : spinning ? GLYPHS[Math.floor(random(`${at}-${f}`) * GLYPHS.length)] : ch;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 8,
        background: lime && !spinning && f >= at ? C.lime : "#1d1d1d",
        boxShadow: "inset 0 -2px 0 rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.06)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: HELV,
        fontWeight: 700,
        fontSize: h * 0.68,
        color: lime && !spinning && f >= at ? "#0A0A0A" : "#F2F2F2",
      }}
    >
      {shown}
      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: "rgba(0,0,0,.55)" }} />
    </div>
  );
};

const FlapWord: React.FC<{ text: string; at: number; w?: number; h?: number; lime?: boolean; stagger?: number }> = ({ text, at, w = 58, h = 86, lime, stagger = 1.4 }) => (
  <div style={{ display: "flex", gap: 6 }}>
    {Array.from(text).map((ch, i) => (
      <Flap key={i} ch={ch} at={at + i * stagger} w={w} h={h} lime={lime} />
    ))}
  </div>
);

export const MdBoard: React.FC<{
  head: { at: number; small: string; big: string; bigAt: number };
  dest: { at: number; text: string };
  status: { at: number; before: string; after: string };
  caption: { at: number; small: string; big: string; bigAt: number };
  punch: { at: number; text: string };
}> = ({ head, dest, status, caption, punch }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const p = blurIn(f, at(head.at), 10);
  const switched = f >= at(status.at);
  return (
    <AbsoluteFill style={{ translate: shake(f, at(punch.at), 12) }}>
      <DarkGridBg id="board" />
      <Txt text={head.small} role="sec" size={64} x={80} y={190} at={at(head.at)} />
      <Txt text={head.big} role="strongLime" size={150} x={70} y={252} at={at(head.bigAt) - 1} />
      <div style={{ position: "absolute", left: 60, top: 560, width: 960, padding: "34px 34px 40px", borderRadius: 34, background: "#0B0B0B", border: "2px solid #2a2a2a", boxShadow: "0 40px 80px rgba(0,0,0,.6)", ...p }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: SF, fontWeight: 600, fontSize: 40, color: "#9a9a9a", letterSpacing: "0.12em", marginBottom: 26 }}>
          <svg width={46} height={46} viewBox="0 0 24 24"><path d="M2 16l20-6-2-3-7 2-5-6H6l3 7-5 1.5-2-2H1l1 6.5z" fill="#9a9a9a" /></svg>
          DÉPARTS
        </div>
        <FlapWord text={dest.text} at={at(dest.at)} w={56} h={84} />
        <div style={{ height: 22 }} />
        <FlapWord text={switched ? status.after : status.before} at={switched ? at(status.at) : at(dest.at) + 10} w={88} h={110} lime={switched} stagger={1.8} />
        <div style={{ height: 22 }} />
        <div style={{ display: "flex", gap: 6, opacity: 0.35 }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} style={{ width: 56, height: 84, borderRadius: 8, background: "#1d1d1d" }} />
          ))}
        </div>
      </div>
      <Txt text={caption.small} role="sec" size={58} x={540} y={1270} align="center" at={at(caption.at) - 1} />
      <Txt text={caption.big} role="caps" size={112} x={540} y={1332} align="center" at={at(caption.bigAt) - 1} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1530, textAlign: "center", opacity: prog(f, at(punch.at) - 1, at(punch.at) + 3), scale: String(1.3 - 0.3 * prog(f, at(punch.at) - 1, at(punch.at) + 6)) }}>
        <span style={{ ...font.strong, ...fill.lime, fontSize: 190 }}>{punch.text}</span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- group chat on a phone ---------------- */

export const MdChat: React.FC<{ head: { at: number; small: string; big: string; bigAt: number }; title: string; msgs: { at: number; text: string }[] }> = ({ head, title, msgs }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const rise = prog(f, a0, a0 + 14);
  return (
    <AbsoluteFill>
      <DarkGridBg circles={{ x: 540, y: 1150 }} id="chat" />
      <Txt text={head.small} role="sec" size={62} x={540} y={160} align="center" at={a0} />
      <Txt text={head.big} role="strong" size={118} x={540} y={222} align="center" at={at(head.bigAt) - 1} />
      <div style={{ position: "absolute", left: 540 - 290, top: 430, translate: `0 ${(1 - rise) * 500}px`, filter: rise < 1 ? `blur(${(1 - rise) * 16}px)` : undefined }}>
        <Phone width={580} screenOff>
          <div style={{ position: "absolute", inset: 0, background: "#0d0d0d" }} />
          <div style={{ position: "absolute", top: 70, left: 0, right: 0, height: 120, borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: 18, padding: "0 30px" }}>
            <div style={{ display: "flex" }}>
              {["#D5FF38", "#8a8a8a", "#f2f2f2"].map((c, i) => (
                <div key={i} style={{ width: 56, height: 56, borderRadius: 28, background: c, border: "3px solid #0d0d0d", marginLeft: i ? -18 : 0 }} />
              ))}
            </div>
            <div style={{ fontFamily: SF, fontWeight: 600, fontSize: 38, color: "#fff" }}>{title}</div>
          </div>
          <div style={{ position: "absolute", left: 26, right: 26, top: 250, display: "flex", flexDirection: "column", gap: 24 }}>
            {msgs.map((m, i) => {
              const ma = at(m.at);
              const typing = f >= ma - 9 && f < ma;
              const p = prog(f, ma, ma + 8);
              if (f < ma - 9) return null;
              return (
                <div key={i} style={{ alignSelf: "flex-start", maxWidth: "94%", transformOrigin: "0% 100%", scale: String(typing ? 1 : 0.85 + 0.15 * p) }}>
                  <div style={{ padding: typing ? "20px 26px" : "18px 28px 22px", borderRadius: 32, borderBottomLeftRadius: 8, background: i === msgs.length - 1 ? C.lime : "#262626", color: i === msgs.length - 1 ? "#0A0A0A" : "#fff", fontFamily: SF, fontWeight: 500, fontSize: 50, lineHeight: 1.12 }}>
                    {typing ? (
                      <div style={{ display: "flex", gap: 10 }}>
                        {[0, 1, 2].map((d) => (
                          <div key={d} style={{ width: 14, height: 14, borderRadius: 7, background: "#aaa", opacity: 0.4 + 0.6 * Math.abs(Math.sin((f + d * 4) / 4)) }} />
                        ))}
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Phone>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- stamped labels (type-only b-roll) ---------------- */

export const Stamps: React.FC<{ head: string; items: { at: number; text: string; sub?: { at: number; text: string } }[] }> = ({ head, items }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const lastHit = items.reduce((acc, it) => (f >= at(it.at) - 1 ? at(it.at) - 1 : acc), -100);
  const rot = [-7, 5, -3];
  const ys = [520, 860, 1240];
  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A", translate: shake(f, lastHit + 3, 9, 7) }}>
      <div style={{ position: "absolute", top: 200, width: "100%", textAlign: "center", fontFamily: POP, fontWeight: 600, fontSize: 64, color: "#7d7d7d", letterSpacing: "-0.03em" }}>{head}</div>
      {items.map((it, i) => {
        const a = at(it.at) - 1;
        const p = prog(f, a, a + 5, easeIn);
        if (f < a) return null;
        return (
          <div key={i} style={{ position: "absolute", left: "50%", top: ys[i], translate: "-50% 0", rotate: `${rot[i]}deg`, scale: String(1.7 - 0.7 * p), opacity: Math.min(1, p * 2), filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined, textAlign: "center" }}>
            <div style={{ padding: "6px 40px 16px", border: `7px solid ${C.lime}`, borderRadius: 22, fontFamily: POP, fontWeight: 600, fontSize: Math.min(118, 1500 / it.text.length), letterSpacing: "-0.045em", color: C.lime, whiteSpace: "nowrap" }}>{it.text}</div>
            {it.sub && f >= at(it.sub.at) - 1 ? (
              <div style={{ marginTop: 10, fontFamily: POP, fontWeight: 600, fontSize: 60, color: "#F4F4F2", opacity: prog(f, at(it.sub.at) - 1, at(it.sub.at) + 4) }}>{it.sub.text}</div>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------- search: blurry → sharp ---------------- */

export const MdSearch: React.FC<{ query: string; queryAt: number; lines: { at: number; small: string; big: string; bigAt: number }; reveal: { at: number; text: string } }> = ({ query, queryAt, lines, reveal }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const r = prog(f, at(reveal.at), at(reveal.at) + 14, easeInOut);
  const typed = Math.floor(interpolate(f, [at(queryAt), at(queryAt) + query.length * 2], [0, query.length], clamp));
  const card = (child: React.ReactNode, i: number) => (
    <div key={i} style={{ width: 440, height: 560, borderRadius: 30, overflow: "hidden", background: "#1a1a1a", position: "relative", boxShadow: "0 24px 50px rgba(0,0,0,.5)", filter: `blur(${(1 - r) * 22}px) grayscale(${1 - r}) brightness(${0.55 + 0.45 * r})`, rotate: `${(i ? 3 : -3) * (1 - r)}deg` }}>
      {child}
    </div>
  );
  return (
    <AbsoluteFill>
      <DarkGridBg id="search" />
      <div style={{ position: "absolute", left: 90, right: 90, top: 200, height: 120, borderRadius: 60, background: "#1b1b1b", border: "2px solid #333", display: "flex", alignItems: "center", gap: 24, padding: "0 40px", ...blurIn(f, 0, 8) }}>
        <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth={2.4} strokeLinecap="round"><circle cx={10.5} cy={10.5} r={6.5} /><path d="M15.5 15.5L21 21" /></svg>
        <div style={{ fontFamily: SF, fontWeight: 500, fontSize: 58, color: "#fff" }}>
          {query.slice(0, typed)}
          <span style={{ opacity: Math.floor(f / 8) % 2 ? 0 : 1, color: C.lime }}>|</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 400, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 40 }}>
        {card(<Img src={staticFile("img/palm.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />, 0)}
        {card(
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg,#2c3a4a,#d9b98a)" }}>
            <Img src={staticFile("img/burj.png")} style={{ position: "absolute", left: "50%", bottom: 0, height: "96%", translate: "-50% 0" }} />
          </div>,
          1,
        )}
      </div>
      <Txt text={lines.small} role="sec" size={56} x={540} y={1060} align="center" at={at(lines.at) - 1} />
      <Txt text={lines.big} role="strong" size={92} x={540} y={1124} align="center" at={at(lines.bigAt) - 1} rate={0.7} />
      <VLine x={540} y={1250} len={110} at={at(reveal.at) - 6} />
      <Txt text={reveal.text} role="strongLime" size={140} x={540} y={1390} align="center" at={at(reveal.at) - 1} />
    </AbsoluteFill>
  );
};

/* ---------------- free fall over an aerial ---------------- */

export const MdSky: React.FC<{
  head: { at: number; small: string; big: string; bigAt: number };
  aside: { at: number; text: string };
  target: { at: number; small: string; big: string; bigAt: number };
}> = ({ head, aside, target }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const zoom = interpolate(f, [a0, a0 + 130], [1.0, 1.45], clamp);
  const ring = prog(f, at(target.bigAt), at(target.bigAt) + 14, easeInOut);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b2a33", overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: String(zoom), transformOrigin: "50% 52%" }}>
        <Img src={staticFile("img/palm.jpg")} style={{ position: "absolute", height: H, left: "50%", translate: "-50% 0", top: 0, width: "auto" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.72) 0%, rgba(0,0,0,.15) 35%, rgba(0,0,0,.15) 65%, rgba(0,0,0,.7) 100%)" }} />
      {/* wind streaks rushing up = falling */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 18 }).map((_, i) => {
          const x = random(`wx${i}`) * W;
          const sp = 40 + random(`ws${i}`) * 50;
          const y = H - ((f * sp + random(`wy${i}`) * H * 3) % (H * 1.6));
          return <line key={i} x1={x} x2={x} y1={y} y2={y + 160} stroke="#fff" strokeOpacity={0.25} strokeWidth={3} strokeLinecap="round" />;
        })}
      </svg>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={540} cy={1000} r={330} fill="none" stroke={C.lime} strokeWidth={7} strokeDasharray="36 22" pathLength={1000} opacity={ring} transform={`rotate(${f * 0.6} 540 1000)`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, translate: `${Math.sin(f / 14) * 14}px ${Math.cos(f / 11) * 10}px`, rotate: `${Math.sin(f / 18) * 3}deg` }}>
        <DuoCutout src="img/skydiver.png" width={interpolate(f, [a0, a0 + 130], [640, 760], clamp)} at={a0} id="sky" duotone={false} style={{ left: "50%", top: 720, translate: "-50% 0" }} />
      </div>
      <Txt text={head.small} role="sec" size={64} x={80} y={170} at={a0} />
      <Txt text={head.big} role="strongLime" size={140} x={70} y={232} at={at(head.bigAt) - 1} />
      <Txt text={aside.text} role="sec" size={50} x={84} y={410} at={at(aside.at) - 1} />
      <Txt text={target.small} role="sec" size={60} x={540} y={1460} align="center" at={at(target.at) - 1} />
      <Txt text={target.big} role="caps" size={150} x={540} y={1526} align="center" at={at(target.bigAt) - 1} />
    </AbsoluteFill>
  );
};

/* ---------------- calendar: days filling up ---------------- */

export const MdCalendar: React.FC<{ head: { at: number; small: string; big: string; bigAt: number }; days: { from: number; count: number; at: number; until: number }; then: { at: number; small: string; big: string; bigAt: number } }> = ({ head, days, then }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const filled = Math.floor(interpolate(f, [at(days.at), at(days.until)], [0, days.count], clamp));
  const cell = 118;
  const go = prog(f, at(then.at) - 2, at(then.at) + 10);
  return (
    <AbsoluteFill>
      <DarkGridBg id="cal" />
      <Txt text={head.small} role="sec" size={62} x={80} y={180} at={at(head.at)} />
      <Txt text={head.big} role="strongLime" size={150} x={70} y={244} at={at(head.bigAt) - 1} />
      <div style={{ position: "absolute", left: 540 - (cell * 7 + 12 * 6) / 2 - 30, top: 500, padding: 30, borderRadius: 36, background: "#0B0B0B", border: "2px solid #2a2a2a", ...blurIn(f, at(head.at), 10) }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(7, ${cell}px)`, gap: 12 }}>
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <div key={`h${i}`} style={{ textAlign: "center", fontFamily: SF, fontWeight: 600, fontSize: 36, color: "#777", paddingBottom: 6 }}>{d}</div>
          ))}
          {Array.from({ length: 35 }).map((_, i) => {
            const day = (i % 31) + 1;
            const idx = i - (days.from - 1);
            const on = idx >= 0 && idx < filled;
            return (
              <div key={i} style={{ height: cell * 0.82, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", background: on ? C.lime : "#181818", color: on ? "#0A0A0A" : i >= 31 ? "#444" : "#cfcfcf", fontFamily: SF, fontWeight: 600, fontSize: 44, scale: on && idx === filled - 1 ? "1.08" : "1" }}>
                {day}
              </div>
            );
          })}
        </div>
      </div>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path d="M 540 1270 C 540 1360, 540 1380, 540 1440" fill="none" stroke={C.lime} strokeWidth={6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - go} strokeLinecap="round" />
      </svg>
      <Txt text={then.small} role="sec" size={60} x={540} y={1470} align="center" at={at(then.at) - 1} />
      <Txt text={then.big} role="strong" size={170} x={540} y={1536} align="center" at={at(then.bigAt) - 1} />
    </AbsoluteFill>
  );
};

/* ---------------- street map with a pin and a landmark ---------------- */

export const MdMap: React.FC<{
  head: { at: number; small: string; big: string; bigAt: number };
  pin: { at: number; label: string; sub: { at: number; text: string } };
  landmark?: { at: number; small: string; big: string; bigAt: number };
}> = ({ head, pin, landmark = { at: 1e6, small: "", big: "", bigAt: 1e6 } }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const drop = prog(f, at(pin.at), at(pin.at) + 10, easeOut);
  const link = prog(f, at(landmark.at), at(landmark.at) + 14, easeInOut);
  const P = { x: 300, y: 1180 };
  const T = { x: 760, y: 1120 };
  return (
    <AbsoluteFill style={{ backgroundColor: "#0c0c0c" }}>
      <AbsoluteFill style={{ scale: String(interpolate(f, [a0, a0 + 130], [1.12, 1], clamp)), ...blurIn(f, a0, 10) }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <g transform="rotate(-28 540 960)" stroke="#262626" strokeLinecap="round">
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`h${i}`} x1={-600} x2={1700} y1={i * 210 - 300} y2={i * 210 - 300} strokeWidth={i % 3 ? 14 : 30} />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`v${i}`} y1={-600} y2={2600} x1={i * 190 - 400} x2={i * 190 - 400} strokeWidth={i % 4 ? 12 : 26} />
            ))}
          </g>
          <path d="M -50 1650 C 300 1520, 700 1700, 1150 1560" stroke="#17323a" strokeWidth={90} fill="none" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(70% 55% at 50% 58%, rgba(0,0,0,0) 0%, rgba(0,0,0,.75) 100%)" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path d={`M ${P.x} ${P.y} Q ${(P.x + T.x) / 2} ${P.y - 220} ${T.x} ${T.y - 40}`} fill="none" stroke={C.lime} strokeWidth={5} strokeDasharray="18 14" pathLength={undefined} opacity={link} />
      </svg>
      <div style={{ position: "absolute", left: T.x - 110, top: T.y - 900 + (1 - prog(f, at(landmark.at), at(landmark.at) + 12)) * 200, width: 220, opacity: prog(f, at(landmark.at), at(landmark.at) + 8) }}>
        <Img src={staticFile("img/burj.png")} style={{ width: "100%", filter: "drop-shadow(0 20px 30px rgba(0,0,0,.6))" }} />
      </div>
      <div style={{ position: "absolute", left: P.x, top: P.y, translate: `-50% ${-100 - (1 - drop) * 160}%`, opacity: drop }}>
        <svg width={110} height={150} viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.5 12 32 12 32s12-11.5 12-20.3C24 5.2 18.6 0 12 0z" fill={C.lime} /><circle cx={12} cy={11.5} r={4.5} fill="#0A0A0A" /></svg>
      </div>
      <div style={{ position: "absolute", left: P.x, top: P.y + 30, translate: "-50% 0", textAlign: "center", opacity: prog(f, at(pin.at) + 6, at(pin.at) + 12) }}>
        <div style={{ ...font.strong, ...fill.whiteBright, fontSize: 64 }}>{pin.label}</div>
        <div style={{ fontFamily: SF, fontWeight: 500, fontSize: 40, color: "#bdbdbd", opacity: prog(f, at(pin.sub.at) - 1, at(pin.sub.at) + 5) }}>{pin.sub.text}</div>
      </div>
      <Txt text={head.small} role="sec" size={62} x={80} y={170} at={a0} />
      <Txt text={head.big} role="caps" size={140} x={70} y={232} at={at(head.bigAt) - 1} />
      <Txt text={landmark.small} role="sec" size={56} x={1000} y={1420} align="right" at={at(landmark.at) - 1} />
      <Txt text={landmark.big} role="strongLime" size={112} x={1010} y={1480} align="right" at={at(landmark.bigAt) - 1} />
    </AbsoluteFill>
  );
};

/* ---------------- the tower lands like a spaceship ---------------- */

export const MdTower: React.FC<{
  a: { at: number; small: string; big: string; bigAt: number };
  b: { at: number; small: string; big: string; bigAt: number };
  land: { at: number; small: string; big: string; bigAt: number };
}> = ({ a, b, land }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(a.at);
  const tL = at(land.bigAt) - 8;
  // slow descent that keeps moving until touchdown (landing on "posé")
  const y = interpolate(f, [a0, tL], [-1650, 0], { ...clamp, easing: (t) => t * t * (1.6 - 0.6 * t) });
  const landed = f >= tL;
  const beam = interpolate(f, [a0, a0 + 10, tL, tL + 10], [0, 0.55, 0.55, 0], clamp);
  const dust = prog(f, tL, tL + 18);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(90% 60% at 50% 0%, #1d2410 0%, #050505 70%)", translate: shake(f, tL, 16, 10) }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <circle key={i} cx={random(`sx${i}`) * W} cy={random(`sy${i}`) * H * 0.8} r={1 + random(`sr${i}`) * 2} fill="#fff" opacity={0.2 + 0.5 * Math.abs(Math.sin(f / 20 + i))} />
        ))}
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.lime} stopOpacity={0.9} />
            <stop offset="1" stopColor={C.lime} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={`700,0 860,0 1010,1880 550,1880`} fill="url(#beam)" opacity={beam} />
        <rect x={0} y={1830} width={W} height={90} fill="#0a0a0a" />
        <line x1={0} x2={W} y1={1830} y2={1830} stroke={C.lime} strokeWidth={6} opacity={landed ? 1 : 0} />
        <ellipse cx={780} cy={1830} rx={120 + dust * 420} ry={20 + dust * 50} fill="#cfd8b0" opacity={landed ? 0.35 * (1 - dust) : 0} style={{ filter: "blur(18px)" }} />
      </svg>
      <div style={{ position: "absolute", left: 780, bottom: 90, translate: `-50% ${y}px`, height: 1700 }}>
        <Img src={staticFile("img/burj.png")} style={{ height: "100%", filter: `drop-shadow(0 0 ${30 * beam}px rgba(213,255,56,.8))` }} />
      </div>
      <Txt text={a.small} role="sec" size={60} x={70} y={190} at={at(a.at) - 1} />
      <Txt text={a.big} role="caps" size={96} x={64} y={252} at={at(a.bigAt) - 1} />
      <Txt text={b.small} role="sec" size={58} x={70} y={640} at={at(b.at) - 1} />
      <Txt text={b.big} role="strongLime" size={92} x={64} y={700} at={at(b.bigAt) - 1} />
      <Txt text={land.small} role="sec" size={58} x={70} y={1180} at={at(land.at) - 1} />
      <Txt text={land.big} role="strong" size={120} x={64} y={1242} at={at(land.bigAt) - 1} />
    </AbsoluteFill>
  );
};

/* ---------------- ending: one value replaced by another ---------------- */

export const MdSwap: React.FC<{ from: { at: number; small: string; big: string; bigAt: number }; strikeAt: number; to: { at: number; small: string; big: string; bigAt: number }; toSize?: number }> = ({ from, strikeAt, to, toSize = 300 }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const st = prog(f, at(strikeAt), at(strikeAt) + 8);
  const dim = 1 - 0.55 * prog(f, at(to.bigAt) - 2, at(to.bigAt) + 6);
  return (
    <AbsoluteFill>
      <DarkGridBg circles={{ x: 540, y: 1150 }} id="swap" />
      <div style={{ opacity: dim }}>
        <Txt text={from.small} role="sec" size={66} x={540} y={700} align="center" at={at(from.at)} />
        <Txt text={from.big} role="strong" size={180} x={540} y={770} align="center" at={at(from.bigAt) - 1} />
        <div style={{ position: "absolute", left: 120, top: 870, width: 840 * st, height: 18, borderRadius: 9, background: C.lime, rotate: "-4deg", transformOrigin: "0 50%" }} />
      </div>
      <Txt text={to.small} role="sec" size={62} x={540} y={1150} align="center" at={at(to.at) - 1} rate={0.7} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1230, textAlign: "center", opacity: prog(f, at(to.bigAt) - 1, at(to.bigAt) + 4), scale: String(1.35 - 0.35 * prog(f, at(to.bigAt) - 1, at(to.bigAt) + 8, easeOut)), filter: `blur(${(1 - prog(f, at(to.bigAt) - 1, at(to.bigAt) + 6)) * 14}px)` }}>
        <span style={{ ...font.strong, ...fill.lime, fontSize: toSize }}>{to.big}</span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- a year split in two halves ---------------- */

export const MdHalves: React.FC<{
  head: { at: number; small: string; big: string; bigAt: number };
  a: { at: number; small: string; big: string; bigAt: number; fill: [number, number] };
  b: { at: number; small: string; big: string; bigAt: number; fill: [number, number] };
}> = ({ head, a, b }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const cw = 64;
  const gap = 10;
  const total = cw * 12 + gap * 11;
  const x0 = (W - total) / 2;
  const nA = interpolate(f, [at(a.fill[0]), at(a.fill[1])], [0, 6], clamp);
  const nB = interpolate(f, [at(b.fill[0]), at(b.fill[1])], [0, 6], clamp);
  const half = (k: number) => x0 + (k === 0 ? total / 4 : (3 * total) / 4);
  return (
    <AbsoluteFill>
      <DarkGridBg id="halves" />
      <Txt text={head.small} role="sec" size={64} x={80} y={200} at={at(head.at)} />
      <Txt text={head.big} role="strong" size={160} x={70} y={264} at={at(head.bigAt) - 1} />
      <div style={{ position: "absolute", left: x0 - 30, top: 820, width: total + 60, height: 220, borderRadius: 36, background: "#0B0B0B", border: "2px solid #2a2a2a", ...blurIn(f, at(head.at), 10) }} />
      {Array.from({ length: 12 }).map((_, i) => {
        const inA = i < 6;
        const fillK = inA ? Math.min(1, Math.max(0, nA - i)) : Math.min(1, Math.max(0, nB - (i - 6)));
        return (
          <div key={i} style={{ position: "absolute", left: x0 + i * (cw + gap), top: 850, width: cw, height: 160, borderRadius: 16, background: "#1c1c1c", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${fillK * 100}%`, background: inA ? C.lime : "#F2F2F2" }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: W / 2 - 3, top: 800, width: 6, height: 260, borderRadius: 3, background: "#555", opacity: prog(f, at(a.at), at(a.at) + 8) }} />
      <Txt text={a.small} role="sec" size={58} x={half(0)} y={1100} align="center" at={at(a.at) - 1} />
      <Txt text={a.big} role="capsLime" size={118} x={half(0)} y={1162} align="center" at={at(a.bigAt) - 1} />
      <Txt text={b.small} role="sec" size={58} x={half(1)} y={1100} align="center" at={at(b.at) - 1} />
      <Txt text={b.big} role="caps" size={118} x={half(1)} y={1162} align="center" at={at(b.bigAt) - 1} />
    </AbsoluteFill>
  );
};

/* ---------------- two identical towers ---------------- */

const Building: React.FC<{ lit: number; pulse?: number }> = ({ lit, pulse = 0 }) => {
  const cols = 4;
  const rows = 13;
  return (
    <div style={{ width: 300, height: 940, borderRadius: "18px 18px 0 0", background: "linear-gradient(90deg,#1f1f1f,#141414)", border: `3px solid ${pulse ? C.lime : "#333"}`, boxShadow: pulse ? `0 0 ${40 * pulse}px rgba(213,255,56,${0.6 * pulse})` : "0 30px 60px rgba(0,0,0,.6)", padding: 24, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: 46, gap: 18 }}>
      {Array.from({ length: cols * rows }).map((_, i) => {
        const top = i < cols;
        return <div key={i} style={{ borderRadius: 6, background: top ? `rgba(213,255,56,${0.12 + 0.88 * lit})` : "#2a2a2a", boxShadow: top && lit ? `0 0 ${18 * lit}px rgba(213,255,56,.7)` : undefined }} />;
      })}
    </div>
  );
};

export const MdTwins: React.FC<{
  head: { at: number; small: string; big: string; bigAt: number };
  a: { at: number; litAt: number; small: string; big: string; bigAt: number };
  b: { at: number; litAt: number; small: string; big: string; bigAt: number; pulseAt: number };
  same: { at: number; text: string };
}> = ({ head, a, b, same }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const inA = blurIn(f, at(a.at), 12);
  const slide = moveBlurX(f, at(b.at), at(b.at) + 14);
  const pulse = interpolate(f, [at(b.pulseAt), at(b.pulseAt) + 6, at(b.pulseAt) + 26], [0, 1, 0.35], clamp);
  const br = prog(f, at(same.at), at(same.at) + 14, easeInOut);
  return (
    <AbsoluteFill>
      <DarkGridBg id="twins" />
      <Txt text={head.small} role="sec" size={60} x={80} y={150} at={at(head.at)} rate={0.8} />
      <Txt text={head.big} role="strong" size={128} x={70} y={210} at={at(head.bigAt) - 1} />
      <div style={{ position: "absolute", left: 160, top: 470, ...inA }}>
        <Building lit={prog(f, at(a.litAt), at(a.litAt) + 10)} />
      </div>
      <div style={{ position: "absolute", left: 620, top: 470, translate: `${slide.v}px 0`, filter: slide.blur ? `blur(${slide.blur}px)` : undefined, opacity: f >= at(b.at) ? 1 : 0 }}>
        <Building lit={prog(f, at(b.litAt), at(b.litAt) + 10)} pulse={pulse} />
      </div>
      <Txt text={a.small} role="sec" size={56} x={310} y={1430} align="center" at={at(a.bigAt) - 9} />
      <Txt text={a.big} role="strong" size={104} x={310} y={1490} align="center" at={at(a.bigAt) - 1} />
      <Txt text={b.small} role="sec" size={56} x={770} y={1430} align="center" at={at(b.bigAt) - 9} />
      <Txt text={b.big} role="strongLime" size={92} x={770} y={1494} align="center" at={at(b.bigAt) - 1} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path d="M 160 1640 L 160 1670 L 920 1670 L 920 1640" fill="none" stroke={C.lime} strokeWidth={6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - br} strokeLinejoin="round" />
      </svg>
      <Txt text={same.text} role="sec" size={60} x={540} y={1700} align="center" at={at(same.at) + 4} />
    </AbsoluteFill>
  );
};

const moveBlurX = (f: number, a: number, b: number) => {
  const v = interpolate(f, [a, b], [700, 0], { ...clamp, easing: easeOut });
  const v2 = interpolate(f + 1, [a, b], [700, 0], { ...clamp, easing: easeOut });
  return { v, blur: Math.min(20, Math.abs(v2 - v) * 0.3) };
};

/* ---------------- closing line built word by word ---------------- */

export const MdFinal: React.FC<{ lines: { at: number; text: string; role: "sec" | "strong" | "strongLime"; size: number; y: number; rate?: number }[]; punch: { at: number; text: string } }> = ({ lines, punch }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const p = prog(f, at(punch.at) - 1, at(punch.at) + 7, easeOut);
  return (
    <AbsoluteFill>
      <DarkGridBg circles={{ x: 540, y: 1200 }} id="final" />
      {lines.map((l, i) => (
        <Txt key={i} text={l.text} role={l.role} size={l.size} x={540} y={l.y} align="center" at={at(l.at) - 1} rate={l.rate} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1160, textAlign: "center", opacity: p, scale: String(1.4 - 0.4 * p), filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined }}>
        <span style={{ ...font.strong, ...fill.lime, fontSize: 320 }}>{punch.text}</span>
      </div>
    </AbsoluteFill>
  );
};
