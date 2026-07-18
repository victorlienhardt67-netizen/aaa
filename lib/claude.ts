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

interface ClaudeScene {
  description: string;
  durationSeconds: number;
  cameraMovement: string;
  hasProduct: boolean;
  hasCharacter: boolean;
  characterName?: string;
  characterState?: string;
  needsFrame: boolean;
  imagePrompt: string;
  videoPrompt: string;
  dialogueLang: Lang;
  voiceType?: "voiceover" | "lipsync" | "none";
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
  const characterPhoto = brand?.characterPhotos[0];
  const rawScenes: ClaudeScene[] = data.scenes ?? [];
  const characterNames: Record<string, string> = {};

  const scenes: Scene[] = rawScenes.map((s, i) => {
    let characters: string[] = [];
    if (s.hasCharacter) {
      const assetId = resolveCharacterAssetId(s.characterName, characterPhoto?.id);
      characters = [assetId];
      if (!characterNames[assetId]) {
        characterNames[assetId] = characterPhoto?.name || s.characterName || "Personnage principal";
      }
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
      characterState: s.hasCharacter ? s.characterState : undefined,
      hasProduct: s.hasProduct,
      productAssetId: s.hasProduct ? productPhoto?.id : undefined,
      needsFrame: s.needsFrame,
      imagePrompt: s.imagePrompt,
      videoPrompt: s.videoPrompt,
      dialogueLang: s.dialogueLang ?? lang,
      voiceType: s.voiceType ?? "none",
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
  };
}

interface BeatTemplate {
  labelFr: string;
  labelEn: string;
  weight: number; // poids relatif dans la répartition du nombre total de frames
  minDuration: number;
  maxDuration: number;
  isTransformation?: boolean; // scinde le beat en état "avant" puis "après"
}

/** Blocs narratifs types utilisés par le mode simulé, alignés sur les règles du cahier des charges. */
const BEAT_TEMPLATES: BeatTemplate[] = [
  { labelFr: "Accroche", labelEn: "Hook", weight: 2.5, minDuration: 3, maxDuration: 4 },
  { labelFr: "Présentation du problème", labelEn: "Problem", weight: 3.5, minDuration: 4, maxDuration: 5 },
  { labelFr: "Introduction du produit", labelEn: "Product intro", weight: 2.5, minDuration: 5, maxDuration: 6 },
  { labelFr: "Démonstration des bénéfices", labelEn: "Benefits", weight: 2.5, minDuration: 5, maxDuration: 6 },
  {
    labelFr: "Transformation",
    labelEn: "Transformation",
    weight: 4.5,
    minDuration: 5,
    maxDuration: 8,
    isTransformation: true,
  },
  { labelFr: "Témoignage", labelEn: "Testimonial", weight: 2.5, minDuration: 5, maxDuration: 6 },
  { labelFr: "Récapitulatif des bénéfices", labelEn: "Recap", weight: 2.5, minDuration: 5, maxDuration: 6 },
  { labelFr: "Appel à l'action final", labelEn: "Final CTA", weight: 2, minDuration: 4, maxDuration: 5 },
];

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

  const scenes: Scene[] = [];
  let globalIndex = 0;

  BEAT_TEMPLATES.forEach((beatTemplate, beatIdx) => {
    const count = frameCounts[beatIdx];
    const beatLabel = lang === "fr" ? beatTemplate.labelFr : beatTemplate.labelEn;

    for (let j = 0; j < count; j++) {
      const camera = CAMERA_CYCLE[globalIndex % CAMERA_CYCLE.length];
      const framing = FRAMING_CYCLE[globalIndex % FRAMING_CYCLE.length];
      const hasProduct = beatTemplate.isTransformation ? false : globalIndex % 3 !== 1 && !!productPhoto;
      const hasCharacter = beatTemplate.isTransformation || globalIndex % 2 === 0;
      const characterState = beatTemplate.isTransformation
        ? j < Math.ceil(count / 2)
          ? lang === "fr"
            ? "avant, fatiguée"
            : "before, tired"
          : lang === "fr"
          ? "après, rayonnante"
          : "after, radiant"
        : undefined;
      const duration = Math.min(
        Math.max(beatTemplate.minDuration + (j % (beatTemplate.maxDuration - beatTemplate.minDuration + 1)), minDur),
        maxDur
      );

      const descriptionFr = `${beatLabel} — plan ${j + 1}/${count}${brand ? ` pour ${brand.name}` : ""}.`;
      const descriptionEn = `${beatLabel} — shot ${j + 1}/${count}${brand ? ` for ${brand.name}` : ""}.`;

      const imagePromptFr = `${beatLabel}, ${framing === "wide" ? "plan large" : framing === "medium" ? "plan moyen" : "gros plan"} — cadrage vertical 9:16, ${
        hasProduct ? "produit visible dans le cadre, " : ""
      }${hasCharacter ? "personnage en action dans la scène, " : ""}ambiance ${style.name.toLowerCase()}.`;
      const imagePromptEn = `${beatLabel}, ${framing.replace("_", " ")} — vertical 9:16 framing, ${
        hasProduct ? "product visible in frame, " : ""
      }${hasCharacter ? "character in action within the scene, " : ""}${style.name.toLowerCase()} mood.`;

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
        characterState,
        hasProduct,
        productAssetId: hasProduct ? productPhoto?.id : undefined,
        needsFrame: true,
        imagePrompt: lang === "fr" ? imagePromptFr : imagePromptEn,
        videoPrompt: lang === "fr" ? videoPromptFr : videoPromptEn,
        dialogueLang: lang,
        voiceType: hasCharacter ? "voiceover" : "none",
        framing,
        beatLabel,
        durationJustification: duration > 8 ? (lang === "fr" ? "Moment de transformation clé, plan choc justifiant une durée plus longue." : "Key transformation moment, impact shot justifying a longer duration.") : undefined,
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
      ? `Brief analysé (mode simulé) : ${totalFrames} frames détectées à partir du script pour une durée cible de ${targetDuration}s (cible ${frameMin}-${frameMax}). Structure narrative type "accroche → problème → produit → bénéfices → transformation → témoignage → récap → appel à l'action"${
          brand ? ` adaptée à ${brand.name}` : ""
        }. Chaque frame reste entre ${minDur}s et ${maxDur}s (jusqu'à 10s si justifié) pour garder la vidéo dynamique, avec alternance systématique des cadrages.`
      : `Brief analyzed (simulated mode): ${totalFrames} frames detected from the script for a ${targetDuration}s target duration (target ${frameMin}-${frameMax}). Narrative structure follows a "hook → problem → product → benefits → transformation → testimonial → recap → call to action" arc${
          brand ? ` adapted for ${brand.name}` : ""
        }. Each frame stays between ${minDur}s and ${maxDur}s (up to 10s when justified) to keep the video dynamic, with systematic framing alternation.`;

  return {
    scenes,
    detectedLang,
    generatedAt: new Date().toISOString(),
    briefAnalysis,
    characterNames,
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
