/**
 * Reel 01 — "Instagram / dopamine" test rush. Everything specific to this video lives here:
 * the cut (silence tightening), the scene plan in SOURCE seconds, captions and variations.
 */
import React from "react";
import words from "./words.json";
import { computeKeeps, Word } from "./cut";
import type { CapSpec } from "../components/Captions";
import type { Beat } from "../components/WordFlash";
import type { Zoom } from "../scenes/FaceCam";
import { Chips, MorningPhone, Moon, PopCutout, RecFrame } from "../scenes/FaceCam";
import { MdHook, MdHormones, MdHypno, MdInsta, MdRat, MdRules, MdSleep } from "../scenes/Motion";
import { GhostWords, StackList } from "../scenes/TypeScenes";
import { WordFlash } from "../components/WordFlash";

export const WORDS = words as Word[];
export const SRC = "media/facecam_clean.mp4";
export const END = 65.7; // file stops in the middle of "motivation" → we end on "dopamine."

export const KEEPS = computeKeeps(WORDS, { start: 0.62, end: END });

export type Scene =
  | { kind: "fc"; from: number; caps: CapSpec[]; zooms?: Zoom[]; extra?: React.ReactNode; card?: { at: number; out: number } }
  | { kind: "md" | "tx"; from: number; node: React.ReactNode };

export const SCENES: Scene[] = [
  { kind: "md", from: 0.62, node: <MdHook /> },
  {
    kind: "fc",
    from: 3.76,
    zooms: [{ at: 3.7, scale: 1.0 }, { at: 6.45, scale: 1.12 }],
    caps: [
      { from: 3.82, big: "en réalité," },
      { from: 4.4, small: "ça a des", big: "conséquences" },
      { from: 5.24, small: "bien", big: "graves", accent: true },
      { from: 5.64, small: "sur ton", big: "cerveau," },
      { from: 6.54, small: "plus", big: "particulièrement" },
      { from: 7.34, small: "si tu fais ça", big: "dès le matin" },
      { from: 8.48, small: "au", big: "réveil.", accent: true },
    ],
    extra: (
      <>
        <PopCutout src="img/brain.png" at={5.9} out={6.45} x={600} y={200} width={400} id="popBrain" />
        <MorningPhone at={7.34} alarm={8.48} />
      </>
    ),
  },
  {
    kind: "tx",
    from: 8.88,
    node: (
      <WordFlash
        beats={[
          { at: 8.9, small: "et c'est", big: "encore", bg: "light" },
          { at: 9.7, big: "pire.", bg: "lime" },
          { at: 10.3, big: "si tu le fais", bg: "dark" },
          { at: 10.98, small: "juste avant", big: "de dormir.", bg: "light" },
        ] satisfies Beat[]}
      />
    ),
  },
  { kind: "md", from: 11.8, node: <MdHormones /> },
  {
    kind: "fc",
    from: 15.84,
    zooms: [{ at: 15.8, scale: 1.08 }],
    caps: [{ from: 15.88, small: "si tu fais ça", big: "avant de dormir," }],
    extra: <Moon at={16.6} />,
  },
  { kind: "md", from: 16.92, node: <MdHypno /> },
  {
    kind: "fc",
    from: 22.24,
    zooms: [{ at: 22.2, scale: 1.0 }, { at: 23.36, scale: 1.14 }],
    card: { at: 24.36, out: 25.78 },
    caps: [
      { from: 22.3, small: "que ton", big: "cerveau" },
      { from: 23.38, small: "va", big: "mémoriser", accent: true },
      { from: 24.38, small: "pour aller traiter", big: "pendant la nuit." },
      { from: 25.84, small: "et donc si tu mets", big: "des choses" },
    ],
  },
  {
    kind: "tx",
    from: 26.9,
    node: (
      <GhostWords
        beats={[
          { at: 26.92, text: "qui sont débiles", ghost: "débiles", bg: "lime" },
          { at: 27.7, text: "dans ta tête", ghost: "tête", bg: "light" },
          { at: 28.6, text: "juste avant de dormir,", ghost: "dormir", bg: "dark" },
        ]}
      />
    ),
  },
  { kind: "md", from: 29.62, node: <MdSleep /> },
  {
    kind: "fc",
    from: 34.52,
    zooms: [{ at: 34.5, scale: 1.1 }],
    caps: [{ from: 34.58, small: "ce qu'il faut bien", big: "comprendre," }],
  },
  { kind: "md", from: 35.36, node: <MdInsta /> },
  {
    kind: "fc",
    from: 40.14,
    zooms: [{ at: 40.1, scale: 1.0 }, { at: 41.38, scale: 1.13, push: 40 }],
    caps: [
      { from: 40.2, small: "et si tu n'as pas", big: "conscience" },
      { from: 41.4, small: "que ça a un", big: "impact direct", accent: true },
      { from: 42.68, small: "sur", big: "ta vie" },
    ],
  },
  {
    kind: "tx",
    from: 43.16,
    node: (
      <StackList
        head={{ at: 43.18, text: "en termes de" }}
        items={[
          { at: 43.64, text: "motivation," },
          { at: 44.68, text: "d'hormones," },
          { at: 45.8, text: "dopamine.", accent: true },
        ]}
      />
    ),
  },
  {
    kind: "fc",
    from: 46.22,
    zooms: [
      { at: 46.2, scale: 1.0 },
      { at: 49.5, scale: 1.12 },
      { at: 50.9, scale: 1.24, push: 24 },
      { at: 52.1, scale: 1.0 },
      { at: 53.95, scale: 1.1 },
    ],
    caps: [
      { from: 46.26, small: "parce que tu as", big: "besoin" },
      { from: 47.28, small: "de", big: "dopamine", accent: true },
      { from: 47.8, small: "pour être", big: "motivé" },
      { from: 48.44, small: "et pour faire", big: "des choses," },
      { from: 49.6, small: "alors ça peut avoir des", big: "conséquences" },
      { from: 50.92, small: "très", big: "néfastes", accent: true },
      { from: 51.52, small: "sur", big: "ta vie." },
      { from: 52.22, big: "donc," },
      { from: 53.0, small: "prends", big: "conscience de ça," },
      { from: 54.06, small: "fais", big: "attention.", accent: true },
    ],
    extra: (
      <>
        <Chips
          out={49.4}
          items={[
            { at: 47.42, text: "+1 like" },
            { at: 47.95, text: "nouveau message" },
            { at: 48.6, text: "+1 abonné" },
          ]}
        />
        <RecFrame at={52.2} out={54.9} />
      </>
    ),
  },
  { kind: "md", from: 54.9, node: <MdRules /> },
  { kind: "md", from: 58.6, node: <MdRat /> },
  {
    kind: "fc",
    from: 63.06,
    zooms: [{ at: 63.0, scale: 1.06 }, { at: 64.9, scale: 1.18, push: 26 }],
    caps: [
      { from: 63.1, small: "et tu vas te faire", big: "vider" },
      { from: 64.9, small: "tes stocks de", big: "dopamine.", accent: true },
    ],
  },
];
