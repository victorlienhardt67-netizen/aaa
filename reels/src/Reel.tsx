import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, Video } from "@remotion/media";
import { clamp, easeOut, prog } from "./lib/anim";
import { C } from "./lib/tokens";
import { Keep, makeClock } from "./edit/cut";
import { ClockProvider, useAt } from "./edit/clock";
import { Captions, buildCaptions } from "./components/Captions";
import { DarkGridBg } from "./components/Backgrounds";
import { TopShade, shrinkCard, useFaceTransform } from "./scenes/FaceCam";
import type { Word } from "./edit/cut";
import type { Scene } from "./edit/scene";

export const TAIL = 32;

export type ReelConfig = {
  src: string; // face-cam master in public/
  words: Word[]; // transcript with fillers already dropped
  keeps: Keep[];
  scenes: Scene[];
  face: { x: number; y: number }; // zoom anchor in the 1080×1920 master
  topShade?: boolean; // darken a repaired top band
  lowerShade?: boolean; // darken the lower third where a burned-in banner was repaired (captions sit there)
};

/** Build a reel composition from its config. */
export const makeReel = (cfg: ReelConfig) => {
  const { keeps: KEEPS, scenes: SCENES, src: SRC, words: WORDS, face: FACE } = cfg;
  const clock = makeClock(KEEPS);
  const last = KEEPS[KEEPS.length - 1];
  const frames = last.outFrom + last.len + TAIL;
  const sceneEnd = (i: number) => (i < SCENES.length - 1 ? clock(SCENES[i + 1].from) : frames);
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
    // "séparation": the frame splits in two halves that drift apart around a lime crack
    const split = { k: s.split ? prog(f, at(s.split.at), at(s.split.at) + 10, easeOut) * (1 - prog(f, at(s.split.out), at(s.split.out) + 8)) : 0 };
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
            {split.k > 0 ? (
              <>
                {[-1, 1].map((side) => (
                  <AbsoluteFill
                    key={side}
                    style={{ clipPath: side < 0 ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)", translate: `${side * 46 * split.k}px ${side * 10 * split.k}px`, rotate: `${side * 1.2 * split.k}deg` }}
                  >
                    <FacePieces a={a} b={b} extendLast={isLast} />
                  </AbsoluteFill>
                ))}
                <AbsoluteFill style={{ left: "50%", width: 6, translate: "-3px 0", background: C.lime, opacity: split.k, boxShadow: "0 0 24px rgba(213,255,56,.8)" }} />
              </>
            ) : (
              <FacePieces a={a} b={b} extendLast={isLast} />
            )}
          </AbsoluteFill>
          {cfg.topShade ? <TopShade /> : null}
          {cfg.lowerShade ? <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 52%, rgba(0,0,0,.72) 66%, rgba(0,0,0,.78) 100%)" }} /> : null}
        </AbsoluteFill>
        {s.extra}
        <AbsoluteFill style={{ opacity: 1 - fadeOut }}>
          <Captions groups={groups} y={card.k > 0.5 ? 1500 : s.capY ?? 1240} />
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

  const Reel: React.FC = () => (
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

  return { Reel, frames };
};
