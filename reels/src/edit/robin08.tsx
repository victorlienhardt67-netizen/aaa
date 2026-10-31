/**
 * Robin 08 — "l'anti-vente". 9:16 face-cam with a burned-in title banner and word-by-word
 * subtitles, removed by tools/clean_overlays.py (repaired zone darkened by lowerShade).
 * No new generated images (credits exhausted): reuses tv.png and cursor.png with new procedures.
 */
import React from "react";
import words from "./robin08.words.json";
import { computeKeeps, Word } from "./cut";
import type { Scene } from "./scene";
import type { ReelConfig } from "../Reel";
import { MdFlock, MdTvCta, TxAnti, TxCompound } from "../scenes/Sales";

const WORDS = (words as Word[]).map((w) => (w.t.startsWith("Hormozy") ? { ...w, t: w.t.replace("Hormozy", "Hormozi") } : w));
const KEEPS = computeKeeps(WORDS, { start: 0.02, end: 26.84 });

const SCENES: Scene[] = [
  {
    kind: "fc",
    from: 0.02,
    zooms: [{ at: 0, scale: 1.0 }, { at: 0.56, scale: 1.12 }],
    caps: [{ from: 0.06, small: "pour moi, c'est la", big: "nouvelle stratégie.", accent: true }],
  },
  {
    kind: "tx",
    from: 1.4,
    node: (
      <TxCompound
        head={{ at: 1.46, small: "ce qu'a fait", big: "Hormozi", bigAt: 1.74 }}
        long={{ at: 2.9, text: "sur le long terme" }}
        word="confiance"
        from={2.9}
        to={5.9}
      />
    ),
  },
  {
    kind: "fc",
    from: 6.17,
    zooms: [{ at: 6.1, scale: 1.0 }],
    caps: [{ from: 6.18, small: "parce que si", big: "demain j'arrive," }],
  },
  {
    kind: "md",
    from: 7.54,
    node: (
      <MdTvCta
        head={{ at: 7.56, small: "ma prochaine", big: "vidéo YouTube", bigAt: 8.02 }}
        endAt={10.66}
        cta={{ at: 10.82, text: "Réserver un call" }}
        collapseAt={13.56}
        fall={{ at: 13.3, small: "il y a tout qui", big: "s'effondre.", bigAt: 13.56 }}
      />
    ),
  },
  {
    kind: "fc",
    from: 14.52,
    zooms: [{ at: 14.5, scale: 1.0 }, { at: 15.9, scale: 1.12 }, { at: 17.86, scale: 1.22, push: 12 }],
    caps: [
      { from: 14.56, small: "et ça, aujourd'hui,", big: "le edge que j'ai," },
      { from: 15.9, small: "le capital", big: "confiance et sympathie" },
      { from: 17.16, small: "que j'ai créé avec cette", big: "première brique.", accent: true },
    ],
  },
  {
    kind: "md",
    from: 18.7,
    node: (
      <MdFlock
        head={{ at: 18.92, small: "je me dis que ça serait très", big: "non stratégique", bigAt: 20.06 }}
        crowd={{ at: 21.32, text: "en faisant comme tout le monde" }}
        turnAt={22.12}
        against={{ at: 22.44, small: "il faut que j'aille", big: "à contre-courant", bigAt: 22.8 }}
        nobody={{ at: 24.18, text: "ce que personne ne fait" }}
      />
    ),
  },
  {
    kind: "tx",
    from: 24.98,
    node: <TxAnti word={{ at: 25.38, prefix: "anti-", text: "vente." }} end={{ at: 25.88, small: "à mon avis, c'est la", big: "meilleure stratégie.", bigAt: 26.34 }} />,
  },
];

export const ROBIN08: ReelConfig = {
  src: "media/robin08_916.mp4",
  words: WORDS,
  keeps: KEEPS,
  scenes: SCENES,
  face: { x: 540, y: 480 },
  lowerShade: true,
};
