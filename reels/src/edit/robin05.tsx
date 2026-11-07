/**
 * Robin 05 — podcast extract "2,5 millions par mois". 16:9 (720p) with burned-in captions, cleaned by
 * tools/clean_subs.py then reframed to 9:16 by tools/reframe.py (robin05.shots.json).
 * Guest (white shirt) tells the figure; Robin reacts "c'est énorme… aux US et encore".
 * Plan in SOURCE seconds.
 */
import React from "react";
import words from "./robin05.words.json";
import { computeKeeps, dropWords, Word } from "./cut";
import type { Scene } from "./scene";
import type { ReelConfig } from "../Reel";
import { MdCart, MdGauge, MdJar, MdVitrine, ZoomWord } from "../scenes/Growth";

// fillers removed from the edit (source ranges)
const DROP: [number, number][] = [
  [3.86, 4.28], // "euh,"
  [19.82, 20.68], // "Ouais, ouais." (back-channel)
];

// dial of img/gauge.png: centre and radius as fractions of the image width, sweep in degrees (0 = up)
const DIAL = { cx: 0.5, cy: 0.5, r: 0.36, a0: -130, a1: 130 };

const ALL = words as Word[];
const WORDS = dropWords(ALL, DROP);
const KEEPS = computeKeeps(ALL, { start: 0.1, end: 21.62, drop: DROP });

const SCENES: Scene[] = [
  {
    kind: "md",
    from: 0.1,
    node: (
      <MdGauge
        lead={{ at: 0.22, text: "on est monté à un peu plus de" }}
        dial={DIAL}
        climb={{ from: 0.4, to: 1.64 }}
        figure={{ at: 1.1, value: 2.5, unit: "millions", unitAt: 1.68 }}
        span={{ at: 3.0, text: "en 4 ou 5 mois" }}
      />
    ),
  },
  {
    kind: "md",
    from: 4.4,
    node: (
      <MdJar
        head={{ at: 4.42, small: "dans les", big: "compléments", bigAt: 4.68, big2: "alimentaires", big2At: 5.02 }}
        where={{ at: 5.68, text: "en France" }}
        pills={[
          { at: 6.3, text: "de la marge," },
          { at: 7.3, text: "la rétention" },
          { at: 8.44, text: "etc." },
        ]}
      />
    ),
  },
  {
    kind: "fc",
    from: 9.0,
    zooms: [{ at: 9.0, scale: 1.0 }, { at: 9.52, scale: 1.22, push: 10 }],
    caps: [{ from: 9.04, small: "donc ça a été", big: "très rapide.", accent: true }],
  },
  {
    kind: "tx",
    from: 10.32,
    node: <ZoomWord small="c'est" word="énorme." first={10.36} second={11.04} />,
  },
  {
    kind: "md",
    from: 11.46,
    node: (
      <MdVitrine
        lead={{ at: 11.48, text: "comme chiffre en France," }}
        plaqueA={{ at: 12.28, small: "c'est", big: "inhabituel.", bigAt: 12.36 }}
        plaqueB={{ at: 12.78, small: "ça, c'est des trucs", big: "aux US", bigAt: 13.34, note: { at: 13.76, text: "et encore." } }}
        echo={{ at: 14.12, text: "ouais, aux US," }}
      />
    ),
  },
  {
    kind: "fc",
    from: 15.54,
    zooms: [{ at: 15.54, scale: 1.0 }, { at: 15.94, scale: 1.12 }],
    caps: [
      { from: 15.26, small: "c'est", big: "normal, mais..." },
      { from: 15.94, small: "enfin normal,", big: "on s'entend," },
    ],
  },
  {
    kind: "md",
    from: 16.9,
    node: (
      <MdCart
        head={{ at: 16.92, small: "mais c'est plus", big: "normalisé", bigAt: 17.68 }}
        who={{ at: 18.22, small: "dans les gens qui maîtrisent bien", big: "le e-commerce.", bigAt: 19.32 }}
        boxesAt={18.88}
      />
    ),
  },
  {
    kind: "fc",
    from: 20.68,
    zooms: [{ at: 20.68, scale: 1.0 }, { at: 20.7, scale: 1.14, push: 24 }],
    caps: [{ from: 20.7, small: "en France,", big: "ça ne l'est pas.", accent: true }],
  },
];

export const ROBIN05: ReelConfig = {
  src: "media/robin05_916.mp4",
  words: WORDS,
  keeps: KEEPS,
  scenes: SCENES,
  face: { x: 540, y: 600 },
};
