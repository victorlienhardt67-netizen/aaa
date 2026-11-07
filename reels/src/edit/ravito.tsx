/**
 * Ravito — "Bistrot Ravito" opening announcement (9:16 face-cam with his own inserts: plate top
 * view, facade, ravito footage, partner logos). Title banner, end "RAVITO" box and word-by-word
 * subtitles removed by tools/clean_overlays.py. One-off art direction chosen by the user for this
 * video only: reference 082a (objects on tactile grounds) in bistro colours — see scenes/Bistro.tsx.
 */
import React from "react";
import words from "./ravito.words.json";
import { computeKeeps, Word } from "./cut";
import type { Scene } from "./scene";
import type { ReelConfig } from "../Reel";
import { Awning, B, BcBill, BcCalendar, BcDM, BcDrinks, BcMenu, BcPlate, BcReserve, BcTickets } from "../scenes/Bistro";
import { SF } from "../lib/tokens";

const WORDS = words as Word[];
const KEEPS = computeKeeps(WORDS, { start: 0.0, end: 66.0 });

const SCENES: Scene[] = [
  {
    kind: "fc",
    capY: 1070,
    from: 0,
    zooms: [{ at: 0, scale: 1.0 }, { at: 1.74, scale: 1.12 }],
    caps: [
      { from: 0.0, small: "les amis,", big: "ça y est," },
      { from: 1.16, big: "on y est," },
      { from: 1.74, small: "je peux enfin", big: "vous l'annoncer,", accent: true },
    ],
    extra: <Awning />,
  },
  {
    kind: "md",
    from: 3.36,
    node: <BcCalendar dropAt={3.4} tearAt={3.56} l1={{ at: 4.54, text: "J'OUVRE ENFIN" }} l2={{ at: 5.54, text: "MON RESTAURANT" }} />,
  },
  {
    kind: "md",
    from: 6.42,
    node: (
      <BcPlate
        lead={{ at: 6.98, text: "Ici :" }}
        strikes={[{ at: 7.56, text: "Entrecôte" }, { at: 8.38, text: "Tiramisu" }]}
        resist={{ at: 9.36, text: "Plat de résistance" }}
        plateAt={10.46}
        gels={{ at: 12.24, small: "DES GELS", big: "ÉNERGÉTIQUES", bigAt: 12.78 }}
      />
    ),
  },
  {
    kind: "fc",
    capY: 1070,
    from: 13.86,
    zooms: [{ at: 13.8, scale: 1.0 }, { at: 16.14, scale: 1.14 }],
    caps: [
      { from: 13.9, small: "bienvenue au", big: "Bistrot Ravito,", accent: true },
      { from: 16.14, small: "le premier", big: "restaurant au monde" },
      { from: 17.54, small: "dédié", big: "aux coureurs." },
    ],
  },
  {
    kind: "fc",
    capY: 1070,
    from: 18.82,
    zooms: [{ at: 18.8, scale: 1.0 }, { at: 20.4, scale: 1.12 }, { at: 21.5, scale: 1.24, push: 20 }],
    caps: [
      { from: 18.84, small: "depuis le début", big: "des ravitos," },
      { from: 19.86, small: "il y a une", big: "question" },
      { from: 20.88, small: "qui revient", big: "systématiquement:" },
      { from: 22.6, small: "est-ce que tu me", big: "recommandes", accent: true },
      { from: 23.24, small: "quelque chose", big: "en particulier?" },
    ],
  },
  {
    kind: "md",
    from: 24.38,
    node: <BcDM head={{ at: 24.4, text: "plutôt que répondre en DM…" }} bubble="Tu me recommandes quoi ?" from={24.6} to={26.2} open={{ at: 26.9, small: "le restaurant est", text: "OUVERT" }} />,
  },
  {
    kind: "md",
    from: 28.44,
    node: (
      <BcMenu
        inAt={28.46}
        note={{ at: 29.5, text: "spécialités locales !" }}
        items={[
          { at: 31.38, name: "Classiques", desc: "la base de comparaison" },
          { at: 32.76, name: "Caféinés", desc: "pour les fins de course et les séances dures" },
          { at: 33.76, name: "Haute dose", desc: "très concentrés, pour viser un chrono" },
        ]}
        tasteAt={35.3}
      />
    ),
  },
  {
    kind: "md",
    from: 36.16,
    node: (
      <BcDrinks
        inAt={36.2}
        head={{ at: 37.54, text: "La carte des" }}
        lines={[{ at: 38.56, text: "millésimes" }, { at: 39.42, text: "isotoniques" }, { at: 40.58, text: "électrolytes" }]}
        photoAt={36.6}
        photoCaption="pour faire passer"
      />
    ),
  },
  {
    kind: "fc",
    capY: 1070,
    from: 41.18,
    zooms: [{ at: 41.1, scale: 1.04 }, { at: 42.44, scale: 1.16 }],
    caps: [
      { from: 41.22, small: "tu pourras choisir", big: "le menu" },
      { from: 42.44, small: "qui te", big: "convient" },
    ],
  },
  {
    kind: "md",
    from: 43.0,
    node: (
      <BcTickets
        head={{ at: 43.04, small: "en fonction de", big: "TA DISCIPLINE", bigAt: 43.54 }}
        tickets={[
          { at: 44.7, title: "Menu 10K", lines: "Gel classique · Gel caféiné", mark: true },
          { at: 45.1, title: "Semi & Marathon", lines: "Gel classique · Gel caféiné · Gel haute dose" },
          { at: 45.5, title: "Menu Trail", lines: "Gel · Gummies · Compote ou barre", mark: true },
        ]}
      />
    ),
  },
  {
    kind: "fc",
    capY: 1070,
    from: 46.08,
    zooms: [{ at: 46.0, scale: 1.0 }, { at: 50.1, scale: 1.0 }, { at: 51.3, scale: 1.14, push: 24 }],
    caps: [
      { from: 46.1, small: "tu passes", big: "commande," },
      { from: 46.9, small: "tu t'installes tranquillement", big: "à table," },
      { from: 48.64, small: "le chef te fait", big: "ses recommandations" },
      { from: 49.86, small: "et tu repars avec", big: "tes produits" },
      { from: 51.32, small: "prêts à tester", big: "en condition réelle.", accent: true },
    ],
  },
  {
    kind: "md",
    from: 53.2,
    node: <BcBill q={{ at: 53.24, text: "Comment ça, l'addition ?" }} stampAt={54.68} stamp="GRATUIT" tail={{ at: 55.02, text: "comme d'habitude" }} />,
  },
  {
    kind: "fc",
    capY: 1070,
    from: 55.52,
    zooms: [{ at: 55.5, scale: 1.0 }, { at: 57.16, scale: 1.1 }, { at: 59.98, scale: 1.0 }, { at: 61.9, scale: 1.16, push: 20 }],
    caps: [
      { from: 55.54, small: "rendez-vous le", big: "3 octobre", accent: true },
      { from: 57.16, small: "chez", big: "Annette K" },
      { from: 57.82, small: "avec", big: "The Running Collective" },
      { from: 59.12, small: "et", big: "AllTricks." },
      { from: 59.98, small: "on vous attend", big: "nombreux et nombreuses." },
      { from: 61.9, small: "j'espère que vous aurez", big: "faim.", accent: true },
    ],
  },
  {
    kind: "md",
    from: 63.06,
    node: <BcReserve head={{ at: 63.08, text: "pour réserver ta table…" }} flipAt={64.36} front="RÉSERVÉ" back={{ small: "commente", big: "RAVITO" }} />,
  },
];

export const RAVITO: ReelConfig = {
  src: "media/ravito_916.mp4",
  words: WORDS,
  keeps: KEEPS,
  scenes: SCENES,
  face: { x: 540, y: 660 },
  lowerShade: true,
  capTheme: { bigFont: "ArchivoBlack", bigWeight: 400, bigSpacing: "-0.01em", smallFont: SF, accent: B.cream, accentBg: B.bordeaux, accentText: B.cream },
};
