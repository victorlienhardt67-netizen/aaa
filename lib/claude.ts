// Client Claude API — analyse de brief + génération de prompts.
// Si une clé API est fournie (Paramètres), les appels réels passent par les routes
// /api/claude/* (voir app/api/claude/) qui interrogent l'API Claude côté serveur.
// Sans clé, ou en cas d'erreur, on retombe sur un plan simulé mais réaliste.

import { Brand, CameraMovement, Lang, MotionIntensity, ProductionPlan, Scene, StylePreset } from "@/types";
import { estimateSceneCountFromBrief, generateId } from "./utils";
import { simulatedDelay } from "./mock";

const CAMERA_CYCLE: CameraMovement[] = [
  "push_in",
  "whip_pan",
  "orbit_360",
  "crane_up",
  "handheld_shake",
  "zoom_explosif",
  "tilt_reveal",
  "dolly_out",
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
  needsFrame: boolean;
  imagePrompt: string;
  videoPrompt: string;
  dialogueLang: Lang;
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

  const scenes: Scene[] = rawScenes.map((s, i) => ({
    id: generateId("scene"),
    index: i + 1,
    description: s.description,
    durationSeconds: s.durationSeconds,
    cameraMovement: (CAMERA_CYCLE.includes(s.cameraMovement as CameraMovement)
      ? s.cameraMovement
      : CAMERA_CYCLE[i % CAMERA_CYCLE.length]) as CameraMovement,
    characters: s.hasCharacter && characterPhoto ? [characterPhoto.id] : [],
    hasProduct: s.hasProduct,
    productAssetId: s.hasProduct ? productPhoto?.id : undefined,
    needsFrame: s.needsFrame,
    imagePrompt: s.imagePrompt,
    videoPrompt: s.videoPrompt,
    dialogueLang: s.dialogueLang ?? lang,
    frameStatus: "frame_pending",
    frameHistory: [],
    videoStatus: "video_pending",
  }));

  return {
    scenes,
    detectedLang: (data.detectedLang as Lang) ?? lang,
    generatedAt: new Date().toISOString(),
    briefAnalysis: data.briefAnalysis,
  };
}

/** Plan de production simulé — utilisé sans clé API ou en repli sur erreur. */
async function analyzeBriefMock(params: AnalyzeBriefParams): Promise<ProductionPlan> {
  const { brief, brand, style, lang, targetDuration, minSceneDurationSeconds, maxSceneDurationSeconds } = params;
  await simulatedDelay(1500, 3000);

  // Le nombre de plans (et donc de frames de départ) est détecté à partir du
  // script lui-même, pas uniquement de la durée cible, pour garder la vidéo dynamique.
  const sceneCount = estimateSceneCountFromBrief(
    brief,
    targetDuration,
    minSceneDurationSeconds,
    maxSceneDurationSeconds
  );
  const detectedLang = detectLang(brief) === lang ? lang : detectLang(brief);

  const beatNames =
    lang === "fr"
      ? [
          "Accroche visuelle percutante",
          "Présentation du problème",
          "Introduction du produit",
          "Démonstration des bénéfices",
          "Preuve sociale / témoignage",
          "Utilisation au quotidien",
          "Gros plan produit",
          "Moment émotionnel",
          "Récapitulatif des bénéfices",
          "Appel à l'action final",
        ]
      : [
          "Powerful visual hook",
          "Problem introduction",
          "Product reveal",
          "Benefits demonstration",
          "Social proof / testimonial",
          "Everyday use moment",
          "Product close-up",
          "Emotional beat",
          "Benefits recap",
          "Final call to action",
        ];

  const productPhoto = brand?.productPhotos[0];
  const characterPhoto = brand?.characterPhotos[0];

  const scenes: Scene[] = Array.from({ length: sceneCount }).map((_, i) => {
    const beat = beatNames[i % beatNames.length];
    const camera = CAMERA_CYCLE[i % CAMERA_CYCLE.length];
    const hasProduct = i % 3 !== 1 && !!productPhoto;
    const hasCharacter = i % 2 === 0 && !!characterPhoto;
    const duration = Math.max(3, Math.round(targetDuration / sceneCount));

    const descriptionFr = `${beat}${brand ? ` pour ${brand.name}` : ""}.`;
    const descriptionEn = `${beat}${brand ? ` for ${brand.name}` : ""}.`;

    const imagePromptFr = `${beat} — cadrage vertical 9:16, ${
      hasProduct ? "produit visible au premier plan, " : ""
    }${hasCharacter ? "personnage principal présent, " : ""}ambiance ${style.name.toLowerCase()}.`;
    const imagePromptEn = `${beat} — vertical 9:16 framing, ${
      hasProduct ? "product visible in foreground, " : ""
    }${hasCharacter ? "main character present, " : ""}${style.name.toLowerCase()} mood.`;

    const videoPromptFr = `${descriptionFr} Mouvement de caméra en ${camera.replace(
      /_/g,
      " "
    )}, le sujet bouge naturellement dans le cadre, transition fluide vers le plan suivant.`;
    const videoPromptEn = `${descriptionEn} Camera movement ${camera.replace(
      /_/g,
      " "
    )}, subject moves naturally within frame, smooth transition into the next shot.`;

    return {
      id: generateId("scene"),
      index: i + 1,
      description: lang === "fr" ? descriptionFr : descriptionEn,
      durationSeconds: duration,
      cameraMovement: camera,
      characters: hasCharacter && characterPhoto ? [characterPhoto.id] : [],
      hasProduct,
      productAssetId: hasProduct ? productPhoto?.id : undefined,
      needsFrame: true,
      imagePrompt: lang === "fr" ? imagePromptFr : imagePromptEn,
      videoPrompt: lang === "fr" ? videoPromptFr : videoPromptEn,
      dialogueLang: lang,
      frameStatus: "frame_pending",
      frameHistory: [],
      videoStatus: "video_pending",
    };
  });

  const briefAnalysis =
    lang === "fr"
      ? `Brief analysé (mode simulé) : ${sceneCount} plans détectés à partir du script pour une durée cible de ${targetDuration}s. Structure narrative type "accroche → problème → produit → bénéfices → preuve sociale → appel à l'action"${
          brand ? ` adaptée à ${brand.name}` : ""
        }. Chaque plan reste entre ${minSceneDurationSeconds ?? 3}s et ${maxSceneDurationSeconds ?? 7}s pour garder la vidéo dynamique.`
      : `Brief analyzed (simulated mode): ${sceneCount} shots detected from the script for a ${targetDuration}s target duration. Narrative structure follows a "hook → problem → product → benefits → social proof → call to action" arc${
          brand ? ` adapted for ${brand.name}` : ""
        }. Each shot stays between ${minSceneDurationSeconds ?? 3}s and ${maxSceneDurationSeconds ?? 7}s to keep the video dynamic.`;

  return {
    scenes,
    detectedLang,
    generatedAt: new Date().toISOString(),
    briefAnalysis,
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
