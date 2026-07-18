import { Brand, CAMERA_MOVEMENT_LABELS, LearningEntry, MotionIntensity, MOTION_INTENSITY_LABELS, Scene, StylePreset } from "@/types";

/** Règles vidéo par défaut — modifiables depuis Paramètres > Prompts avancés. */
export const DEFAULT_MANDATORY_VIDEO_RULES = [
  "Chaque vidéo DOIT contenir au minimum : 1 directive caméra + 1 directive de mouvement personnage/élément",
  "Format : 9:16 vertical (portrait)",
  "Aucune vidéo statique n'est acceptable",
  "Si personnage récurrent : maintenir la cohérence visuelle avec les images de référence fournies",
].join("\n");

export const DEFAULT_ANALYZE_BRIEF_SYSTEM_PROMPT = `Tu es le directeur de production de Golddust Studio, un studio de production vidéo IA.
Ta mission : analyser un brief marketing et le découper en un plan de production détaillé, scène par scène.

Règles obligatoires pour chaque scène :
- Chaque scène doit avoir au minimum 1 directive caméra + 1 directive de mouvement dans son prompt vidéo
- Format final : vidéo verticale 9:16
- Jamais de vidéo statique
- Si un personnage récurrent est mentionné dans le brief → indique hasCharacter=true
- Si le produit est mentionné → indique hasProduct=true
- Détecte la langue du brief (fr ou en)
- Chaque scène doit indiquer si une frame de départ (image) est nécessaire (oui par défaut)`;

export const DEFAULT_GENERATE_HOOKS_SYSTEM_PROMPT = `Tu es un rédacteur publicitaire spécialisé dans les accroches vidéo (hooks) pour les 3 premières secondes de publicités e-commerce. Les hooks doivent être courts, percutants, et donner envie de continuer à regarder.`;

export const DEFAULT_MIN_SCENE_DURATION = 3;
export const DEFAULT_MAX_SCENE_DURATION = 7;

/**
 * Règles de génération injectées automatiquement dans TOUT prompt vidéo.
 * `customRules` (une règle par ligne) permet de surcharger la liste par
 * défaut depuis Paramètres > Prompts avancés, en cas de problème.
 */
export function buildMandatoryVideoRules(
  motionIntensity: MotionIntensity,
  lang: "fr" | "en",
  customRules?: string
): string {
  const intensityLabel = MOTION_INTENSITY_LABELS[motionIntensity];
  const baseRules = (customRules?.trim() ? customRules : DEFAULT_MANDATORY_VIDEO_RULES)
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);
  const rules = [
    ...baseRules,
    lang === "fr"
      ? "Les accents français (é, è, à) sont écrits phonétiquement dans les prompts FR pour la synthèse vocale"
      : "English phonetic clarity for voice synthesis where applicable",
    `Intensité du mouvement : ${intensityLabel}`,
  ];
  return rules.map((r) => `- ${r}`).join("\n");
}

export function buildScenePositivePrompt(
  scene: Pick<Scene, "description" | "cameraMovement" | "videoPrompt">,
  style: StylePreset,
  motionIntensity: MotionIntensity
): string {
  const cameraLabel = CAMERA_MOVEMENT_LABELS[scene.cameraMovement];
  return [
    scene.videoPrompt,
    `Directive caméra : ${cameraLabel}.`,
    `Style visuel : ${style.positivePrompt}`,
    `Intensité de mouvement : ${MOTION_INTENSITY_LABELS[motionIntensity]}.`,
  ].join(" ");
}

export function buildImagePrompt(scene: Pick<Scene, "imagePrompt">, style: StylePreset, brand: Brand | undefined): string {
  const brandNote = brand ? ` Produit : ${brand.name}. ${brand.generationNotes || ""}`.trim() : "";
  return `${scene.imagePrompt} Style : ${style.positivePrompt}.${brandNote ? " " + brandNote : ""}`;
}

export function buildNegativePrompt(style: StylePreset): string {
  return style.negativePrompt;
}

/**
 * Construit le contexte du journal d'apprentissage à injecter dans les prochaines générations.
 * Ex : "Note : les vidéos précédentes avec Grok Video tendaient à être trop statiques — insister sur les directives de mouvement"
 */
export function buildLearningContext(entries: LearningEntry[]): string {
  if (entries.length === 0) return "";
  const byEngine = new Map<string, LearningEntry[]>();
  for (const e of entries) {
    const list = byEngine.get(e.engine) ?? [];
    list.push(e);
    byEngine.set(e.engine, list);
  }
  const notes: string[] = [];
  for (const [engine, list] of byEngine) {
    const reasons = list.map((l) => l.reason).join(", ");
    notes.push(
      `Note : les générations précédentes avec ${engine} ont reçu des retours négatifs (${reasons}) — en tenir compte et corriger.`
    );
  }
  return notes.join("\n");
}
