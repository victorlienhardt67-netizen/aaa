import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { fontsReady } from "./lib/fonts";
import { FPS, H, W } from "./lib/tokens";
import { REEL_FRAMES, Reel } from "./Reel";

const handle = delayRender("fonts");
fontsReady.then(() => continueRender(handle));

export const Root: React.FC = () => (
  <>
    <Composition id="Reel01" component={Reel} durationInFrames={REEL_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
