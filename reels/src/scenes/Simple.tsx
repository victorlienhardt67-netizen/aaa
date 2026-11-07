/**
 * "Simplicity" scenes (first used on Robin 06). Object-driven, new procedures only: technical
 * call-outs cluttering an object, a receipt printing, a flipped sentence, a quote card, an object
 * shedding its buttons into its simple twin, a maze straightening into one line, a final button press.
 * Times are SOURCE seconds (useAt()).
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { clamp, easeIn, easeInOut, easeOut, prog } from "../lib/anim";
import { C, H, HELV, POP, SF, W } from "../lib/tokens";
import { useAt } from "../edit/clock";
import { Txt } from "../components/Txt";

type Line = { at: number; text: string };
type Head = { at: number; small: string; big: string; bigAt: number };

const spring = (f: number, a: number, dur = 18) => {
  const t = Math.max(0, Math.min(1, (f - a) / dur));
  return f < a ? 0 : 1 - Math.exp(-6 * t) * Math.cos(9 * t);
};

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

/* ---------------- 1. technical call-outs cluttering an object ---------------- */

export const MdOverload: React.FC<{ head: Head; callouts: Line[] }> = ({ head, callouts }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const drop = spring(f, a0, 18);
  const lastAt = at(callouts[callouts.length - 1].at);
  const clutter = prog(f, at(head.bigAt), lastAt + 10, easeIn);
  const jit = clutter * 3;
  const obj = { x: 760, y: 1000, w: 380 };
  const anchors = [
    { ax: 700, ay: 700, lx: 500, ly: 700, right: true },
    { ax: 760, ay: 1000, lx: 500, ly: 1000, right: true },
    { ax: 700, ay: 1300, lx: 500, ly: 1300, right: true },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#080808", overflow: "hidden" }}>
      {/* blueprint-like dimension clutter multiplying */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 34 }).map((_, i) => {
          const show = random(`k${i}`) < clutter;
          if (!show) return null;
          const x1 = 80 + random(`x1${i}`) * 920;
          const y1 = 560 + random(`y1${i}`) * 900;
          const horiz = random(`h${i}`) > 0.5;
          const len = 60 + random(`l${i}`) * 220;
          const x2 = horiz ? x1 + len : x1;
          const y2 = horiz ? y1 : y1 + len;
          return (
            <g key={i} stroke="rgba(255,255,255,.28)" strokeWidth={2} fill="none">
              <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray="6 6" />
              <line x1={x1 - (horiz ? 0 : 10)} y1={y1 - (horiz ? 10 : 0)} x2={x1 + (horiz ? 0 : 10)} y2={y1 + (horiz ? 10 : 0)} />
              <line x1={x2 - (horiz ? 0 : 10)} y1={y2 - (horiz ? 10 : 0)} x2={x2 + (horiz ? 0 : 10)} y2={y2 + (horiz ? 10 : 0)} />
              <text x={(x1 + x2) / 2 + 8} y={(y1 + y2) / 2 - 8} fill="rgba(255,255,255,.35)" stroke="none" fontFamily={SF} fontSize={20}>
                {`${Math.floor(random(`n${i}`) * 90 + 10)}.${Math.floor(random(`m${i}`) * 9)}`}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: obj.x - obj.w / 2, top: obj.y - 520, width: obj.w, translate: `${(random(`jx${f}`) - 0.5) * jit}px ${(1 - drop) * -1500 + (random(`jy${f}`) - 0.5) * jit}px` }}>
        <Img src={staticFile("img/remote_complex.png")} style={{ width: "100%", display: "block", filter: "drop-shadow(0 40px 50px rgba(0,0,0,.7))" }} />
      </div>
      {/* call-outs */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {callouts.map((c, i) => {
          const a = anchors[i % anchors.length];
          const p = prog(f, at(c.at) - 4, at(c.at) + 4, easeOut);
          if (p <= 0) return null;
          const ex = a.ax + (a.lx - a.ax) * p;
          const ey = a.ay + (a.ly - a.ay) * p;
          return (
            <g key={i}>
              <circle cx={a.ax} cy={a.ay} r={12} fill={C.lime} />
              <circle cx={a.ax} cy={a.ay} r={22 + 8 * Math.sin(f / 4)} fill="none" stroke={C.lime} strokeWidth={3} opacity={0.6} />
              <polyline points={`${a.ax},${a.ay} ${(a.ax + ex) / 2},${ey} ${ex},${ey}`} fill="none" stroke={C.lime} strokeWidth={4} />
            </g>
          );
        })}
      </svg>
      {callouts.map((c, i) => {
        const a = anchors[i % anchors.length];
        const p = prog(f, at(c.at), at(c.at) + 6);
        return (
          <div key={i} style={{ position: "absolute", left: a.right ? undefined : a.lx, right: a.right ? W - a.lx + 10 : undefined, top: a.ly - 74, opacity: p, translate: `0 ${(1 - p) * 20}px`, fontFamily: HELV, fontWeight: 700, fontSize: 52, letterSpacing: "-0.035em", color: "#F4F4F2", whiteSpace: "nowrap" }}>
            {c.text}
          </div>
        );
      })}
      <Txt text={head.small} role="sec" size={60} x={540} y={150} align="center" at={a0} />
      <Txt text={head.big} role="strongLime" size={140} x={540} y={214} align="center" at={at(head.bigAt) - 1} />
    </AbsoluteFill>
  );
};

/* ---------------- 2. a receipt printing what you think you'll get ---------------- */

export const MdReceipt: React.FC<{ head: Line; items: Line[]; foot: Line }> = ({ head, items, foot }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const lines = [head, ...items, foot];
  const printed = lines.filter((l) => f >= at(l.at) - 2).length;
  const lh = 175;
  const paper = interpolate(f, [at(head.at) - 6, at(foot.at) + 6], [120, 140 + lines.length * lh], clamp);
  const feed = f >= at(head.at) - 6 && f <= at(foot.at) + 6 ? Math.sin(f * 2.2) * 1.5 : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b0b", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(60% 45% at 50% 35%, rgba(255,255,255,.10), rgba(0,0,0,0) 70%)" }} />
      {/* paper coming out of the slot */}
      <div style={{ position: "absolute", left: 90, width: 900, top: 300, height: paper, translate: `${feed}px 0`, background: "linear-gradient(180deg,#e6e6e2,#fbfbf8 30%)", boxShadow: "0 30px 60px rgba(0,0,0,.6)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,.025) 0 2px, rgba(0,0,0,0) 2px 6px)" }} />
        {lines.map((l, i) => {
          const on = i < printed;
          const p = prog(f, at(l.at) - 2, at(l.at) + 4);
          const isHead = i === 0;
          const isFoot = i === lines.length - 1;
          // newest line sits at the top, near the slot: the paper grows downwards
          const y = paper - (i + 1) * lh;
          return (
            <div key={i} style={{ position: "absolute", left: 50, right: 50, top: y + 40, opacity: on ? p : 0, display: "flex", alignItems: "baseline", gap: 18, borderBottom: isHead ? "3px dashed #0A0A0A" : undefined, paddingBottom: isHead ? 18 : 0 }}>
              {!isHead && !isFoot ? <span style={{ fontFamily: HELV, fontWeight: 700, fontSize: 76, color: "#0A0A0A", background: C.lime, padding: "0 12px", borderRadius: 8 }}>+</span> : null}
              <span style={{ fontFamily: isHead || isFoot ? SF : HELV, fontWeight: isHead || isFoot ? 600 : 700, fontSize: isHead || isFoot ? 52 : 66, letterSpacing: isHead ? "0.12em" : "-0.03em", textTransform: isHead ? "uppercase" : undefined, color: "#0A0A0A", whiteSpace: "nowrap", fontStyle: isFoot ? "italic" : undefined }}>
                {l.text}
              </span>
            </div>
          );
        })}
        {/* torn zigzag edge */}
        <svg width={900} height={30} style={{ position: "absolute", bottom: -1, left: 0 }}>
          <polygon points={Array.from({ length: 46 }, (_, i) => `${i * 20},${i % 2 ? 30 : 10}`).join(" ") + " 900,30 0,30"} fill="#0b0b0b" />
        </svg>
      </div>
      {/* printer slot */}
      <div style={{ position: "absolute", left: 40, width: 1000, top: 230, height: 90, borderRadius: 24, background: "linear-gradient(180deg,#3a3a3a,#141414)", boxShadow: "0 20px 40px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.12)" }}>
        <div style={{ position: "absolute", left: 50, right: 50, bottom: 14, height: 10, borderRadius: 5, background: "#050505" }} />
        <div style={{ position: "absolute", right: 34, top: 22, width: 16, height: 16, borderRadius: 8, background: C.lime, opacity: Math.floor(f / 6) % 2 ? 1 : 0.4 }} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 3. type only: the sentence flips upside down ("tout le contraire") ---------------- */

export const TxFlip: React.FC<{ head: Head; flipAt: number; tail: Line }> = ({ head, flipAt, tail }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const fl = prog(f, at(flipAt), at(flipAt) + 12, easeInOut);
  const dark = fl > 0.5;
  return (
    <AbsoluteFill style={{ backgroundColor: dark ? "#0A0A0A" : "#F1F1EF", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", rotate: `${fl * 180}deg` }}>
        <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 70, letterSpacing: "-0.04em", color: dark ? "#9a9a9a" : "#555", opacity: prog(f, at(head.at) - 1, at(head.at) + 5) }}>{head.small}</div>
        <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 112, letterSpacing: "-0.06em", lineHeight: 0.95, color: dark ? C.lime : "#0A0A0A", opacity: prog(f, at(head.bigAt) - 1, at(head.bigAt) + 5) }}>{head.big}</div>
      </div>
      <div style={{ position: "absolute", bottom: 560, width: "100%", textAlign: "center", fontFamily: POP, fontWeight: 600, fontSize: 70, letterSpacing: "-0.04em", color: "#F4F4F2", opacity: prog(f, at(tail.at) - 1, at(tail.at) + 5) }}>{tail.text}</div>
    </AbsoluteFill>
  );
};

/* ---------------- 4. quote card ---------------- */

export const TxQuote: React.FC<{ lead: Line; words: Line[] }> = ({ lead, words }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const q = spring(f, at(lead.at), 16);
  return (
    <AbsoluteFill style={{ backgroundColor: C.lime, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 60, top: 300, fontFamily: POP, fontWeight: 600, fontSize: 520, lineHeight: 1, color: "#0A0A0A", opacity: 0.9, scale: String(q), transformOrigin: "20% 30%" }}>“</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 220, textAlign: "center", fontFamily: SF, fontWeight: 500, fontStyle: "italic", fontSize: 58, color: "#0A0A0A", opacity: prog(f, at(lead.at) - 1, at(lead.at) + 6) }}>{lead.text}</div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 760, display: "flex", flexWrap: "wrap", gap: "0 36px", fontFamily: POP, fontWeight: 600, fontSize: 230, letterSpacing: "-0.06em", lineHeight: 0.95, color: "#0A0A0A" }}>
        {words.map((w, i) => {
          const p = prog(f, at(w.at) - 1, at(w.at) + 6);
          return (
            <span key={i} style={{ display: "inline-block", opacity: p, translate: `0 ${(1 - p) * 60}px`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined }}>
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 5. the complex object sheds its buttons into its simple twin ---------------- */

export const MdStrip: React.FC<{ head: Head; who: Line; brand: Line; result: { at: number; small: string; big: string; bigAt: number }; pressAt: Line }> = ({ head, who, brand, result, pressAt }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const t = at(result.bigAt) - 4;
  const burst = prog(f, t, t + 16, easeOut);
  const gone = prog(f, t, t + 6);
  const rise = prog(f, t + 4, t + 18, easeOut);
  const press = f >= at(pressAt.at) ? Math.exp(-(f - at(pressAt.at)) / 5) : 0;
  const ring = prog(f, at(pressAt.at), at(pressAt.at) + 20);
  const shake = f < t && f > t - 14 ? (random(`s${f}`) - 0.5) * 10 * prog(f, t - 14, t) : 0;
  const ox = 540;
  const oy = 960;
  return (
    <AbsoluteFill style={{ backgroundColor: "#F6F6F4", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(50% 35% at 50% 50%, #ffffff 0%, rgba(255,255,255,0) 70%)" }} />
      <Grain id="strip" opacity={0.15} />
      <div style={{ position: "absolute", left: ox - 300, top: oy + 360, width: 600, height: 60, borderRadius: "50%", background: "rgba(0,0,0,.18)", filter: "blur(24px)" }} />
      {/* complex remote */}
      <div style={{ position: "absolute", left: ox - 200, top: oy - 500, width: 400, opacity: 1 - gone, translate: `${shake}px 0`, filter: gone ? `blur(${gone * 12}px)` : undefined, scale: String(1 + gone * 0.1) }}>
        <Img src={staticFile("img/remote_complex.png")} style={{ width: "100%", display: "block" }} />
      </div>
      {/* flying buttons */}
      {f >= t
        ? Array.from({ length: 40 }).map((_, i) => {
            const ang = random(`a${i}`) * Math.PI * 2;
            const d = (300 + random(`d${i}`) * 700) * burst;
            const x = ox + (random(`sx${i}`) - 0.5) * 260 + Math.cos(ang) * d;
            const y = oy - 120 + (random(`sy${i}`) - 0.5) * 700 + Math.sin(ang) * d + burst * burst * 300;
            const s = 26 + random(`s${i}`) * 28;
            return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s * 0.7, borderRadius: 8, rotate: `${burst * 400 * (random(`r${i}`) - 0.5)}deg`, background: random(`c${i}`) > 0.85 ? C.lime : "#2a2a2a", opacity: 1 - burst * 0.6, boxShadow: "0 6px 10px rgba(0,0,0,.25)" }} />;
          })
        : null}
      {/* simple remote */}
      <div style={{ position: "absolute", left: ox - 170, top: oy - 470, width: 340, opacity: rise, translate: `0 ${(1 - rise) * 160}px`, scale: String(1 - press * 0.03) }}>
        <Img src={staticFile("img/remote_simple.png")} style={{ width: "100%", display: "block", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.25))" }} />
      </div>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={ox} cy={600} r={60 + ring * 380} fill="none" stroke={C.lime} strokeWidth={8} opacity={(1 - ring) * (f >= at(pressAt.at) ? 1 : 0)} />
      </svg>
      <Txt text={head.small} role="secInk" size={60} x={540} y={150} align="center" at={a0} />
      <Txt text={head.big} role="strongInk" size={120} x={540} y={214} align="center" at={at(head.bigAt) - 1} />
      <Txt text={who.text} role="secInk" size={52} x={540} y={360} align="center" at={at(who.at) - 1} />
      <Txt text={brand.text} role="strongInk" size={88} x={540} y={420} align="center" at={at(brand.at) - 1} />
      <Txt text={result.small} role="secInk" size={60} x={540} y={1480} align="center" at={at(result.at) - 1} />
      <div style={{ position: "absolute", left: "50%", top: 1550, translate: "-50% 0", padding: "6px 34px 16px", background: "#0A0A0A", opacity: prog(f, at(result.bigAt) - 1, at(result.bigAt) + 6), whiteSpace: "nowrap" }}>
        <span style={{ fontFamily: HELV, fontWeight: 700, fontSize: 140, letterSpacing: "-0.045em", color: C.lime }}>{result.big}</span>
      </div>
      <Txt text={pressAt.text} role="secInk" size={60} x={540} y={1760} align="center" at={at(pressAt.at) - 1} />
    </AbsoluteFill>
  );
};

/* ---------------- 6. a maze the cursor wanders through, then one straight line ---------------- */

const MAZE = "M 140 760 L 140 1000 L 360 1000 L 360 820 L 560 820 L 560 1120 L 260 1120 L 260 1300 L 700 1300 L 700 900 L 940 900 L 940 1180 L 820 1180 L 820 1420 L 940 1420";
const STRAIGHT = { a: { x: 140, y: 1090 }, b: { x: 940, y: 1090 } };

const pointOn = (pts: number[][], k: number) => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((s, x) => s + x, 0);
  let d = k * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) {
      const r = segs[i] ? d / segs[i] : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};

export const MdMaze: React.FC<{ head: Head; ux: Line; simple: { at: number; small: string; big: string; bigAt: number } }> = ({ head, ux, simple }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const pts = MAZE.replace(/[ML]/g, "").trim().split(/\s+/).reduce<number[][]>((acc, v, i, arr) => (i % 2 ? acc : [...acc, [Number(v), Number(arr[i + 1])]]), []);
  const wander = prog(f, a0, at(simple.at) - 2, (t) => t);
  const st = prog(f, at(simple.bigAt) - 4, at(simple.bigAt) + 10, easeInOut);
  const zip = prog(f, at(simple.bigAt) + 6, at(simple.bigAt) + 16, easeInOut);
  const [mx, my] = pointOn(pts, wander);
  const cx = st > 0 ? STRAIGHT.a.x + (STRAIGHT.b.x - STRAIGHT.a.x) * zip : mx;
  const cy = st > 0 ? interpolate(st, [0, 1], [my, STRAIGHT.a.y]) : my;
  return (
    <AbsoluteFill style={{ backgroundColor: "#090909", overflow: "hidden" }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="mzg" width={60} height={60} patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={2} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#mzg)" />
        {/* maze walls around the path */}
        <g opacity={1 - st} stroke="rgba(255,255,255,.55)" strokeWidth={6} fill="none" strokeLinecap="round">
          <path d={MAZE} transform="translate(-50 -50)" />
          <path d={MAZE} transform="translate(50 50)" />
        </g>
        <path d={MAZE} fill="none" stroke="rgba(213,255,56,.35)" strokeWidth={10} strokeDasharray="4 18" strokeLinecap="round" opacity={1 - st} />
        <line x1={STRAIGHT.a.x} y1={STRAIGHT.a.y} x2={STRAIGHT.a.x + (STRAIGHT.b.x - STRAIGHT.a.x) * st} y2={STRAIGHT.b.y} stroke={C.lime} strokeWidth={14} strokeLinecap="round" />
        <circle cx={STRAIGHT.a.x} cy={st > 0 ? STRAIGHT.a.y : 760} r={18} fill="#F4F4F2" />
        <circle cx={STRAIGHT.b.x} cy={st > 0 ? STRAIGHT.b.y : 1420} r={22} fill={C.lime} />
      </svg>
      <div style={{ position: "absolute", left: cx - 140, top: cy - 6, width: 150, rotate: `${-10 + Math.sin(f / 5) * 4 * (1 - st)}deg`, filter: "drop-shadow(0 16px 18px rgba(0,0,0,.6))" }}>
        <Img src={staticFile("img/cursor.png")} style={{ width: "100%", display: "block" }} />
      </div>
      <Txt text={head.small} role="sec" size={60} x={540} y={170} align="center" at={a0} />
      <Txt text={head.big} role="strong" size={140} x={540} y={234} align="center" at={at(head.bigAt) - 1} />
      <Txt text={ux.text} role="sec" size={58} x={540} y={410} align="center" at={at(ux.at) - 1} />
      <Txt text={simple.small} role="sec" size={60} x={540} y={1560} align="center" at={at(simple.at) - 1} />
      <Txt text={simple.big} role="strongLime" size={140} x={540} y={1624} align="center" at={at(simple.bigAt) - 1} />
    </AbsoluteFill>
  );
};

/* ---------------- 7. final: one button, pressed ---------------- */

export const MdPress: React.FC<{ head: Head; end: { at: number; small: string; big: string; bigAt: number }; endAt: number }> = ({ head, end, endAt }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const a0 = at(head.at);
  const rise = prog(f, a0, a0 + 16, easeOut);
  const pt = at(end.bigAt);
  const press = f >= pt ? Math.exp(-(f - pt) / 4) : 0;
  const glow = prog(f, pt - 2, pt + 10);
  const rings = [0, 8, 16].map((d) => prog(f, pt + d, pt + d + 26));
  const fade = interpolate(f, [at(endAt) + 6, at(endAt) + 28], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(40% 30% at 50% 27%, rgba(213,255,56,${0.22 * glow}) 0%, rgba(0,0,0,0) 70%)` }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {rings.map((r, i) => (
          <circle key={i} cx={540} cy={520} r={70 + r * 520} fill="none" stroke={C.lime} strokeWidth={5} opacity={(1 - r) * (f >= pt ? 0.9 : 0)} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 540 - 190, top: 400, width: 380, opacity: rise, translate: `0 ${(1 - rise) * 500 + press * 14}px`, filter: `drop-shadow(0 50px 60px rgba(0,0,0,.8)) brightness(${0.9 + 0.2 * glow})` }}>
        <Img src={staticFile("img/remote_simple.png")} style={{ width: "100%", display: "block" }} />
      </div>
      <Txt text={head.small} role="sec" size={60} x={540} y={150} align="center" at={a0} />
      <Txt text={head.big} role="strong" size={110} x={540} y={214} align="center" at={at(head.bigAt) - 1} />
      <Txt text={end.small} role="sec" size={64} x={540} y={1460} align="center" at={at(end.at) - 1} />
      <Txt text={end.big} role="strongLime" size={104} x={540} y={1530} align="center" at={at(end.bigAt) - 1} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
