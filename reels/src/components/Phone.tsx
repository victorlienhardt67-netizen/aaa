import React from "react";
import { Img, staticFile } from "remotion";

/** Modern phone mock (the reference uses a black-frame iPhone with dynamic island). */
export const Phone: React.FC<{ width: number; children?: React.ReactNode; style?: React.CSSProperties; screenOff?: boolean }> = ({
  width,
  children,
  style,
  screenOff,
}) => {
  const h = width * 2.06;
  const bezel = width * 0.035;
  const r = width * 0.16;
  return (
    <div
      style={{
        width,
        height: h,
        borderRadius: r,
        padding: bezel,
        background: "linear-gradient(135deg,#4a4a4a 0%,#111 18%,#050505 60%,#2b2b2b 100%)",
        boxShadow: "0 30px 70px rgba(0,0,0,0.65), inset 0 0 0 2px #5a5a5a",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: r - bezel,
          overflow: "hidden",
          position: "relative",
          background: screenOff ? "linear-gradient(160deg,#1c1c1c,#050505)" : "#fff",
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: width * 0.03,
            left: "50%",
            translate: "-50% 0",
            width: width * 0.3,
            height: width * 0.085,
            borderRadius: width,
            background: "#000",
          }}
        />
      </div>
    </div>
  );
};

const Icon: React.FC<{ d: string; s: number }> = ({ d, s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const HEART = "M12 20s-7-4.4-9.3-8.7C1.2 8.4 2.7 5 6 5c2 0 3.3 1.1 4 2.3h4C14.7 6.1 16 5 18 5c3.3 0 4.8 3.4 3.3 6.3C19 15.6 12 20 12 20z";
const BUBBLE = "M20 12a8 8 0 1 1-3.2-6.4A8 8 0 0 1 20 12zM20 20l-2.5-3.2";
const SEND = "M21 4L3 11l7 3 3 7 8-17zM10 14l11-10";

/**
 * Generic photo-feed screen built in code (no real account, no fake numbers).
 * `scroll` is in px of feed content.
 */
export const Feed: React.FC<{ width: number; scroll: number; tiles: number[]; blur?: number }> = ({ width, scroll, tiles, blur = 0 }) => {
  const u = width / 100;
  const postH = u * 8 + width + u * 16;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: u * 15 - scroll, filter: blur ? `blur(${blur}px)` : undefined }}>
        {tiles.map((t, i) => (
          <div key={i} style={{ height: postH }}>
            <div style={{ display: "flex", alignItems: "center", gap: u * 2.4, height: u * 8, padding: `0 ${u * 3}px` }}>
              <div style={{ width: u * 5.5, height: u * 5.5, borderRadius: "50%", background: "linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)", padding: u * 0.5 }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#ddd", border: `${u * 0.5}px solid #fff` }} />
              </div>
              <div style={{ width: u * (18 + ((i * 7) % 14)), height: u * 1.7, borderRadius: u, background: "#d8d8d8" }} />
            </div>
            <Img src={staticFile(`img/tile${String(t).padStart(2, "0")}.jpg`)} style={{ width, height: width, objectFit: "cover", display: "block" }} />
            <div style={{ display: "flex", gap: u * 3.5, padding: `${u * 2.5}px ${u * 3}px ${u}px` }}>
              <Icon d={HEART} s={u * 6.5} />
              <Icon d={BUBBLE} s={u * 6.5} />
              <Icon d={SEND} s={u * 6.5} />
            </div>
            <div style={{ marginLeft: u * 3, width: u * 40, height: u * 1.6, borderRadius: u, background: "#e2e2e2" }} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: u * 14, background: "#fff", borderBottom: "1px solid #eee" }}>
        <div style={{ position: "absolute", left: u * 4, bottom: u * 2.5, width: u * 26, height: u * 3.4, borderRadius: u, background: "#111" }} />
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: u * 13, background: "#fff", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: u * 5.5, height: u * 5.5, borderRadius: i === 4 ? "50%" : u * 1.2, border: `${u * 0.6}px solid #111` }} />
        ))}
      </div>
    </div>
  );
};

/** Feed post photo laid out as the 3×3 grid of a profile (reference "9 posts" block). */
export const PostGrid: React.FC<{ width: number; tiles: number[]; gap?: number }> = ({ width, tiles, gap = 4 }) => {
  const s = (width - gap * 4) / 3;
  return (
    <div style={{ width, padding: gap, background: "#fff", display: "flex", flexWrap: "wrap", gap, boxShadow: "0 18px 40px rgba(0,0,0,.55)" }}>
      {tiles.slice(0, 9).map((t) => (
        <Img key={t} src={staticFile(`img/tile${String(t).padStart(2, "0")}.jpg`)} style={{ width: s, height: s, objectFit: "cover" }} />
      ))}
    </div>
  );
};
