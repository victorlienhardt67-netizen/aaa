// Client Claude API (claude-sonnet-4-6) — analyse de brief + génération de prompts.
// Intégration réelle à brancher ici (appel API avec la clé stockée dans Settings).
// Pour l'instant, retourne un plan de production mocké mais réaliste basé sur le brief fourni.

import { Brand, CameraMovement, Lang, ProductionPlan, Scene, StylePreset } from "@/types";
import { estimateSceneCount, generateId } from "./utils";
import { simulatedDelay } from "./mock";
import { buildBriefAnalysisSystemPrompt } from "./prompts";

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

/**
 * Analyse un brief et génère un plan de production détaillé, scène par scène.
 * Utilise buildBriefAnalysisSystemPrompt() comme system prompt (voir lib/prompts.ts).
 */
export async function analyzeBrief(params: {
  brief: string;
  brand?: Brand;
  style: StylePreset;
  lang: Lang;
  targetDuration: number;
  apiKey?: string;
}): Promise<ProductionPlan> {
  const { brief, brand, style, lang, targetDuration } = params;
  // TODO: brancher l'appel réel à l'API Claude avec buildBriefAnalysisSystemPrompt() en system prompt
  void buildBriefAnalysisSystemPrompt();
  await simulatedDelay(1500, 3000);

  const sceneCount = estimateSceneCount(targetDuration);
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

  return {
    scenes,
    detectedLang,
    generatedAt: new Date().toISOString(),
  };
}

/** Génère 3 variantes d'accroche (hooks) basées sur la marque et le produit. */
export async function generateHooks(params: {
  brand?: Brand;
  lang: Lang;
  apiKey?: string;
}): Promise<string[]> {
  const { brand, lang } = params;
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
