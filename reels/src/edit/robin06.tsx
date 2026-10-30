/**
 * Robin 06 — face-cam monologue "la simplicité ultime". 16:9 (720p) with burned-in captions, cleaned by
 * tools/clean_subs.py then reframed to 9:16 by tools/reframe.py (robin06.shots.json).
 * Visual thread: an overloaded remote (complexity) that sheds its buttons into a one-button remote.
 * Plan in SOURCE seconds.
 */
import React from "react";
import words from "./robin06.words.json";
import { computeKeeps, dropWords, Word } from "./cut";
import type { Scene } from "./scene";
import type { ReelConfig } from "../Reel";
import { RecFrame } from "../scenes/FaceCam";
import { MdMaze, MdOverload, MdPress, MdReceipt, MdStrip, TxFlip, TxQuote } from "../scenes/Simple";

const DROP: [number, number][] = [];

const ALL = words as Word[];
const WORDS = dropWords(ALL, DROP);
const KEEPS = computeKeeps(ALL, { start: 0.0, end: 43.24, drop: DROP });

const SCENES: Scene[] = [
  {
    kind: "fc",
    from: 0.0,
    zooms: [{ at: 0.0, scale: 1.0 }, { at: 0.7, scale: 1.15, push: 20 }],
    caps: [{ from: 0.02, small: "en fait, il faut bien", big: "comprendre un truc." }],
  },
  {
    kind: "md",
    from: 1.5,
    node: (
      <MdOverload
        head={{ at: 1.58, small: "plus tu vas mettre de", big: "sophistication", bigAt: 2.82 }}
        callouts={[
          { at: 3.66, text: "dans ton business," },
          { at: 4.76, text: "dans tes process," },
          { at: 5.86, text: "dans tes features," },
        ]}
      />
    ),
  },
  {
    kind: "fc",
    from: 6.7,
    zooms: [{ at: 6.7, scale: 1.0 }, { at: 8.26, scale: 1.12 }, { at: 9.36, scale: 1.0 }, { at: 9.9, scale: 1.2, push: 8 }],
    caps: [
      { from: 6.76, small: "parce que tu penses", big: "qu'il va falloir" },
      { from: 8.26, small: "combler", big: "les trous," },
      { from: 8.92, small: "il va falloir", big: "rajouter plus.", accent: true },
    ],
  },
  {
    kind: "fc",
    from: 10.28,
    zooms: [{ at: 10.28, scale: 1.06 }, { at: 11.3, scale: 1.16 }],
    caps: [
      { from: 10.32, small: "plus tu auras", big: "de choses," },
      { from: 11.3, small: "plus", big: "forcément," },
    ],
  },
  {
    kind: "md",
    from: 11.92,
    node: (
      <MdReceipt
        head={{ at: 11.94, text: "tu vas pouvoir avoir" }}
        items={[
          { at: 12.76, text: "un meilleur produit," },
          { at: 13.56, text: "un meilleur service," },
          { at: 14.8, text: "des meilleurs résultats" },
        ]}
        foot={{ at: 15.64, text: "avec tes clients." }}
      />
    ),
  },
  {
    kind: "tx",
    from: 16.03,
    node: <TxFlip head={{ at: 16.04, small: "mais en fait, c'est", big: "tout le contraire", bigAt: 16.52 }} flipAt={16.7} tail={{ at: 17.02, text: "en réalité." }} />,
  },
  {
    kind: "tx",
    from: 17.48,
    node: (
      <TxQuote
        lead={{ at: 17.52, text: "c'est Steve Jobs qui disait :" }}
        words={[
          { at: 18.92, text: "Less" },
          { at: 19.38, text: "is" },
          { at: 19.6, text: "more." },
        ]}
      />
    ),
  },
  {
    kind: "md",
    from: 19.9,
    node: (
      <MdStrip
        head={{ at: 19.94, small: "la sophistication", big: "ultime,", bigAt: 21.24 }}
        who={{ at: 21.68, text: "par exemple, de" }}
        brand={{ at: 22.24, text: "Apple" }}
        result={{ at: 22.56, small: "réside en leur", big: "simplicité.", bigAt: 23.3 }}
        pressAt={{ at: 23.88, text: "c'est ultra simple." }}
      />
    ),
  },
  {
    kind: "fc",
    from: 24.7,
    zooms: [{ at: 24.7, scale: 1.0 }, { at: 26.16, scale: 1.12 }, { at: 27.94, scale: 1.0 }, { at: 28.46, scale: 1.18, push: 10 }],
    card: { at: 29.02, out: 0 },
    caps: [
      { from: 24.72, small: "et aujourd'hui,", big: "il faut avoir" },
      { from: 26.16, small: "cette logique de", big: "simplifier" },
      { from: 27.94, small: "toutes les choses", big: "au maximum.", accent: true },
      { from: 29.02, small: "aujourd'hui,", big: "toutes les boîtes" },
      { from: 29.86, small: "qui sont les plus", big: "successful," },
    ],
  },
  {
    kind: "md",
    from: 30.96,
    node: (
      <MdMaze
        head={{ at: 31.0, small: "elles ont", big: "un parcours,", bigAt: 31.64 }}
        ux={{ at: 32.14, text: "une UX, une expérience utilisateur" }}
        simple={{ at: 33.76, small: "qui est", big: "ultra simplifiée,", bigAt: 34.02 }}
      />
    ),
  },
  {
    kind: "fc",
    from: 34.98,
    zooms: [{ at: 34.98, scale: 1.0 }, { at: 36.06, scale: 1.12 }, { at: 37.46, scale: 1.0 }, { at: 38.38, scale: 1.1, push: 20 }],
    caps: [
      { from: 35.0, small: "qui est ultra", big: "compréhensible" },
      { from: 36.06, small: "par n'importe", big: "quelle personne" },
      { from: 37.46, small: "qui a l'offre", big: "en face de ses yeux." },
      { from: 39.44, small: "donc ça, il faut vraiment", big: "bien le retenir.", accent: true },
    ],
    extra: <RecFrame at={39.44} out={40.9} />,
  },
  {
    kind: "md",
    from: 40.74,
    node: (
      <MdPress
        head={{ at: 40.76, small: "la meilleure des", big: "sophistications,", bigAt: 41.24 }}
        end={{ at: 42.14, small: "c'est la", big: "simplicité ultime.", bigAt: 42.52 }}
        endAt={43.24}
      />
    ),
  },
];

export const ROBIN06: ReelConfig = {
  src: "media/robin06_916.mp4",
  words: WORDS,
  keeps: KEEPS,
  scenes: SCENES,
  face: { x: 540, y: 560 },
};
