// Client Claude API — analyse de brief + génération de prompts.
// Si une clé API est fournie (Paramètres), les appels réels passent par les routes
// /api/claude/* (voir app/api/claude/) qui interrogent l'API Claude côté serveur.
// Sans clé, ou en cas d'erreur, on retombe sur un plan simulé mais réaliste.

import { Brand, CameraMovement, Framing, Lang, MotionIntensity, ProductionPlan, Scene, StylePreset } from "@/types";
import { estimateFrameCountForDuration, generateId, slugify } from "./utils";
import { simulatedDelay } from "./mock";

const FRAMING_CYCLE: Framing[] = ["wide", "medium", "close_up"];

/** Garantit l'alternance de cadrage même si l'API a renvoyé deux fois le même framing de suite. */
function enforceFramingAlternation(scenes: { framing?: Framing }[]): void {
  let previous: Framing | undefined;
  for (let i = 0; i < scenes.length; i++) {
    const current = scenes[i].framing;
    if (!current || current === previous) {
      scenes[i].framing = FRAMING_CYCLE[i % FRAMING_CYCLE.length] === previous
        ? FRAMING_CYCLE[(i + 1) % FRAMING_CYCLE.length]
        : FRAMING_CYCLE[i % FRAMING_CYCLE.length];
    }
    previous = scenes[i].framing;
  }
}

const CAMERA_CYCLE: CameraMovement[] = [
  "push_in",
  "whip_pan",
  "orbit_360",
  "crane_up",
  "handheld_shake",
  "zoom_explosif",
  "tilt_reveal",
  "dolly_out",
  "rack_focus",
];

function detectLang(brief: string): Lang {
  const frMarkers = /(le |la |les |des |une |avec |pour |vous |votre |produit|découvr|essayez)/i;
  return frMarkers.test(brief) ? "fr" : "en";
}

interface AnalyzeBriefParams {
  brief: string;
  brand?: Brand;
  style: StylePreset;
  lang: Lang;
  targetDuration: number;
  motionIntensity?: MotionIntensity;
  learningContext?: string;
  apiKey?: string;
  systemPromptOverride?: string;
  minSceneDurationSeconds?: number;
  maxSceneDurationSeconds?: number;
}

interface ClaudeSceneCharacter {
  name: string;
  /** Trait physique du personnage (ex: "corpulent", "très mince") si le script en mentionne un — retenu une seule fois par personnage (première occurrence), intégré dans sa fiche de référence unique. */
  physicalState?: string;
}

interface ClaudeScene {
  description: string;
  durationSeconds: number;
  cameraMovement: string;
  hasProduct: boolean;
  /** Tous les personnages récurrents détectés automatiquement, apparaissant simultanément dans ce plan (0, 1 ou plus). */
  characters?: ClaudeSceneCharacter[];
  /** Nom du lieu où se déroule cette scène (ex: "Salle de bain", "Rue"), identique pour toutes les scènes au même endroit. */
  locationName?: string;
  needsFrame: boolean;
  imagePrompt: string;
  videoPrompt: string;
  dialogueLang: Lang;
  voiceType?: "voiceover" | "lipsync" | "none";
  /** Fragment exact du texte parlé (voix off/dialogue) prononcé pendant ce plan — sert à construire scene.voiceOver. */
  voiceOverText?: string;
  framing?: Framing;
  beatLabel?: string;
  durationJustification?: string;
}

/**
 * Résout l'identifiant de personnage à utiliser pour une scène : la photo de
 * marque uploadée si elle existe, sinon un identifiant virtuel stable dérivé
 * du nom détecté par Claude — le character sheet est alors généré entièrement
 * à partir du script (aucune photo de référence requise).
 */
function resolveCharacterAssetId(characterName: string | undefined, characterPhotoId: string | undefined): string {
  if (characterPhotoId) return characterPhotoId;
  return `virtual_${slugify(characterName || "personnage_principal")}`;
}

/** Trouve la photo de marque correspondant à un nom de personnage détecté (comparaison insensible à la casse/accents via slugify). */
function findCharacterPhotoByName(brand: Brand | undefined, name: string | undefined) {
  if (!brand || !name) return undefined;
  const target = slugify(name);
  return brand.characterPhotos.find((p) => p.name && slugify(p.name) === target);
}

/** Identifiant stable de lieu dérivé du nom détecté par Claude — un lieu = une seule référence de décor. */
function resolveLocationId(locationName: string | undefined): string | undefined {
  if (!locationName?.trim()) return undefined;
  return `location_${slugify(locationName)}`;
}

/**
 * Analyse un brief et génère un plan de production détaillé, scène par scène.
 */
export async function analyzeBrief(params: AnalyzeBriefParams): Promise<ProductionPlan> {
  if (params.apiKey) {
    try {
      return await analyzeBriefWithClaude(params);
    } catch (e) {
      console.error("Appel Claude API échoué, repli sur le mode simulé :", e);
    }
  }
  return analyzeBriefMock(params);
}

async function analyzeBriefWithClaude(params: AnalyzeBriefParams): Promise<ProductionPlan> {
  const { brief, brand, style, lang, targetDuration, motionIntensity, learningContext, apiKey, systemPromptOverride } =
    params;

  const res = await fetch("/api/claude/analyze-brief", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      apiKey,
      brief,
      brandName: brand?.name,
      brandDescription: brand?.description,
      brandNotes: brand?.generationNotes,
      styleName: style.name,
      stylePositivePrompt: style.positivePrompt,
      lang,
      targetDuration,
      motionIntensity,
      learningContext,
      systemPromptOverride,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? `Erreur API ${res.status}`);
  }

  const productPhoto = brand?.productPhotos[0];
  const rawScenes: ClaudeScene[] = data.scenes ?? [];
  const characterNames: Record<string, string> = {};
  const characterProfiles: Record<string, { physicalState?: string }> = {};
  const locationNames: Record<string, string> = {};

  const scenes: Scene[] = rawScenes.map((s, i) => {
    const characters: string[] = (s.characters ?? []).map((c) => {
      const characterPhoto = findCharacterPhotoByName(brand, c.name);
      const assetId = resolveCharacterAssetId(c.name, characterPhoto?.id);
      if (!characterNames[assetId]) {
        characterNames[assetId] = characterPhoto?.name || c.name || "Personnage principal";
      }
      if (!characterProfiles[assetId]?.physicalState && c.physicalState) {
        characterProfiles[assetId] = { physicalState: c.physicalState };
      }
      return assetId;
    });
    const locationId = resolveLocationId(s.locationName);
    if (locationId && !locationNames[locationId]) {
      locationNames[locationId] = s.locationName!;
    }
    return {
      id: generateId("scene"),
      index: i + 1,
      description: s.description,
      durationSeconds: s.durationSeconds,
      cameraMovement: (CAMERA_CYCLE.includes(s.cameraMovement as CameraMovement)
        ? s.cameraMovement
        : CAMERA_CYCLE[i % CAMERA_CYCLE.length]) as CameraMovement,
      characters,
      locationId,
      hasProduct: s.hasProduct,
      productAssetId: s.hasProduct ? productPhoto?.id : undefined,
      needsFrame: s.needsFrame,
      imagePrompt: s.imagePrompt,
      videoPrompt: s.videoPrompt,
      dialogueLang: s.dialogueLang ?? lang,
      voiceType: s.voiceType ?? "none",
      voiceOver: s.voiceOverText?.trim()
        ? { enabled: true, text: s.voiceOverText.trim(), lang: s.dialogueLang ?? lang }
        : undefined,
      framing: s.framing,
      beatLabel: s.beatLabel,
      durationJustification: s.durationJustification,
      frameStatus: "frame_pending",
      frameHistory: [],
      videoStatus: "video_pending",
    };
  });

  // Filet de sécurité : garantit l'alternance de cadrage même si Claude a
  // renvoyé deux fois de suite le même framing malgré la consigne.
  enforceFramingAlternation(scenes);

  return {
    scenes,
    detectedLang: (data.detectedLang as Lang) ?? lang,
    generatedAt: new Date().toISOString(),
    briefAnalysis: data.briefAnalysis,
    characterNames,
    characterProfiles,
    locationNames,
    hook: data.hook,
    arcNarratif: data.arcNarratif,
    marqueDetectee: data.marqueDetectee,
    pointsVigilance: data.pointsVigilance,
  };
}

interface BeatTemplate {
  labelFr: string;
  labelEn: string;
  weight: number; // poids relatif dans la répartition du nombre total de frames
  minDuration: number;
  maxDuration: number;
}

/**
 * Blocs narratifs types utilisés par le mode simulé — structure publicitaire
 * Hook / Problème / Agitation / Solution / Preuve / CTA, calibrée pour une
 * cadence moyenne de 6s/frame (voir estimateFrameCountForDuration).
 */
const BEAT_TEMPLATES: BeatTemplate[] = [
  { labelFr: "Hook", labelEn: "Hook", weight: 1.5, minDuration: 3, maxDuration: 4 },
  { labelFr: "Problème", labelEn: "Problem", weight: 2, minDuration: 4, maxDuration: 5 },
  { labelFr: "Agitation", labelEn: "Agitate", weight: 2.5, minDuration: 5, maxDuration: 6 },
  { labelFr: "Solution", labelEn: "Solution", weight: 2, minDuration: 5, maxDuration: 6 },
  { labelFr: "Preuve", labelEn: "Proof", weight: 2.5, minDuration: 6, maxDuration: 8 },
  { labelFr: "CTA", labelEn: "CTA", weight: 1, minDuration: 4, maxDuration: 5 },
];

/** Phrases mock par bloc narratif — simulent le fragment de voix off attribué à chaque frame (voiceOverText). */
const BEAT_VOICE_LINES: Record<string, { fr: string[]; en: string[] }> = {
  Hook: {
    fr: ["Et si ce problème avait enfin une solution ?", "Vous aussi, vous vivez ça au quotidien ?"],
    en: ["What if this problem finally had a solution?", "Do you live with this every single day too?"],
  },
  Problème: {
    fr: ["Ce gonflement, cette lourdeur... ça revient chaque jour.", "Rien ne semblait fonctionner, jusqu'ici."],
    en: ["That bloating, that heaviness... it comes back every day.", "Nothing seemed to work, until now."],
  },
  Agitation: {
    fr: ["Plus les jours passent, plus c'est difficile à ignorer.", "Les vêtements serrent, la confiance s'effondre."],
    en: ["The longer it goes on, the harder it is to ignore.", "Clothes feel tighter, confidence fades."],
  },
  Solution: {
    fr: ["C'est là qu'intervient la formule.", "Une routine simple, pensée pour agir en profondeur."],
    en: ["That's where this formula comes in.", "A simple routine, designed to work at the root."],
  },
  Preuve: {
    fr: ["Regardez la différence, en seulement quelques semaines.", "Des milliers de clientes ont déjà retrouvé leur légèreté."],
    en: ["Look at the difference, in just a few weeks.", "Thousands of customers already got their lightness back."],
  },
  CTA: {
    fr: ["Essayez-le dès aujourd'hui.", "Commandez maintenant et sentez la différence."],
    en: ["Try it today.", "Order now and feel the difference."],
  },
};

/** Répartit `total` frames entre les beats au prorata de leur poids, minimum 2 par beat. */
function distributeFrameCounts(total: number): number[] {
  const totalWeight = BEAT_TEMPLATES.reduce((sum, b) => sum + b.weight, 0);
  const counts = BEAT_TEMPLATES.map((b) => Math.max(2, Math.round((b.weight / totalWeight) * total)));
  let diff = total - counts.reduce((a, b) => a + b, 0);
  // Ajuste l'arrondi en ajoutant/retirant sur les plus gros beats en priorité, jamais sous 2.
  const order = [...counts.keys()].sort((a, b) => counts[b] - counts[a]);
  let i = 0;
  while (diff !== 0 && i < order.length * 4) {
    const idx = order[i % order.length];
    if (diff > 0) {
      counts[idx] += 1;
      diff -= 1;
    } else if (counts[idx] > 2) {
      counts[idx] -= 1;
      diff += 1;
    }
    i += 1;
  }
  return counts;
}

/** Plan de production simulé — utilisé sans clé API ou en repli sur erreur. */
async function analyzeBriefMock(params: AnalyzeBriefParams): Promise<ProductionPlan> {
  const { brief, brand, style, lang, targetDuration, minSceneDurationSeconds, maxSceneDurationSeconds } = params;
  await simulatedDelay(1500, 3000);

  const { min: frameMin, max: frameMax } = estimateFrameCountForDuration(targetDuration);
  const targetFrameCount = Math.round((frameMin + frameMax) / 2);
  const frameCounts = distributeFrameCounts(targetFrameCount);
  const detectedLang = detectLang(brief) === lang ? lang : detectLang(brief);
  const minDur = minSceneDurationSeconds ?? 3;
  const maxDur = maxSceneDurationSeconds ?? 8;

  const productPhoto = brand?.productPhotos[0];
  const characterPhoto = brand?.characterPhotos[0];
  const characterAssetId = resolveCharacterAssetId(undefined, characterPhoto?.id);
  const characterNames: Record<string, string> = {
    [characterAssetId]: characterPhoto?.name || "Personnage principal",
  };
  // Trait physique unique du personnage — intégré dans sa seule fiche de référence, jamais une variante séparée.
  const characterProfiles: Record<string, { physicalState?: string }> = {
    [characterAssetId]: {
      physicalState:
        lang === "fr"
          ? "silhouette et posture cohérentes avec le problème décrit dans le script"
          : "silhouette and posture consistent with the problem described in the script",
    },
  };

  // Lieux mock par bloc narratif — un lieu par groupe de beats, pour illustrer
  // la génération de références de décor sans clé API.
  const BEAT_LOCATIONS: Record<string, { fr: string; en: string }> = {
    Hook: { fr: "Salle de bain, devant le miroir", en: "Bathroom, in front of the mirror" },
    Problème: { fr: "Salle de bain, devant le miroir", en: "Bathroom, in front of the mirror" },
    Agitation: { fr: "Salle de bain, devant le miroir", en: "Bathroom, in front of the mirror" },
    Solution: { fr: "Cuisine lumineuse", en: "Bright kitchen" },
    Preuve: { fr: "Extérieur, rue ensoleillée", en: "Outdoor, sunlit street" },
    CTA: { fr: "Cuisine lumineuse", en: "Bright kitchen" },
  };
  const locationNames: Record<string, string> = {};

  const scenes: Scene[] = [];
  let globalIndex = 0;

  BEAT_TEMPLATES.forEach((beatTemplate, beatIdx) => {
    const count = frameCounts[beatIdx];
    const beatLabel = lang === "fr" ? beatTemplate.labelFr : beatTemplate.labelEn;

    const isProofBeat = beatTemplate.labelFr === "Preuve";
    const locationName = BEAT_LOCATIONS[beatTemplate.labelFr]?.[lang] ?? (lang === "fr" ? "Décor neutre" : "Neutral setting");
    const locationId = `location_${slugify(locationName)}`;
    if (!locationNames[locationId]) locationNames[locationId] = locationName;
    const voiceLines = BEAT_VOICE_LINES[beatTemplate.labelFr]?.[lang] ?? [];

    for (let j = 0; j < count; j++) {
      const camera = CAMERA_CYCLE[globalIndex % CAMERA_CYCLE.length];
      const framing = FRAMING_CYCLE[globalIndex % FRAMING_CYCLE.length];
      const hasProduct = isProofBeat ? false : globalIndex % 3 !== 1 && !!productPhoto;
      const hasCharacter = isProofBeat || globalIndex % 2 === 0;
      const duration = Math.min(
        Math.max(beatTemplate.minDuration + (j % (beatTemplate.maxDuration - beatTemplate.minDuration + 1)), minDur),
        maxDur
      );
      const voiceOverText = hasCharacter && voiceLines.length > 0 ? voiceLines[j % voiceLines.length] : undefined;

      const descriptionFr = `${beatLabel} — plan ${j + 1}/${count}${brand ? ` pour ${brand.name}` : ""}.`;
      const descriptionEn = `${beatLabel} — shot ${j + 1}/${count}${brand ? ` for ${brand.name}` : ""}.`;

      const imagePromptFr = `${beatLabel}, ${framing === "wide" ? "plan large" : framing === "medium" ? "plan moyen" : "gros plan"} — cadrage vertical 9:16, ${
        hasProduct ? "produit visible dans le cadre, " : ""
      }${hasCharacter ? `personnage en action dans la scène, ` : ""}ambiance ${style.name.toLowerCase()}.`;
      const imagePromptEn = `${beatLabel}, ${framing.replace("_", " ")} — vertical 9:16 framing, ${
        hasProduct ? "product visible in frame, " : ""
      }${hasCharacter ? `character in action within the scene, ` : ""}${style.name.toLowerCase()} mood.`;

      const videoPromptFr = `${descriptionFr} Mouvement de caméra en ${camera.replace(
        /_/g,
        " "
      )}, le sujet bouge naturellement dans le cadre, transition fluide vers le plan suivant.`;
      const videoPromptEn = `${descriptionEn} Camera movement ${camera.replace(
        /_/g,
        " "
      )}, subject moves naturally within frame, smooth transition into the next shot.`;

      scenes.push({
        id: generateId("scene"),
        index: globalIndex + 1,
        description: lang === "fr" ? descriptionFr : descriptionEn,
        durationSeconds: duration,
        cameraMovement: camera,
        characters: hasCharacter ? [characterAssetId] : [],
        locationId,
        hasProduct,
        productAssetId: hasProduct ? productPhoto?.id : undefined,
        needsFrame: true,
        imagePrompt: lang === "fr" ? imagePromptFr : imagePromptEn,
        videoPrompt: lang === "fr" ? videoPromptFr : videoPromptEn,
        dialogueLang: lang,
        voiceType: voiceOverText ? "voiceover" : "none",
        voiceOver: voiceOverText ? { enabled: true, text: voiceOverText, lang } : undefined,
        framing,
        beatLabel,
        durationJustification: duration > 8 ? (lang === "fr" ? "Moment de preuve clé, plan choc justifiant une durée plus longue." : "Key proof moment, impact shot justifying a longer duration.") : undefined,
        frameStatus: "frame_pending",
        frameHistory: [],
        videoStatus: "video_pending",
      });
      globalIndex += 1;
    }
  });

  const totalFrames = scenes.length;
  const briefAnalysis =
    lang === "fr"
      ? `Brief analysé (mode simulé) : ${totalFrames} frames détectées à partir du script pour une durée cible de ${targetDuration}s (cible ${frameMin}-${frameMax}, cadence moyenne ~6s/frame). Structure narrative "Hook → Problème → Agitation → Solution → Preuve → CTA"${
          brand ? ` adaptée à ${brand.name}` : ""
        }. Chaque frame reste entre ${minDur}s et ${maxDur}s (jusqu'à 10s si justifié) pour garder la vidéo dynamique, avec alternance systématique des cadrages.`
      : `Brief analyzed (simulated mode): ${totalFrames} frames detected from the script for a ${targetDuration}s target duration (target ${frameMin}-${frameMax}, ~6s/frame average pace). Narrative structure follows a "Hook → Problem → Agitate → Solution → Proof → CTA" arc${
          brand ? ` adapted for ${brand.name}` : ""
        }. Each frame stays between ${minDur}s and ${maxDur}s (up to 10s when justified) to keep the video dynamic, with systematic framing alternation.`;

  const hookText = scenes[0]?.description ?? (lang === "fr" ? "Accroche non détectée" : "Hook not detected");
  const hook: ProductionPlan["hook"] = {
    texte: hookText,
    evaluation: "moyen",
    probleme:
      lang === "fr"
        ? "Mode simulé : impossible d'évaluer réellement l'impact du hook sans clé Claude — vérifie-le manuellement."
        : "Simulated mode: hook impact cannot be truly evaluated without a Claude key — check it manually.",
    alternatives:
      lang === "fr"
        ? ["Ouvrir directement sur le résultat choc (après)", "Ouvrir sur une question qui interpelle la cible"]
        : ["Open directly on the shocking result (after)", "Open on a question that calls out the target"],
  };

  return {
    scenes,
    detectedLang,
    generatedAt: new Date().toISOString(),
    briefAnalysis,
    characterNames,
    characterProfiles,
    locationNames,
    hook,
    arcNarratif: lang === "fr" ? "témoignage transformation" : "transformation testimonial",
    marqueDetectee: brand?.name,
    pointsVigilance:
      lang === "fr"
        ? ["Mode simulé : relis le script toi-même pour détecter les ambiguïtés visuelles avant de lancer les frames."]
        : ["Simulated mode: re-read the script yourself to catch visual ambiguities before launching frames."],
  };
}

/** Génère 3 variantes d'accroche (hooks) basées sur la marque et le produit. */
export async function generateHooks(params: {
  brand?: Brand;
  lang: Lang;
  apiKey?: string;
  systemPromptOverride?: string;
}): Promise<string[]> {
  const { brand, lang, apiKey, systemPromptOverride } = params;

  if (apiKey) {
    try {
      const res = await fetch("/api/claude/generate-hooks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey,
          brandName: brand?.name,
          brandDescription: brand?.description,
          brandTone: brand?.tone,
          lang,
          systemPromptOverride,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur API ${res.status}`);
      if (Array.isArray(data.hooks) && data.hooks.length > 0) return data.hooks;
    } catch (e) {
      console.error("Appel Claude API échoué (hooks), repli sur le mode simulé :", e);
    }
  }

  await simulatedDelay(900, 1800);
  const name = brand?.name ?? (lang === "fr" ? "ce produit" : "this product");

  if (lang === "fr") {
    return [
      `Et si votre routine du matin changeait tout ? Découvrez ${name}.`,
      `Arrêtez de chercher — ${name} a déjà la réponse.`,
      `95% des gens ignorent ce détail... jusqu'à ce qu'ils essaient ${name}.`,
    ];
  }
  return [
    `What if your morning routine changed everything? Meet ${name}.`,
    `Stop searching — ${name} already has the answer.`,
    `95% of people miss this detail... until they try ${name}.`,
  ];
}

/**
 * Intègre une modification en langage libre (ex: "option 2 mais cheveux blonds")
 * dans un prompt de fiche casting existant, via Claude. Si l'appel échoue ou
 * qu'aucune clé n'est fournie, retombe sur une concaténation simple du texte
 * de modification à la fin du prompt d'origine.
 */
export async function refineCharacterPrompt(
  basePrompt: string,
  modification: string,
  apiKey?: string
): Promise<string> {
  if (apiKey) {
    try {
      const res = await fetch("/api/claude/refine-character-prompt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey, basePrompt, modification }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur API ${res.status}`);
      if (typeof data.refinedPrompt === "string" && data.refinedPrompt.trim()) return data.refinedPrompt;
    } catch (e) {
      console.error("Appel Claude API échoué (refine-character-prompt), repli sur une concaténation simple :", e);
    }
  }
  return `${basePrompt} Modification demandée : ${modification}.`;
}

export type ExtractedStyle = Omit<StylePreset, "id" | "isCustom" | "createdAt">;

/**
 * Analyse les images de référence fournies (vision Claude) et en extrait un
 * DNA visuel complet (type de rendu, palette, détail, trait, lumière, style
 * des personnages) synthétisé en un style réutilisable. Le style n'est
 * JAMAIS fixé à l'avance — toujours extrait des images pour ce brief précis.
 */
export async function extractStyleFromImages(
  images: string[],
  lang: Lang,
  apiKey: string
): Promise<ExtractedStyle> {
  const res = await fetch("/api/claude/extract-style", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ apiKey, images, lang }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Erreur API ${res.status}`);

  const detailsLine = [data.renderType, data.colorPalette, data.detailLevel, data.lineStyle, data.lightingMood, data.characterStyle]
    .filter(Boolean)
    .join(" · ");

  return {
    name: data.name ?? "Style extrait",
    icon: "Sparkles",
    shortDescription: data.shortDescription ?? detailsLine,
    positivePrompt: data.positivePrompt,
    negativePrompt: data.negativePrompt ?? "",
    recommendedImageEngine: "nano_banana",
    recommendedVideoEngine: lang === "en" ? "kling_3_0" : "grok_video",
    bestFor: ["fr", "en"],
  };
}

export interface CoConstructionTurn {
  message: string;
  quickReplies: string[];
  isFinalSynthesis: boolean;
  synthesis?: string;
}

/**
 * Fait avancer d'un tour la conversation de co-construction du brief (Étape 0).
 * `history` est la transcription des tours précédents (texte simple, pas de
 * blocs tool_use) — Claude gère lui-même sa progression dans les 6 blocs
 * définis par le system prompt, on ne code aucune logique de bloc côté client.
 */
export async function coConstructBrief(params: {
  brief: string;
  history: { role: "user" | "assistant"; content: string }[];
  apiKey: string;
  systemPromptOverride?: string;
  styleName?: string;
}): Promise<CoConstructionTurn> {
  const res = await fetch("/api/claude/co-construction", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      apiKey: params.apiKey,
      brief: params.brief,
      history: params.history,
      systemPromptOverride: params.systemPromptOverride,
      styleName: params.styleName,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Erreur API ${res.status}`);

  return {
    message: data.message ?? "",
    quickReplies: Array.isArray(data.quickReplies) ? data.quickReplies : [],
    isFinalSynthesis: !!data.isFinalSynthesis,
    synthesis: data.synthesis,
  };
}
