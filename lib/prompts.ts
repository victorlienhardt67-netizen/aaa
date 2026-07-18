import { Brand, CAMERA_MOVEMENT_VIDEO_PHRASES, LearningEntry, Lang, MotionIntensity, MOTION_INTENSITY_LABELS, Scene, StylePreset, VoiceOver } from "@/types";

/** Règles vidéo par défaut — modifiables depuis Paramètres > Prompts avancés. */
export const DEFAULT_MANDATORY_VIDEO_RULES = [
  "Chaque vidéo DOIT contenir au minimum : 1 directive caméra + 1 directive de mouvement personnage/élément",
  "Format : 9:16 vertical (portrait)",
  "Aucune vidéo statique n'est acceptable",
  "Si personnage récurrent : maintenir la cohérence visuelle avec les images de référence fournies",
].join("\n");

/**
 * Force la prononciation correcte du "é" français par les moteurs vidéo
 * (souvent optimisés pour l'anglais) en le transformant phonétiquement.
 * Appliqué uniquement au texte de la voix off, jamais aux prompts descriptifs.
 */
export function applyFrenchPhoneticTransform(text: string): string {
  return text.replace(/é/g, "er").replace(/É/g, "ER");
}

/**
 * Directive de voix off/son injectée dans le prompt vidéo, selon le type
 * détecté (ou choisi manuellement) pour la scène :
 * - "lipsync" : le personnage parle face caméra, lèvres synchronisées sur le texte
 * - "voiceover" : narration hors-champ, aucun lip sync (texte FR transformé phonétiquement)
 * - "none" / non défini : aucun son, aucune voix
 */
export function buildVoiceDirective(
  voiceOver: VoiceOver | undefined,
  lang: Lang,
  voiceType?: "voiceover" | "lipsync" | "none"
): string {
  const hasText = !!voiceOver?.enabled && !!voiceOver.text.trim();

  if (voiceType === "lipsync" && hasText) {
    const text = lang === "fr" ? applyFrenchPhoneticTransform(voiceOver!.text.trim()) : voiceOver!.text.trim();
    const voiceLabel = lang === "fr" ? "French" : "English";
    return `Character speaks directly to camera, natural accurate lip sync matching the dialogue, mouth movements synchronized to the words. Clear ${voiceLabel} voice: "${text}".`;
  }

  if ((voiceType === "voiceover" || voiceType === undefined) && lang === "fr" && hasText) {
    const vo = applyFrenchPhoneticTransform(voiceOver!.text.trim());
    return `Voiceover only, NO lip sync, NO mouth movement, mouths stay closed at all times. Clear natural French voice, calm conversational pace: "${vo}". No music, no background sounds, voiceover only.`;
  }

  if (voiceType === "voiceover" && hasText) {
    return `Voiceover only, NO lip sync, NO mouth movement, mouths stay closed at all times. Clear natural ${
      lang === "fr" ? "French" : "English"
    } voice, calm conversational pace: "${voiceOver!.text.trim()}". No music, no background sounds, voiceover only.`;
  }

  return "No sound, no voiceover, no music, no lip sync, mouths do not move.";
}

export const DEFAULT_ANALYZE_BRIEF_SYSTEM_PROMPT = `Tu es le directeur de production de Golddust Studio, un studio de production vidéo IA.
Ta mission : analyser un brief marketing et le découper en un plan de production détaillé, scène par scène.

Règles obligatoires pour chaque scène :
- Chaque scène doit avoir au minimum 1 directive caméra + 1 directive de mouvement dans son prompt vidéo (jamais "dynamic camera" seul — utilise des directives précises : slow push-in, slow pull-out, pan, tilt, handheld slight shake, dynamic zoom in, rack focus, orbit...)
- Format final : vidéo verticale 9:16
- Jamais de vidéo statique
- Si un personnage récurrent est mentionné dans le brief → indique hasCharacter=true
- Si ce personnage a plusieurs états dans la vidéo (ex: avant/après, fatiguée/rayonnante) → indique characterState pour chaque scène concernée
- Si le produit est mentionné → indique hasProduct=true ; le produit n'apparaît QUE quand le script le justifie, jamais de placement systématique
- Texte visible sur une frame : uniquement si essentiel (avis, CTA, label clé), toujours dans la langue détectée, jamais dans les deux langues, jamais décoratif
- Détecte automatiquement pour chaque scène qui parle et comment : narration hors-champ (voiceover), personnage qui parle face caméra (lipsync), ou aucune voix (none)
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
      ? "Voiceover only, NO lip sync, NO mouth movement — mouths stay closed at all times"
      : "No sound, no voiceover, no music, no lip sync — mouths do not move",
    `Intensité du mouvement : ${intensityLabel}`,
  ];
  return rules.map((r) => `- ${r}`).join("\n");
}

export function buildScenePositivePrompt(
  scene: Pick<Scene, "description" | "cameraMovement" | "videoPrompt">,
  style: StylePreset,
  motionIntensity: MotionIntensity
): string {
  const cameraPhrase = CAMERA_MOVEMENT_VIDEO_PHRASES[scene.cameraMovement];
  return [
    scene.videoPrompt,
    `Camera movement: ${cameraPhrase}.`,
    `Visual style: ${style.positivePrompt}`,
    `Movement intensity: ${MOTION_INTENSITY_LABELS[motionIntensity]}.`,
  ].join(" ");
}

/**
 * Prompt pour générer le character sheet d'un personnage récurrent :
 * corps entier, fond blanc, multi-angles, aucun texte — sert ensuite de
 * référence visuelle (image_urls) pour garder le personnage cohérent
 * d'une frame à l'autre.
 */
export function buildCharacterSheetPrompt(characterName: string, style: StylePreset, state?: string): string {
  const stateNote = state ? ` État : ${state}, l'expression et la posture doivent refléter cet état.` : "";
  return `Character sheet complet de ${characterName}, corps entier visible, fond blanc uni, plusieurs angles sur une seule image (face, trois-quarts, profil, dos), pose neutre, éclairage égal, aucun texte, aucun label, aucune annotation.${stateNote} Style : ${style.positivePrompt}.`;
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
