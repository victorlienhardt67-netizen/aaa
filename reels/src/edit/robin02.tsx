/**
 * Robin 02 — podcast extract "Bali → Dubaï". 16:9 multi-cam reframed to 9:16 by
 * tools/reframe.py (robin02.shots.json). Plan in SOURCE seconds; Robin narrates throughout.
 */
import React from "react";
import words from "./robin02.words.json";
import { computeKeeps, dropWords, Word } from "./cut";
import type { Scene } from "./scene";
import type { ReelConfig } from "../Reel";
import { PopCutout } from "../scenes/FaceCam";
import { MdBoard, MdCalendar, MdChat, MdMap, MdSearch, MdSky, MdSwap, MdTower, Stamps } from "../scenes/Story";
import { StackList } from "../scenes/TypeScenes";
import { WordFlash } from "../components/WordFlash";

// fillers and false starts removed from the edit (source ranges)
const DROP: [number, number][] = [
  [1.18, 1.34], // "euh,"
  [3.96, 4.3], // "J'avais rendu," → keeps "j'ai rendu"
  [11.24, 11.34], // "de," (hesitation before "d'influenceurs")
  [17.2, 17.52], // "J'avais—" (false start)
];

const ALL = words as Word[];
const WORDS = dropWords(ALL, DROP);
const KEEPS = computeKeeps(ALL, { start: 0.1, end: 66.95, drop: DROP });

const SCENES: Scene[] = [
  {
    kind: "md",
    from: 0.1,
    node: (
      <MdBoard
        head={{ at: 0.22, small: "jour de mon", big: "départ,", bigAt: 0.64 }}
        dest={{ at: 0.3, text: "BALI" }}
        status={{ at: 1.44, before: "PRÉVU", after: "FERMÉ" }}
        caption={{ at: 1.44, small: "fermeture des", big: "frontières", bigAt: 1.88 }}
        punch={{ at: 3.24, text: "Oh non." }}
      />
    ),
  },
  {
    kind: "fc",
    from: 4.4,
    zooms: [{ at: 4.4, scale: 1.0 }, { at: 5.56, scale: 1.12 }],
    caps: [
      { from: 4.5, small: "j'ai rendu", big: "les clés" },
      { from: 5.02, small: "de mon", big: "appart et tout," },
      { from: 5.56, small: "je devais", big: "partir, tu vois." },
    ],
    extra: <PopCutout src="img/keys.png" at={4.86} out={5.5} x={650} y={930} width={380} id="keys" />,
  },
  {
    kind: "md",
    from: 6.38,
    node: (
      <MdChat
        head={{ at: 6.4, small: "et là, j'ai des potes", big: "qui me disent", bigAt: 7.48 }}
        title="Les potes"
        msgs={[
          { at: 7.68, text: "Mais vas-y, viens à Dubaï" },
          { at: 8.46, text: "tu vas voir" },
          { at: 8.74, text: "c'est chanmé" },
        ]}
      />
    ),
  },
  {
    kind: "fc",
    from: 9.6,
    zooms: [{ at: 9.6, scale: 1.04 }, { at: 10.5, scale: 1.2, push: 18 }],
    caps: [
      { from: 9.64, small: "je fais mais", big: "j'irai jamais" },
      { from: 10.56, small: "dans votre", big: "pays" },
    ],
  },
  {
    kind: "tx",
    from: 11.6,
    node: (
      <Stamps
        head="votre pays"
        items={[
          { at: 11.7, text: "d'influenceurs" },
          { at: 12.72, text: "superficiels", sub: { at: 13.34, text: "de merde." } },
          { at: 14.08, text: "scammeurs" },
        ]}
      />
    ),
  },
  {
    kind: "fc",
    from: 14.7,
    capY: 860,
    caps: [
      { from: 14.76, small: "de", big: "scammeurs" },
      { from: 15.24, small: "qui a été construit", big: "sur des morts, etc." },
    ],
  },
  {
    kind: "fc",
    from: 17.03,
    zooms: [{ at: 17.0, scale: 1.0 }, { at: 18.7, scale: 1.1, push: 30 }],
    caps: [
      { from: 17.74, small: "mon niveau", big: "d'accès" },
      { from: 18.74, small: "d'information", big: "de Dubaï" },
    ],
  },
  {
    kind: "md",
    from: 19.64,
    node: (
      <MdSearch
        query="Dubaï"
        queryAt={19.66}
        lines={{ at: 19.68, small: "celui que tu as quand tu n'es pas", big: "allé à Dubaï", bigAt: 21.4 }}
        reveal={{ at: 22.46, text: "différence" }}
      />
    ),
  },
  {
    kind: "fc",
    from: 22.96,
    zooms: [{ at: 22.9, scale: 1.06 }],
    caps: [
      { from: 22.98, small: "et il y a un pote", big: "qui m'a dit" },
      { from: 23.96, small: "mais", big: "viens," },
    ],
  },
  {
    kind: "md",
    from: 24.46,
    node: (
      <MdSky
        head={{ at: 24.52, small: "tu peux sauter", big: "en parachute", bigAt: 25.0 }}
        aside={{ at: 25.4, text: "c'était mon délire à l'époque" }}
        target={{ at: 27.48, small: "au-dessus de", big: "la palme", bigAt: 27.72 }}
      />
    ),
  },
  {
    kind: "fc",
    from: 29.16,
    zooms: [{ at: 29.1, scale: 1.0 }, { at: 29.76, scale: 1.12 }],
    caps: [{ from: 29.2, small: "et moi, je me suis dit", big: "parfait, j'y vais," }],
  },
  {
    kind: "md",
    from: 30.3,
    node: (
      <MdCalendar
        head={{ at: 30.34, small: "je vais sauter pendant", big: "3 semaines", bigAt: 30.92 }}
        days={{ from: 3, count: 21, at: 30.92, until: 31.6 }}
        then={{ at: 31.72, small: "et après, j'irai à", big: "Bali", bigAt: 32.56 }}
      />
    ),
  },
  {
    kind: "fc",
    from: 33.3,
    zooms: [{ at: 33.3, scale: 1.0 }, { at: 33.4, scale: 1.18, push: 66 }],
    caps: [
      { from: 33.1, small: "et je me", big: "rappellerai toujours" },
      { from: 34.08, small: "du jour où je suis", big: "arrivé à Dubaï." },
    ],
  },
  {
    kind: "md",
    from: 35.68,
    node: (
      <MdMap
        head={{ at: 35.72, small: "j'étais à", big: "Downtown", bigAt: 35.96 }}
        pin={{ at: 37.1, label: "Airbnb", sub: { at: 37.6, text: "pendant 3 semaines" } }}
        landmark={{ at: 38.78, small: "en face du", big: "Burj Khalifa", bigAt: 39.2 }}
      />
    ),
  },
  {
    kind: "fc",
    from: 39.96,
    zooms: [{ at: 39.9, scale: 1.0 }, { at: 40.94, scale: 1.12 }],
    caps: [
      { from: 40.02, small: "quand tu es", big: "entrepreneur," },
      { from: 40.94, big: "tu aimes bien" },
    ],
  },
  {
    kind: "tx",
    from: 41.5,
    node: (
      <StackList
        head={{ at: 41.54, text: "les choses" }}
        items={[
          { at: 42.56, text: "think out" },
          { at: 43.0, text: "of the box," },
          { at: 44.34, text: "innovantes," },
          { at: 45.24, text: "nouvelles," },
          { at: 47.5, text: "bousculer.", accent: true },
        ]}
      />
    ),
  },
  {
    kind: "fc",
    from: 47.86,
    capY: 860,
    caps: [
      { from: 47.88, big: "tu vois." },
      { from: 48.14, small: "et là, j'avais", big: "cette espèce de" },
    ],
  },
  {
    kind: "md",
    from: 49.58,
    node: (
      <MdTower
        a={{ at: 49.64, small: "monument", big: "immensissime", bigAt: 50.5 }}
        b={{ at: 52.3, small: "un vaisseau", big: "extraterrestre", bigAt: 52.86 }}
        land={{ at: 54.16, small: "qui a été posé", big: "sur Terre", bigAt: 54.66 }}
      />
    ),
  },
  {
    kind: "fc",
    from: 55.4,
    zooms: [{ at: 55.2, scale: 1.0 }, { at: 56.16, scale: 1.1 }, { at: 58.0, scale: 1.3, push: 10 }],
    caps: [
      { from: 55.24, small: "j'ai vu ce truc-là", big: "et vraiment," },
      { from: 56.16, small: "j'ai ressenti un truc", big: "dans mon corps." },
      { from: 57.36, small: "je me suis dit", big: "waouh !", accent: true },
    ],
  },
  {
    kind: "tx",
    from: 58.8,
    node: (
      <WordFlash
        beats={[
          { at: 58.86, small: "putain,", big: "ici,", bg: "light" },
          { at: 59.52, small: "ils rigolent", big: "pas du tout", bg: "lime" },
          { at: 60.68, small: "ici, ils rigolent", big: "pas du tout.", bg: "dark", accent: true },
          { at: 62.84, big: "du tout.", bg: "light" },
        ]}
      />
    ),
  },
  {
    kind: "fc",
    from: 63.2,
    zooms: [{ at: 63.2, scale: 1.06 }],
    caps: [
      { from: 63.22, small: "et c'est une", big: "ville d'entrepreneurs." },
      { from: 64.4, big: "bon bah," },
    ],
  },
  {
    kind: "md",
    from: 65.22,
    node: (
      <MdSwap
        from={{ at: 65.28, small: "mes", big: "3 semaines", bigAt: 65.4 }}
        strikeAt={66.06}
        to={{ at: 65.8, small: "se sont transformées en", big: "5 ans.", bigAt: 66.6 }}
      />
    ),
  },
];

export const ROBIN02: ReelConfig = {
  src: "media/robin02_916.mp4",
  words: WORDS,
  keeps: KEEPS,
  scenes: SCENES,
  face: { x: 560, y: 520 },
};
