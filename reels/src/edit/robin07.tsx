/**
 * Robin 07 — podcast extract "Marina, cinq ans plus tard" (16:9 multi-cam with burned-in
 * subtitles, removed by tools/reframe.py band 0.55–0.66). Plan in SOURCE seconds.
 */
import React from "react";
import words from "./robin07.words.json";
import { computeKeeps, dropWords, Word } from "./cut";
import type { Scene } from "./scene";
import type { ReelConfig } from "../Reel";
import { MdFinal, MdHalves, MdMap, MdTwins } from "../scenes/Story";
import { GhostWords } from "../scenes/TypeScenes";
import { WordFlash } from "../components/WordFlash";

const DROP: [number, number][] = [
  [5.8, 6.3], // "Et du coup, en fait,"
  [8.64, 8.86], // "en fait,"
  [13.36, 13.68], // "en fait"
  [28.18, 28.42], // "Je suis--" (false start)
];

const ALL = words as Word[];
const WORDS = dropWords(ALL, DROP);
const KEEPS = computeKeeps(ALL, { start: 0.06, end: 31.7, drop: DROP });

const SCENES: Scene[] = [
  {
    kind: "md",
    from: 0.06,
    node: (
      <MdMap
        head={{ at: 0.14, small: "je prends un", big: "penthouse", bigAt: 1.14 }}
        pin={{ at: 1.66, label: "Dubaï Marina", sub: { at: 2.9, text: "pour 6 mois" } }}
      />
    ),
  },
  {
    kind: "md",
    from: 3.44,
    node: (
      <MdHalves
        head={{ at: 3.46, small: "et là,", big: "mon plan", bigAt: 3.74 }}
        a={{ at: 4.56, small: "6 mois", big: "Dubaï", bigAt: 4.82, fill: [4.56, 5.08] }}
        b={{ at: 5.22, small: "6 mois", big: "Bali", bigAt: 5.44, fill: [5.22, 5.68] }}
      />
    ),
  },
  {
    kind: "fc",
    from: 6.32,
    zooms: [{ at: 6.3, scale: 1.0 }, { at: 7.3, scale: 1.14 }],
    caps: [
      { from: 6.36, small: "j'ai pris un", big: "appart," },
      { from: 7.3, small: "dernier étage", big: "d'une tour à Marina." },
    ],
  },
  {
    kind: "md",
    from: 8.58,
    node: (
      <MdTwins
        head={{ at: 8.6, small: "et j'ai repris quasiment", big: "le même appart", bigAt: 9.86 }}
        a={{ at: 9.0, litAt: 10.16, small: "il y a", big: "5 ans", bigAt: 11.84 }}
        b={{ at: 12.62, litAt: 14.14, small: "une", big: "autre tour", bigAt: 14.0, pulseAt: 15.42 }}
        same={{ at: 14.52, text: "la même résidence" }}
      />
    ),
  },
  {
    kind: "fc",
    from: 15.82,
    zooms: [{ at: 15.8, scale: 1.0 }, { at: 16.56, scale: 1.15, push: 14 }],
    caps: [{ from: 15.84, small: "et sauf qu'en plus,", big: "il était moins bien." }],
  },
  {
    kind: "tx",
    from: 17.12,
    node: (
      <WordFlash
        beats={[
          { at: 17.14, small: "donc là, j'avais vraiment", big: "l'impression", bg: "light" },
          { at: 18.94, small: "de", big: "manger ma merde.", bg: "dark", accent: true },
        ]}
      />
    ),
  },
  {
    kind: "fc",
    from: 19.8,
    zooms: [{ at: 19.8, scale: 1.0 }, { at: 20.64, scale: 1.1 }],
    split: { at: 21.24, out: 23.3 },
    caps: [
      { from: 19.86, big: "en plus," },
      { from: 20.64, small: "je sortais de la", big: "séparation" },
      { from: 21.88, small: "avec Paola,", big: "six ans de relation, etc." },
    ],
  },
  {
    kind: "tx",
    from: 23.4,
    node: <GhostWords beats={[{ at: 23.66, text: "relation très prenante", ghost: "prenante", bg: "lime" }]} />,
  },
  {
    kind: "fc",
    from: 25.04,
    zooms: [{ at: 25.0, scale: 1.0 }, { at: 25.1, scale: 1.18, push: 50 }, { at: 28.9, scale: 1.28 }],
    caps: [
      { from: 25.08, small: "où là, je me dis", big: "putain, mais attends," },
      { from: 26.2, small: "je suis", big: "5 ans plus tard." },
      { from: 28.5, big: "je fais quoi là?", accent: true },
    ],
  },
  {
    kind: "md",
    from: 29.12,
    node: (
      <MdFinal
        lines={[
          { at: 29.14, text: "j'ai commencé à ressentir", role: "sec", size: 60, y: 520, rate: 0.7 },
          { at: 30.02, text: "un truc", role: "strongLime", size: 160, y: 590 },
          { at: 30.24, text: "où je me suis dit", role: "sec", size: 58, y: 880 },
          { at: 30.94, text: "je me sens pas bien", role: "strong", size: 112, y: 950, rate: 0.8 },
        ]}
        punch={{ at: 31.5, text: "ici." }}
      />
    ),
  },
];

export const ROBIN07: ReelConfig = {
  src: "media/robin07_916.mp4",
  words: WORDS,
  keeps: KEEPS,
  scenes: SCENES,
  face: { x: 520, y: 560 },
};
