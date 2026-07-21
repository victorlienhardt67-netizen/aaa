// ============================================================
// GULDUST STUDIO — modèle de données
// Source de vérité des entités manipulées par l'app.
// ============================================================

export type ISODate = string;

// ---- Narratif ----
export type NarrativeTag =
  | "hook"
  | "probleme"
  | "agitation"
  | "solution"
  | "preuve"
  | "cta";

export const NARRATIVE_TAGS: { key: NarrativeTag; label: string; color: string }[] = [
  { key: "hook", label: "Hook", color: "var(--hook)" },
  { key: "probleme", label: "Problème", color: "var(--probleme)" },
  { key: "agitation", label: "Agitation", color: "var(--agitation)" },
  { key: "solution", label: "Solution", color: "var(--solution)" },
  { key: "preuve", label: "Preuve", color: "var(--preuve)" },
  { key: "cta", label: "CTA", color: "var(--cta)" },
];

// ---- Format vidéo ----
export type AspectRatio = "9:16" | "1:1" | "4:5" | "16:9";

// ---- Mode de run ----
export type RunMode = "vo" | "dialogue" | "mixte";

// ---- Statut d'un asset généré ----
export type AssetStatus = "empty" | "queued" | "running" | "done" | "error";

export interface Asset {
  status: AssetStatus;
  url?: string; // media local ou URL provider
  provider?: string;
  model?: string;
  costCredits?: number;
  costUsd?: number;
  seed?: number;
  createdAt?: ISODate;
  error?: string;
}

// ---- Marque ----
export interface Brand {
  id: string;
  name: string;
  dna: string; // markdown structuré (Essence, Positionnement, Produit, Persona, claims, rendering locks, B-Roll direction…)
  productImages: string[]; // data URLs / chemins
  active?: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ---- Style de rendu ----
export interface StylePreset {
  id: string;
  name: string;
  emoji?: string;
  description: string;
}

export interface Style {
  id: string;
  key: string; // slug: clay-motion, paper-cut...
  name: string;
  subtitle: string;
  description: string;
  emoji: string;
  basePrompt: string; // prompt de base injecté à chaque frame
  renderLocks: string; // contraintes de rendu ("rendering locks")
  presets: StylePreset[];
  imageModel: string; // ex. "Nano Banana 2"
  videoModel: string; // ex. "Omni"
  accent?: string; // couleur d'accent de la carte
  soon?: boolean;
  custom?: boolean; // créé par l'utilisateur
  group: "video" | "creation";
}

// ---- Personnage / Avatar ----
export type CharacterSource = "photo" | "generated";
export interface Character {
  id: string;
  name: string; // ex. "La Goutte Miel"
  refImage?: string; // image de référence pour la cohérence
  source: CharacterSource;
  wearing?: string; // wearing rule / tenue
  scope: "brand" | "run";
  brandId?: string;
  voiceId?: string; // voix persistante assignée (mode dialogue)
  createdAt: ISODate;
}

// ---- Voix (TTS) ----
export interface Voice {
  id: string;
  name: string;
  provider: string;
  lang: string; // fr-FR, en-US
  gender?: "f" | "m" | "n";
  sample?: string;
}

// ---- Ligne de VO (issue de l'alignement du mp3) ----
export interface VoLine {
  index: number;
  text: string;
  start: number; // secondes
  duration: number; // secondes
}

// ---- Réplique de dialogue ----
export interface Dialogue {
  speakerId: string; // character id
  line: string;
  voiceId?: string;
  offscreen?: boolean; // parle hors-champ (TTS sans lip-sync)
  audio: Asset; // TTS généré
  lipsync: Asset; // lip-sync sur la frame
  duration?: number; // durée réelle de la réplique générée
  customAudioUrl?: string; // piste uploadée à la place du TTS
}

export type ProductRole = "star" | "background" | "hidden";

// ---- Scène ----
export interface Scene {
  id: string;
  index: number;
  tag: NarrativeTag;
  framing: string; // "A CRAMPED MINIATURE"
  voLine: string; // texte de la ligne VO (citation)
  voDuration?: number; // durée calée
  characterId?: string | "none";
  product: { role: ProductRole };
  customPrompt?: string;
  warnings: string[]; // conformité (claims, produit absent…)
  frame: Asset;
  clip: Asset;
  clipDuration: 4 | 6 | 8 | 10;
  movementPrompt?: string;
  sfxSuggestion?: string;
  // mode dialogue
  isDialogue?: boolean;
  dialogue?: Dialogue;
}

// ---- Run / Projet ----
export type RunStatus = "draft" | "analyzed" | "framing" | "animating" | "ready";

export interface Run {
  id: string;
  name: string;
  brandId: string;
  styleId: string;
  presetId?: string;
  format: AspectRatio;
  mode: RunMode;
  tone: string; // "tendre / complice"
  script: string;
  voFileName?: string;
  voDuration?: number;
  voLines: VoLine[];
  imageModel: string;
  videoModel: string;
  voiceProvider: string;
  scenes: Scene[];
  characters: Character[]; // casting du run (cohérence perso/voix)
  status: RunStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
  costCredits: number;
  costUsd: number;
}

// ---- Génération (historique) ----
export interface Generation {
  id: string;
  kind: "frame" | "clip" | "tts" | "lipsync" | "avatar";
  runId?: string;
  sceneId?: string;
  styleKey?: string;
  brandId?: string;
  url?: string;
  status: AssetStatus;
  costCredits: number;
  costUsd: number;
  createdAt: ISODate;
}

// ---- Clés API / providers (stockées en local) ----
export interface ProviderKey {
  provider: string; // "kie", "anthropic", "heygen"...
  key: string; // stockée localement (localStorage / backend local chiffré)
  defaultModel?: string;
  connectedMcp?: boolean;
}

// ---- Taux crédits → $ par provider ----
export interface CostRate {
  provider: string;
  usdPerCredit: number;
}

// ---- Onglet ouvert ----
export interface OpenTab {
  runId: string;
}
