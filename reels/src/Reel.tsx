import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, Video } from "@remotion/media";
import { clamp, easeOut } from "./lib/anim";
import { Keep, makeClock } from "./edit/cut";
import { ClockProvider, useAt } from "./edit/clock";
import { Captions, buildCaptions } from "./components/Captions";
import { DarkGridBg } from "./components/Backgrounds";
import { FACE, TopShade, shrinkCard, useFaceTransform } from "./scenes/FaceCam";
import { KEEPS, SCENES, SRC, Scene, WORDS } from "./edit/reel01";

export const TAIL = 32;
const clock = makeClock(KEEPS);
const last = KEEPS[KEEPS.length - 1];
export const REEL_FRAMES = last.outFrom + last.len + TAIL;

const sceneEnd = (i: number) => (i < SCENES.length - 1 ? clock(SCENES[i + 1].from) : REEL_FRAMES);
const sceneStart = (i: number) => (i === 0 ? 0 : clock(SCENES[i].from));

/** Muted face-cam pieces that fall inside [a, b) of the output timeline (local to the scene). */
const FacePieces: React.FC<{ a: number; b: number; extendLast?: boolean }> = ({ a, b, extendLast }) => (
  <>
    {KEEPS.filter((k) => k.outFrom < b && k.outFrom + k.len > a).map((k: Keep) => {
      const isLast = k === last;
      return (
        <Sequence key={k.outFrom} from={k.outFrom - a} durationInFrames={k.len + (isLast && extendLast ? TAIL : 0)} layout="none">
          <Video src={staticFile(SRC)} trimBefore={k.srcInFrame} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      );
    })}
  </>
);

const FaceScene: React.FC<{ s: Extract<Scene, { kind: "fc" }>; a: number; b: number; isLast: boolean }> = ({ s, a, b, isLast }) => {
  const f = useCurrentFrame();
  const at = useAt();
  const zoom = useFaceTransform(s.zooms ?? []);
  // raccord: every return to the face lands with a short focus pull
  const land = interpolate(f, [0, 6], [1, 0], { ...clamp, easing: easeOut });
  const card = s.card ? shrinkCard(f, at(s.card.at), at(s.card.out)) : { k: 0, scale: 1, radius: 0, y: 0 };
  // the scene's last caption group stays until the scene cuts away
  const groups = buildCaptions(WORDS, s.caps, Infinity);
  const fadeOut = isLast ? interpolate(f, [b - a - 16, b - a], [0, 1], clamp) : 0;
  return (
    <AbsoluteFill>
      {card.k > 0 ? <DarkGridBg id={`card${a}`} /> : null}
      <AbsoluteFill
        style={{
          scale: String(card.scale),
          translate: `0 ${card.y}px`,
          borderRadius: card.radius,
          overflow: "hidden",
          boxShadow: card.k ? "0 40px 90px rgba(0,0,0,.6)" : undefined,
        }}
      >
        <AbsoluteFill
          style={{
            scale: String(zoom * (1 + 0.06 * land)),
            transformOrigin: `${(FACE.x / 1080) * 100}% ${(FACE.y / 1920) * 100}%`,
            filter: land > 0.02 ? `blur(${land * 10}px)` : undefined,
          }}
        >
          <FacePieces a={a} b={b} extendLast={isLast} />
        </AbsoluteFill>
        <TopShade />
      </AbsoluteFill>
      {s.extra}
      <AbsoluteFill style={{ opacity: 1 - fadeOut }}>
        <Captions groups={groups} y={card.k > 0.5 ? 1500 : 1240} />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeOut }} />
    </AbsoluteFill>
  );
};

/** Slow constant push-in on graphic scenes so a held layout never looks frozen. */
const Drift: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ scale: String(interpolate(f, [0, dur], [1, 1.035])) }}>{children}</AbsoluteFill>;
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {KEEPS.map((k) => (
      <Sequence key={`a${k.outFrom}`} from={k.outFrom} durationInFrames={k.len} layout="none">
        <Audio
          src={staticFile(SRC)}
          trimBefore={k.srcInFrame}
          volume={(f: number) => interpolate(f, [0, 2, k.len - 2, k.len], [0, 1, 1, 0], clamp)}
        />
      </Sequence>
    ))}
    {SCENES.map((s, i) => {
      const a = sceneStart(i);
      const b = sceneEnd(i);
      const local = (src: number) => clock(src) - a;
      return (
        <Sequence key={i} from={a} durationInFrames={b - a} name={`${s.kind} ${s.from}`}>
          <ClockProvider clock={local}>
            {s.kind === "fc" ? <FaceScene s={s} a={a} b={b} isLast={i === SCENES.length - 1} /> : <Drift dur={b - a}>{s.node}</Drift>}
          </ClockProvider>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
