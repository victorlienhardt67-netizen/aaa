import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { fontsReady } from "./lib/fonts";
import { FPS, H, W } from "./lib/tokens";
import { makeReel } from "./Reel";
import { REEL01 } from "./edit/reel01";
import { ROBIN02 } from "./edit/robin02";

const handle = delayRender("fonts");
fontsReady.then(() => continueRender(handle));

const reels = [
  { id: "Reel01", ...makeReel(REEL01) },
  { id: "Robin02", ...makeReel(ROBIN02) },
];

export const Root: React.FC = () => (
  <>
    {reels.map((r) => (
      <Composition key={r.id} id={r.id} component={r.Reel} durationInFrames={r.frames} fps={FPS} width={W} height={H} />
    ))}
  </>
);
