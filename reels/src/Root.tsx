import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { fontsReady } from "./lib/fonts";
import { FPS, H, W } from "./lib/tokens";
import { makeReel } from "./Reel";
import { REEL01 } from "./edit/reel01";
import { ROBIN02 } from "./edit/robin02";
import { ROBIN04 } from "./edit/robin04";
import { ROBIN05 } from "./edit/robin05";
import { ROBIN06 } from "./edit/robin06";
import { ROBIN07 } from "./edit/robin07";
import { ROBIN08 } from "./edit/robin08";

const handle = delayRender("fonts");
fontsReady.then(() => continueRender(handle));

const reels = [
  { id: "Reel01", ...makeReel(REEL01) },
  { id: "Robin02", ...makeReel(ROBIN02) },
  { id: "Robin04", ...makeReel(ROBIN04) },
  { id: "Robin05", ...makeReel(ROBIN05) },
  { id: "Robin06", ...makeReel(ROBIN06) },
  { id: "Robin07", ...makeReel(ROBIN07) },
  { id: "Robin08", ...makeReel(ROBIN08) },
];

export const Root: React.FC = () => (
  <>
    {reels.map((r) => (
      <Composition key={r.id} id={r.id} component={r.Reel} durationInFrames={r.frames} fps={FPS} width={W} height={H} />
    ))}
  </>
);
