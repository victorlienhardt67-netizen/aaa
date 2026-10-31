/**
 * Robin 04 — podcast extract "le pays". 16:9 multi-cam with burned-in captions, cleaned by
 * tools/clean_subs.py then reframed to 9:16 by tools/reframe.py (robin04.shots.json).
 * Plan in SOURCE seconds; one speaker (black shirt) throughout.
 */
import React from "react";
import words from "./robin04.words.json";
import { computeKeeps, dropWords, Word } from "./cut";
import type { Scene } from "./scene";
import type { ReelConfig } from "../Reel";
import { RecFrame } from "../scenes/FaceCam";
import { Stamps } from "../scenes/Story";
import { GhostWords, StackList } from "../scenes/TypeScenes";
import { MdBust, MdDomino, MdEurope, MdLock, MdTV } from "../scenes/Objects";
import { WordFlash } from "../components/WordFlash";

// fillers and false starts removed from the edit (source ranges)
const DROP: [number, number][] = [
  [35.06, 35.6], // "et qui se trouve" (sentence restarted)
  [38.12, 39.3], // "Tu sens que la France a..." (false start)
];

// screen rect of img/tv.png (fractions of the image width)
const SCREEN = { x: 0.095, y: 0.172, w: 0.642, h: 0.534 };

const ALL = words as Word[];
const WORDS = dropWords(ALL, DROP);
const KEEPS = computeKeeps(ALL, { start: 0.08, end: 55.72, drop: DROP });

const SCENES: Scene[] = [
  {
    kind: "md",
    from: 0.08,
    node: (
      <MdEurope
        lead={{ at: 0.16, text: "le pays, ce n'est pas que" }}
        france={{ at: 1.18, text: "la France" }}
        strikeAt={1.74}
        europe={{ at: 2.12, text: "l'Europe" }}
      />
    ),
  },
  {
    kind: "fc",
    from: 2.38,
    zooms: [{ at: 2.38, scale: 1.0 }, { at: 4.08, scale: 1.14 }, { at: 5.38, scale: 1.04 }],
    caps: [
      { from: 2.38, small: "et on n'est pas là pour", big: "parler politique" },
      { from: 4.08, small: "parce qu'on s'en bat", big: "les couilles." },
      { from: 5.38, small: "très clairement, on ne va", big: "pas se mentir." },
    ],
    extra: <RecFrame at={5.38} out={6.5} />,
  },
  {
    kind: "tx",
    from: 6.62,
    node: (
      <GhostWords
        beats={[
          { at: 6.62, text: "non merci, en fait.", ghost: "non", bg: "lime" },
          { at: 8.14, text: "la manière dont", ghost: "géré", bg: "light" },
          { at: 9.26, text: "ce pays est géré,", ghost: "pays", bg: "dark" },
        ]}
      />
    ),
  },
  {
    kind: "fc",
    from: 10.22,
    capY: 860,
    caps: [
      { from: 10.24, small: "c'est-à-dire que c'est", big: "un pays d'assistés.", accent: true },
      { from: 12.48, small: "il faut dire", big: "les choses qui sont." },
    ],
  },
  {
    kind: "tx",
    from: 13.86,
    node: (
      <StackList
        size={84}
        head={{ at: 13.9, text: "c'est un pays où quand tu commences à" }}
        items={[
          { at: 15.48, text: "entreprendre," },
          { at: 16.76, text: "prendre des risques," },
          { at: 18.36, text: "essayer de sortir", accent: true },
        ]}
      />
    ),
  },
  {
    kind: "fc",
    from: 19.78,
    zooms: [{ at: 19.78, scale: 1.0 }, { at: 20.58, scale: 1.12 }],
    caps: [{ from: 19.8, small: "justement de cette", big: "réalité de merde" }],
  },
  {
    kind: "md",
    from: 21.28,
    node: (
      <MdBust
        head={{ at: 21.3, small: "qu'on a essayé de", big: "te mettre", bigAt: 22.62 }}
        accent={{ at: 22.84, text: "dans la tête," }}
        glowAt={23.06}
      />
    ),
  },
  {
    kind: "tx",
    from: 23.64,
    node: (
      <WordFlash
        beats={[
          { at: 23.68, small: "tu vas te faire", big: "défoncer.", bg: "dark", accent: true },
          { at: 25.46, small: "par les", big: "impôts,", bg: "lime" },
          { at: 26.72, small: "par les", big: "taxes,", bg: "light" },
          { at: 27.72, small: "par le", big: "jugement.", bg: "dark", accent: true },
        ]}
      />
    ),
  },
  {
    kind: "fc",
    from: 28.32,
    card: { at: 28.2, out: 0 },
    caps: [
      { from: 28.34, small: "si tu as réussi,", big: "tu es un connard." },
      { from: 29.34, small: "si tu as de", big: "la thune,", accent: true },
    ],
  },
  {
    kind: "tx",
    from: 30.16,
    node: (
      <Stamps
        head="c'est que forcément"
        items={[
          { at: 30.82, text: "tu l'as volé" },
          { at: 31.62, text: "un scammeur" },
          { at: 32.28, text: "ci,", sub: { at: 32.7, text: "que tu es ça." } },
        ]}
      />
    ),
  },
  {
    kind: "md",
    from: 33.08,
    node: (
      <MdDomino
        head={{ at: 33.12, small: "et en fait, tu mets ça", big: "bout à bout", bigAt: 34.22 }}
        tiles={["connard", "volé", "scammeur", "ci, ça"]}
        fallAt={34.3}
        since={{ at: 35.64, text: "depuis un peu, genre" }}
        count={{ at: 36.38, from: 10, toAt: 36.58, to: 15, unit: "ans" }}
        vest={{ at: 37.02, text: "gilets jaunes" }}
      />
    ),
  },
  {
    kind: "md",
    from: 39.5,
    node: (
      <MdTV
        head={{ at: 39.56, small: "même là,", big: "en ce moment", bigAt: 39.86 }}
        onAt={39.86}
        screen={SCREEN}
        news={{ at: 41.56, title: "Émeutes au lycée", band: { at: 42.92, text: "EN FRANCE" } }}
        punch={{ at: 43.62, small: "j'ai vu,", big: "c'est chaud.", bigAt: 43.88 }}
      />
    ),
  },
  {
    kind: "fc",
    from: 45.7,
    zooms: [{ at: 45.7, scale: 1.0 }, { at: 47.18, scale: 1.25, push: 24 }],
    caps: [
      { from: 45.74, small: "moi, je sais que", big: "c'est un environnement" },
      { from: 47.18, small: "qui ne va pas", big: "me tirer vers le haut.", accent: true },
    ],
  },
  {
    kind: "fc",
    from: 48.22,
    capY: 860,
    caps: [
      { from: 48.24, small: "c'est", big: "dommage, en fait." },
      { from: 49.14, small: "c'est dommage parce que c'est", big: "quand même" },
      { from: 50.36, small: "un endroit où", big: "on a grandi.", accent: true },
    ],
  },
  {
    kind: "md",
    from: 51.44,
    node: (
      <MdLock
        head={{ at: 51.5, small: "moi, j'ai une", big: "attache énorme", bigAt: 51.82 }}
        lockAt={51.5}
        left={{ at: 53.22, text: "mes amis," }}
        right={{ at: 53.66, text: "ma famille" }}
        city={{ at: 54.94, text: "Paris,", sub: { at: 55.18, text: "pour cette ville." } }}
        end={55.7}
      />
    ),
  },
];

export const ROBIN04: ReelConfig = {
  src: "media/robin04_916.mp4",
  words: WORDS,
  keeps: KEEPS,
  scenes: SCENES,
  face: { x: 560, y: 560 },
};
