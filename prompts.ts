import { Brand, CAMERA_MOVEMENT_LABELS, LearningEntry, MotionIntensity, MOTION_INTENSITY_LABELS, Scene, StylePreset } from "@/types";

/**
 * Règles de génération injectées automatiquement dans TOUT prompt vidéo.
 * Non modifiables par l'utilisateur — toujours présentes.
 */
export function buildMandatoryVideoRules(motionIntensity: MotionIntensity, lang: "fr" | "en"): string {
  const intensityLabel = MOTION_INTENSITY_LABELS[motionIntensity];
  const rules = [
    "Chaque vidéo DOIT contenir au minimum : 1 directive caméra + 1 directive de mouvement personnage/élément",
    "Format : 9:16 vertical (portrait)",
    "Aucune vidéo statique n'est acceptable",
    lang === "fr"
      ? "Les accents français (é, è, à) sont écrits phonétiquement dans les prompts FR pour la synthèse vocale"
      : "English phonetic clarity for voice synthesis where applicable",
    "Si personnage récurrent : maintenir la cohérence visuelle avec les images de référence fournies",
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
 * Prompt système envoyé à Claude pour l'analyse du brief.
 * Injecte les règles obligatoires de découpage en scènes.
 */
export function buildBriefAnalysisSystemPrompt(): string {
  return `Tu es le directeur de production de Golddust Studio, un studio de production vidéo IA.
Ta mission : analyser un brief marketing et le découper en un plan de production détaillé, scène par scène.

Règles obligatoires pour chaque scène :
- Chaque scène doit avoir au minimum 1 directive caméra + 1 directive de mouvement dans son prompt vidéo
- Jamais de vidéo statique
- Si un personnage récurrent est détecté dans le brief → référencer automatiquement la photo correspondante de la marque
- Si un produit est mentionné → référencer la photo produit correspondante
- Détecter la langue du brief → la confirmer ou la corriger
- Chaque scène doit indiquer si une frame de départ (image) est nécessaire (oui par défaut pour image-to-video)

Réponds uniquement avec un plan de production structuré.`;
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
