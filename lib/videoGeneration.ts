import { LearningEntry, MotionIntensity, Scene, StylePreset, VideoEngine } from "@/types";
import { falGenerateVideo } from "@/lib/fal";
import {
  buildScenePositivePrompt,
  buildGrokVideoPrompt,
  buildKlingVideoPrompt,
  buildMandatoryVideoRules,
  buildLearningContext,
  buildVoiceDirective,
} from "@/lib/prompts";
import { estimateDurationFromWordCount } from "@/lib/utils";

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
  learningEntries: LearningEntry[];
  apiKey: string;
  /** true si le projet a un fichier audio voix off calé (VoiceOverBlock) — la durée de scène vient alors de ce calage réel, jamais de l'estimation mots. */
  audioCalibrated?: boolean;
  updateScene: (sceneId: string, patch: Partial<Scene>) => void;
  recalcTotalCost: () => void;
}) {
  const { scene, prompt, style, engine, lang, motionIntensity, mandatoryVideoRules, characterNames, learningEntries, apiKey, audioCalibrated, updateScene, recalcTotalCost } = params;
  updateScene(scene.id, { videoStatus: "video_generating", videoError: undefined });
  const relevantLearning = buildLearningContext(learningEntries.filter((e) => e.engine === engine));
  const voiceDirective = buildVoiceDirective(scene.voiceOver, lang, scene.voiceType);
  const sceneWithPrompt = { ...scene, videoPrompt: prompt };
  const engineBody =
    engine === "grok_video"
      ? buildGrokVideoPrompt(sceneWithPrompt, style, motionIntensity, voiceDirective)
      : engine === "kling_3_0"
      ? buildKlingVideoPrompt(sceneWithPrompt, style, motionIntensity, voiceDirective, characterNames)
      : [buildScenePositivePrompt(sceneWithPrompt, style, motionIntensity), voiceDirective].join(" ");
  const fullPrompt = [
    engineBody,
    `\n\nRègles obligatoires :\n${buildMandatoryVideoRules(motionIntensity, lang, mandatoryVideoRules)}`,
    relevantLearning && `\n\n${relevantLearning}`,
  ]
    .filter(Boolean)
    .join(" ");
  // Règle Grok FR : à défaut de calage audio réel, la durée est calculée et
  // fixée depuis le nombre de mots du dialogue (÷2,5) — jamais laissée à
  // Grok. Si un fichier audio voix off a été calé (VoiceOverBlock), sa
  // durée réelle est plus fiable que cette estimation : ne jamais l'écraser.
  const hasSpeech =
    (scene.voiceType === "voiceover" || scene.voiceType === "lipsync") && !!scene.voiceOver?.text?.trim();
  const durationSeconds =
    lang === "fr" && engine === "grok_video" && hasSpeech && !audioCalibrated
      ? estimateDurationFromWordCount(scene.voiceOver!.text)
      : scene.durationSeconds;
  if (durationSeconds !== scene.durationSeconds) {
    updateScene(scene.id, { durationSeconds });
  }
  try {
    const result = await falGenerateVideo(fullPrompt, scene.frameUrl, engine, durationSeconds, apiKey);
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
