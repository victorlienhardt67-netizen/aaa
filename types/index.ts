// Golddust Studio — Types globaux

export type Lang = "fr" | "en";

export type BrandTone =
  | "luxe"
  | "scientifique"
  | "fun"
  | "doux"
  | "direct";

export const BRAND_TONE_LABELS: Record<BrandTone, string> = {
  luxe: "Luxe & Premium",
  scientifique: "Scientifique & Crédible",
  fun: "Fun & Énergique",
  doux: "Doux & Naturel",
  direct: "Direct & Percutant",
};

export interface BrandAsset {
  id: string;
  url: string; // base64 or storage URL
  name?: string; // nom du personnage (pour photos modèles)
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  tone: BrandTone;
  defaultLang: Lang;
  productPhotos: BrandAsset[];
  characterPhotos: BrandAsset[];
  generationNotes: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export type ImageEngine = "auto" | "nano_banana" | "flux_pro" | "ideogram_v3";
export type VideoEngine = "auto" | "kling_3_0" | "grok_video" | "wan_2_6" | "seedance_2_0";

export const IMAGE_ENGINE_LABELS: Record<ImageEngine, string> = {
  auto: "Auto",
  nano_banana: "Nano Banana",
  flux_pro: "Flux Pro",
  ideogram_v3: "Ideogram v3",
};

export const VIDEO_ENGINE_LABELS: Record<VideoEngine, string> = {
  auto: "Auto",
  kling_3_0: "Kling 3.0",
  grok_video: "Grok Video",
  wan_2_6: "Wan 2.6",
  seedance_2_0: "Seedance 2.0",
};

export interface StylePreset {
  id: string;
  name: string;
  icon: string; // lucide icon name
  shortDescription: string;
  positivePrompt: string;
  negativePrompt: string;
  recommendedImageEngine: ImageEngine;
  recommendedVideoEngine: VideoEngine;
  bestFor: Lang[]; // "Best for FR" / "Best for EN"
  isCustom: boolean;
  createdAt: string;
  /** Mis en avant dans le sélecteur de style Étape 0 (avant la saisie du script). */
  featured?: boolean;
}

export type CameraMovement =
  | "push_in"
  | "whip_pan"
  | "orbit_360"
  | "crane_up"
  | "handheld_shake"
  | "zoom_explosif"
  | "tilt_reveal"
  | "dolly_out"
  | "static_pan"
  | "rack_focus";

export const CAMERA_MOVEMENT_LABELS: Record<CameraMovement, string> = {
  push_in: "Push-in dramatique",
  whip_pan: "Whip pan",
  orbit_360: "Orbit 360°",
  crane_up: "Crane up",
  handheld_shake: "Handheld shake",
  zoom_explosif: "Zoom explosif",
  tilt_reveal: "Tilt reveal",
  dolly_out: "Dolly out",
  static_pan: "Pan latéral lent",
  rack_focus: "Rack focus",
};

/**
 * Phrases précises injectées dans les prompts vidéo (toujours en anglais,
 * langage standard de production) — jamais "dynamic camera" seul.
 */
export const CAMERA_MOVEMENT_VIDEO_PHRASES: Record<CameraMovement, string> = {
  push_in: "slow push-in toward the subject",
  whip_pan: "fast whip pan sweeping across the frame",
  orbit_360: "360 degree orbit around the subject",
  crane_up: "slow crane up, rising above the subject",
  handheld_shake: "handheld slight shake, natural UGC feel",
  zoom_explosif: "dynamic zoom in on a key moment",
  tilt_reveal: "tilt reveal, slow tilt to unveil the scene",
  dolly_out: "slow pull-out revealing the surroundings",
  static_pan: "static shot with subtle ambient movement",
  rack_focus: "rack focus shifting sharpness between subject and background",
};

/**
 * Cadrage d'une frame — l'alternance (jamais deux fois le même cadrage
 * consécutivement) évite l'effet "montage plat" d'un plan de production.
 */
export type Framing = "wide" | "medium" | "close_up";

export const FRAMING_LABELS: Record<Framing, string> = {
  wide: "Plan large",
  medium: "Plan moyen",
  close_up: "Gros plan",
};

export type MotionIntensity = "doux" | "equilibre" | "dynamique" | "extreme";

export const MOTION_INTENSITY_LABELS: Record<MotionIntensity, string> = {
  doux: "Doux",
  equilibre: "Équilibré",
  dynamique: "Dynamique",
  extreme: "Extrême",
};

export type SceneStatus =
  | "draft"
  | "frame_pending"
  | "frame_generating"
  | "frame_generated"
  | "frame_validated"
  | "video_pending"
  | "video_generating"
  | "video_generated"
  | "video_validated"
  | "error";

export interface VoiceOver {
  enabled: boolean;
  text: string;
  voiceId?: string;
  lang: Lang;
  audioUrl?: string;
}

export interface SceneFeedback {
  id: string;
  sceneId: string;
  rating: "up" | "down";
  reason?: string;
  comment?: string;
  engine?: string;
  createdAt: string;
}

export interface Scene {
  id: string;
  index: number;
  description: string;
  durationSeconds: number;
  cameraMovement: CameraMovement;
  characters: string[]; // references to BrandAsset ids
  /** Lieu où se déroule cette scène — référence une entrée de `ProductionPlan.locationNames` / `Project.locationReferences`. */
  locationId?: string;
  hasProduct: boolean;
  productAssetId?: string;
  /** Rôle du produit dans le cadre quand hasProduct=true — "hero" = star du plan (premier plan, mis en valeur), "background" = discret, en fond. */
  productRole?: "hero" | "background";
  needsFrame: boolean;
  imagePrompt: string;
  videoPrompt: string;
  /** Vision/prompt custom du client pour cette frame précise — ajoutée à imagePrompt à la génération, jamais en remplacement. */
  customVision?: string;
  /** Direction custom du client pour l'animation de cette scène (action, caméra, ambiance, transition) — ajoutée à videoPrompt à la génération. */
  customVideoVision?: string;
  /** Cadrage de cette frame — doit alterner d'une frame à l'autre, jamais deux fois de suite le même. */
  framing?: Framing;
  /** Regroupement narratif (ex: "Accroche", "Problème", "Transformation", "CTA") pour l'affichage du plan par blocs. */
  beatLabel?: string;
  /** Requis par Claude quand durationSeconds > 8s : justifie la durée exceptionnelle (mouvement complexe, transformation, etc.). */
  durationJustification?: string;
  dialogueLang?: Lang;
  voiceOver?: VoiceOver;
  /**
   * Détecté automatiquement par l'analyse (ou modifiable manuellement) :
   * "voiceover" = narration hors-champ, no lip sync ; "lipsync" = personnage
   * parle à l'écran, lèvres synchronisées ; "none" = pas de voix.
   */
  voiceType?: "voiceover" | "lipsync" | "none";

  frameUrl?: string;
  frameStatus: SceneStatus;
  frameHistory: string[];
  /** Message d'erreur si le dernier appel fal.ai a échoué — jamais de frame simulée en remplacement, l'échec est affiché tel quel avec un bouton Réessayer. */
  frameError?: string;
  /** true si l'utilisateur a uploadé sa propre frame de départ — jamais régénérée automatiquement. */
  frameProvided?: boolean;

  videoUrl?: string;
  videoStatus: SceneStatus;
  videoCostEstimate?: number;
  imageCostEstimate?: number;
  /** Message d'erreur si le dernier appel fal.ai a échoué — jamais de vidéo simulée en remplacement. */
  videoError?: string;

  feedback?: SceneFeedback;
}

export interface ProductionPlan {
  scenes: Scene[];
  detectedLang: Lang;
  generatedAt: string;
  /** Synthèse de ce que l'IA a compris du brief (message clé, ton, structure narrative). */
  briefAnalysis?: string;
  /** Nom affiché de chaque personnage détecté, par assetId (y compris les personnages virtuels sans photo). */
  characterNames?: Record<string, string>;
  /**
   * Trait physique du personnage (ex: "corpulent", "très mince", "grand et
   * athlétique") si le script en mentionne un — intégré directement dans le
   * prompt de sa fiche de référence unique, jamais comme variante séparée.
   * Première occurrence non vide retenue par personnage.
   */
  characterProfiles?: Record<string, { physicalState?: string }>;
  /** Nom affiché de chaque lieu détecté dans le script, par locationId. */
  locationNames?: Record<string, string>;
  /** Évaluation du hook (3-5 premières secondes) — toujours vérifiée en premier. */
  hook?: {
    texte: string;
    evaluation: "fort" | "moyen" | "faible";
    probleme?: string;
    alternatives?: string[];
  };
  /** Arc narratif détecté (ex: "témoignage transformation", "autorité médicale"). */
  arcNarratif?: string;
  /** Marque détectée dans le script parmi les marques connues, si identifiable. */
  marqueDetectee?: string;
  /** Risques identifiés par Claude à surveiller avant de lancer la génération. */
  pointsVigilance?: string[];
}

export type ProjectStatus =
  | "brief"
  | "brief_chat"
  | "analyzing"
  | "plan_ready"
  | "characters"
  | "locations"
  | "frames"
  | "videos"
  | "export"
  | "completed";

/** Un tour de la conversation de co-construction du brief (Étape 0). */
export interface CoConstructionMessage {
  role: "assistant" | "user";
  content: string;
  quickReplies?: string[];
  /** true si ce message assistant est la synthèse finale en attente de validation (bloc 6). */
  isFinalSynthesis?: boolean;
}

export type CharacterReferenceStatus = "pending" | "generating" | "generated" | "validated";

/**
 * Character sheet généré + validé pour un personnage récurrent — sert de
 * référence visuelle (image_urls) injectée dans les frames où ce personnage
 * apparaît. Un personnage = une seule fiche, jamais de variantes multiples ;
 * un trait physique éventuel (`ProductionPlan.characterProfiles`) est intégré
 * directement dans `prompt` plutôt que de créer une fiche séparée.
 */
export interface CharacterReference {
  assetId: string; // id de la photo personnage de la marque (BrandAsset)
  name: string;
  prompt: string;
  sheetUrl?: string;
  status: CharacterReferenceStatus;
}

/**
 * Référence visuelle d'un lieu/décor détecté dans le script — sert à garder
 * le décor cohérent d'une frame à l'autre pour toutes les scènes situées au
 * même endroit (même mécanisme que CharacterReference, appliqué aux lieux).
 */
export interface LocationReference {
  id: string; // locationId
  name: string;
  prompt: string;
  sheetUrl?: string;
  status: CharacterReferenceStatus;
}

export interface Project {
  id: string;
  name: string;
  brandId: string;
  styleId: string;
  lang: Lang;
  targetDuration: number; // seconds
  imageEngine: ImageEngine;
  videoEngine: VideoEngine;
  brief: string;
  referenceImages: string[];
  /** Historique de la conversation d'Étape 0 (co-construction) + synthèse validée une fois complète. */
  coConstruction?: {
    messages: CoConstructionMessage[];
    synthesis?: string;
  };
  plan?: ProductionPlan;
  characterReferences?: Record<string, CharacterReference>;
  locationReferences?: Record<string, LocationReference>;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  totalCostEstimate: number;
  templateSourceId?: string;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  structure: string; // narrative structure prefill for brief
  recommendedScenes: number;
  recommendedDuration: number;
  isCustom: boolean;
  createdAt: string;
}

export interface ApiKeys {
  falApiKey: string;
  higgsfieldApiKey: string;
  claudeApiKey: string;
}

export interface GenerationDefaults {
  imageEngine: ImageEngine;
  videoEngine: VideoEngine;
  defaultStyleId?: string;
  defaultLang: Lang;
  motionIntensity: MotionIntensity;
}

export interface LearningEntry {
  id: string;
  engine: string;
  reason: string;
  comment?: string;
  createdAt: string;
}

/**
 * Contrôle avancé du comportement de l'IA — modifiable en cas de problème,
 * sans dépendre d'un changement de code. Tout ceci override les valeurs
 * par défaut codées dans lib/prompts.ts et lib/utils.ts.
 */
export interface AdvancedPromptSettings {
  analyzeBriefSystemPrompt: string;
  generateHooksSystemPrompt: string;
  coConstructionSystemPrompt: string;
  mandatoryVideoRules: string; // une règle par ligne
  mandatoryImageRules: string; // une règle par ligne
  minSceneDurationSeconds: number;
  maxSceneDurationSeconds: number;
}
