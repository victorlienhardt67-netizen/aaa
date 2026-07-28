import { Brand, LearningEntry, MotionIntensity, Project, Scene, StylePreset, VideoEngine } from "@/types";
import { falGenerateVideo } from "@/lib/fal";
import { generateVoiceoverAudio } from "@/lib/elevenlabsTts";
import { getReferenceImageInfo } from "@/lib/frameReferences";
import {
  buildScenePositivePrompt,
  buildKlingAvatarPrompt,
  buildGrokVideoPrompt,
  buildGrokReferenceNotes,
  buildKlingVideoPrompt,
  buildMandatoryVideoRules,
  buildLearningContext,
  buildVoiceDirective,
} from "@/lib/prompts";
import { estimateDurationFromWordCount } from "@/lib/utils";

// Certains moteurs fal.ai rejettent un prompt vidéo au-delà d'environ 2500
// caractères — marge de sécurité sous ce seuil observé.
const MAX_VIDEO_PROMPT_CHARS = 2400;

/**
 * Génère la vidéo d'une scène — logique partagée entre la génération
 * individuelle et le workflow batch ("3 premières puis le reste") de
 * MediaCanvas (composants/studio-agent), pour ne jamais dupliquer la
 * construction du prompt.
 */
export async function generateSceneVideo(params: {
  scene: Scene;
  prompt: string;
  style: StylePreset;
  engine: VideoEngine;
  lang: "fr" | "en";
  motionIntensity: MotionIntensity;
  mandatoryVideoRules: string;
  characterNames: Record<string, string> | undefined;
  /** Description fixe de la voix du personnage qui parle dans cette scène (voir Scene.characters[0]), pour que sa voix reste identique d'une scène à l'autre. */
  voiceDescription?: string;
  learningEntries: LearningEntry[];
  apiKey: string;
  /** true si le projet a un fichier audio voix off calé (VoiceOverBlock) — la durée de scène vient alors de ce calage réel, jamais de l'estimation mots. */
  audioCalibrated?: boolean;
  /** Fiches personnages/décor validées du projet — utilisées par Grok Video (reference-to-video) pour fournir des images de référence en plus de la frame. */
  currentProject: Pick<Project, "characterReferences" | "locationReferences"> | undefined;
  /** Marque du projet (photo produit) — même usage que currentProject ci-dessus. */
  brand: Brand | undefined;
  /** Requis uniquement pour le moteur "kling_ai_avatar" (test) — sert à générer l'audio via ElevenLabs avant l'animation. */
  elevenLabsApiKey?: string;
  updateScene: (sceneId: string, patch: Partial<Scene>) => void;
  recalcTotalCost: () => void;
}) {
  const { scene, prompt, style, engine, lang, motionIntensity, mandatoryVideoRules, characterNames, voiceDescription, learningEntries, apiKey, audioCalibrated, currentProject, brand, elevenLabsApiKey, updateScene, recalcTotalCost } = params;
  updateScene(scene.id, { videoStatus: "video_generating", videoError: undefined });

  // Kling AI Avatar (test) : anime un personnage qui parle à l'écran à partir
  // d'un audio réel (ElevenLabs) — ne s'applique donc qu'aux scènes en vrai
  // lipsync (voiceType="lipsync"). Une scène en voix off (voiceType=
  // "voiceover", personne ne parle visiblement à l'écran) n'est pas un cas
  // que ce moteur sait gérer proprement : mieux vaut le signaler clairement
  // que de forcer une animation de bouche sur un plan qui n'en a pas besoin.
  if (engine === "kling_ai_avatar") {
    try {
      if (scene.voiceType !== "lipsync") {
        throw new Error(
          "Kling AI Avatar (test) est fait pour un personnage qui parle à l'écran (lipsync) — cette scène est en voix off ou sans voix, utilise Grok Video/Kling 3.0 pour elle."
        );
      }
      const text = scene.voiceOver?.text?.trim();
      if (!text) {
        throw new Error(
          "Kling AI Avatar (test) nécessite un texte de voix off/dialogue sur cette scène — aucune voix détectée ici."
        );
      }
      const sceneWithPrompt = { ...scene, videoPrompt: prompt };
      const animationPrompt = buildKlingAvatarPrompt(sceneWithPrompt, style, motionIntensity);
      const characterKey = scene.characters[0] ?? "default";
      const voiceArchetype = currentProject?.characterReferences?.[characterKey]?.voiceArchetype;
      const { audioUrl } = await generateVoiceoverAudio(
        text,
        characterKey,
        elevenLabsApiKey,
        apiKey,
        voiceArchetype,
        voiceDescription
      );
      const result = await falGenerateVideo(animationPrompt, scene.frameUrl, engine, scene.durationSeconds, apiKey, [], audioUrl);
      updateScene(scene.id, {
        videoUrl: result.url,
        videoStatus: "video_generated",
        videoCostEstimate: result.costEstimate,
        videoPrompt: prompt,
        videoError: undefined,
      });
      recalcTotalCost();
    } catch (e) {
      updateScene(scene.id, {
        videoStatus: "error",
        videoError: e instanceof Error ? e.message : "Erreur inconnue",
      });
    }
    return;
  }

  const relevantLearning = buildLearningContext(learningEntries.filter((e) => e.engine === engine));
  const voiceDirective = buildVoiceDirective(scene.voiceOver, lang, scene.voiceType, voiceDescription);
  const sceneWithPrompt = { ...scene, videoPrompt: prompt };

  // Grok Video (reference-to-video) accepte jusqu'à 7 images de référence en
  // plus de la frame de départ — on ne les collecte que pour ce moteur (Kling
  // n'utilise qu'une seule image de départ, inutile d'y payer le coût du
  // recadrage des fiches personnage).
  const referenceInfo = engine === "grok_video" ? await getReferenceImageInfo(scene, currentProject, brand) : undefined;
  const additionalReferenceImageUrls = referenceInfo?.urls ?? [];

  const engineBody =
    engine === "grok_video"
      ? buildGrokVideoPrompt(
          sceneWithPrompt,
          style,
          motionIntensity,
          voiceDirective,
          buildGrokReferenceNotes({
            hasProductReference: referenceInfo?.hasProductReference,
            characterReferenceCount: referenceInfo?.characterReferenceCount,
            hasLocationReference: referenceInfo?.hasLocationReference,
          })
        )
      : engine === "kling_3_0"
      ? buildKlingVideoPrompt(sceneWithPrompt, style, motionIntensity, voiceDirective, characterNames)
      : [buildScenePositivePrompt(sceneWithPrompt, style, motionIntensity), voiceDirective].join(" ");
  const rulesBlock = `\n\nRègles obligatoires :\n${buildMandatoryVideoRules(motionIntensity, lang, mandatoryVideoRules)}`;
  const learningBlock = relevantLearning ? `\n\n${relevantLearning}` : "";
  // Garde-fou longueur : le contenu créatif/voix (engineBody) ne doit jamais
  // être coupé — on retire d'abord le contexte d'apprentissage (le moins
  // critique), puis en dernier recours on raccourcit les règles obligatoires,
  // pour rester sous la limite de caractères de certains moteurs fal.ai.
  let fullPrompt = [engineBody, rulesBlock, learningBlock].filter(Boolean).join(" ");
  if (fullPrompt.length > MAX_VIDEO_PROMPT_CHARS) {
    fullPrompt = [engineBody, rulesBlock].filter(Boolean).join(" ");
  }
  if (fullPrompt.length > MAX_VIDEO_PROMPT_CHARS) {
    const budgetForRules = Math.max(0, MAX_VIDEO_PROMPT_CHARS - engineBody.length - 1);
    fullPrompt = [engineBody, rulesBlock.slice(0, budgetForRules)].filter(Boolean).join(" ");
  }
  // Filet de sécurité débit de parole : Claude est censé déjà caler
  // durationSeconds sur le débit naturel de la réplique (voir system prompt),
  // mais si une frame porte une voix (voiceover ou lipsync, quel que soit le
  // moteur/la langue) et que sa durée reste trop courte pour ce texte, on la
  // relève au minimum requis (÷2,5 mots/seconde) — jamais en dessous, pour ne
  // jamais forcer une réplique à être précipitée. On ne redescend jamais une
  // durée déjà plus longue que ce minimum (Claude a pu l'étendre à dessein).
  // Si un fichier audio voix off a été calé (VoiceOverBlock ou Whisper), sa
  // durée réelle est plus fiable que cette estimation : ne jamais l'écraser.
  const hasSpeech =
    (scene.voiceType === "voiceover" || scene.voiceType === "lipsync") && !!scene.voiceOver?.text?.trim();
  const minDurationForSpeech = hasSpeech && !audioCalibrated ? estimateDurationFromWordCount(scene.voiceOver!.text) : 0;
  const durationSeconds = Math.max(scene.durationSeconds, minDurationForSpeech);
  if (durationSeconds !== scene.durationSeconds) {
    updateScene(scene.id, { durationSeconds });
  }
  try {
    const result = await falGenerateVideo(fullPrompt, scene.frameUrl, engine, durationSeconds, apiKey, additionalReferenceImageUrls);
    updateScene(scene.id, {
      videoUrl: result.url,
      videoStatus: "video_generated",
      videoCostEstimate: result.costEstimate,
      videoPrompt: prompt,
      videoError: undefined,
    });
    recalcTotalCost();
  } catch (e) {
    updateScene(scene.id, {
      videoStatus: "error",
      videoError: e instanceof Error ? e.message : "Erreur inconnue",
    });
  }
}
