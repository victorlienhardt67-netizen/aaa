"use client";

import { useState } from "react";
import { AlertTriangle, Check, RefreshCw, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useStyleStore } from "@/store/styleStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useLearningStore } from "@/store/learningStore";
import { LearningEntry, MotionIntensity, Scene, StylePreset, VideoEngine } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { falGenerateVideo } from "@/lib/fal";
import {
  buildScenePositivePrompt,
  buildGrokVideoPrompt,
  buildKlingVideoPrompt,
  buildMandatoryVideoRules,
  buildLearningContext,
  buildVoiceDirective,
} from "@/lib/prompts";
import { estimateDurationFromWordCount, formatCost, mapWithConcurrency } from "@/lib/utils";

const FEEDBACK_REASONS = [
  { value: "mouvement_lent", label: "Mouvement trop lent" },
  { value: "style_non_respecte", label: "Style pas respecté" },
  { value: "personnage_incoherent", label: "Personnage incohérent" },
  { value: "autre", label: "Autre" },
];

/**
 * Génère la vidéo d'une scène — logique partagée entre le bouton individuel
 * de chaque carte et le workflow batch ("3 premières puis le reste") de
 * VideoGenerator, pour ne jamais dupliquer la construction du prompt.
 */
async function generateSceneVideo(params: {
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
  updateScene: (sceneId: string, patch: Partial<Scene>) => void;
  recalcTotalCost: () => void;
}) {
  const { scene, prompt, style, engine, lang, motionIntensity, mandatoryVideoRules, characterNames, learningEntries, apiKey, updateScene, recalcTotalCost } = params;
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
  // Règle Grok FR : la durée est toujours calculée et fixée explicitement
  // depuis le nombre de mots du dialogue (÷2,5) — jamais laissée à Grok.
  const hasSpeech =
    (scene.voiceType === "voiceover" || scene.voiceType === "lipsync") && !!scene.voiceOver?.text?.trim();
  const durationSeconds =
    lang === "fr" && engine === "grok_video" && hasSpeech
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

function SceneVideoCard({ scene }: { scene: Scene }) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateScene = useProjectStore((s) => s.updateScene);
  const recalcTotalCost = useProjectStore((s) => s.recalcTotalCost);
  const styles = useStyleStore((s) => s.styles);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const motionIntensity = useSettingsStore((s) => s.generationDefaults.motionIntensity);
  const mandatoryVideoRules = useSettingsStore((s) => s.advancedPrompts.mandatoryVideoRules);
  const addLearningEntry = useLearningStore((s) => s.addEntry);
  const learningEntries = useLearningStore((s) => s.entries);

  const [editing, setEditing] = useState(false);
  const [promptDraft, setPromptDraft] = useState(scene.videoPrompt);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState(FEEDBACK_REASONS[0].value);
  const [feedbackComment, setFeedbackComment] = useState("");

  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];
  const engine = currentProject?.videoEngine ?? "auto";
  const lang = currentProject?.lang ?? "fr";

  async function runGeneration(prompt: string) {
    await generateSceneVideo({
      scene,
      prompt,
      style,
      engine,
      lang,
      motionIntensity,
      mandatoryVideoRules,
      characterNames: currentProject?.plan?.characterNames,
      learningEntries,
      apiKey: apiKeys.falApiKey,
      updateScene,
      recalcTotalCost,
    });
  }

  function submitFeedback(rating: "up" | "down") {
    if (rating === "down") {
      setFeedbackOpen(true);
      return;
    }
    updateScene(scene.id, {
      feedback: { id: scene.id, sceneId: scene.id, rating: "up", engine, createdAt: new Date().toISOString() },
    });
  }

  function confirmNegativeFeedback() {
    updateScene(scene.id, {
      feedback: {
        id: scene.id,
        sceneId: scene.id,
        rating: "down",
        reason: feedbackReason,
        comment: feedbackComment,
        engine,
        createdAt: new Date().toISOString(),
      },
    });
    addLearningEntry({
      engine,
      reason: FEEDBACK_REASONS.find((r) => r.value === feedbackReason)?.label ?? feedbackReason,
      comment: feedbackComment,
    });
    setFeedbackOpen(false);
    setFeedbackComment("");
  }

  const isGenerating = scene.videoStatus === "video_generating";
  const isValidated = scene.videoStatus === "video_validated";
  const isError = scene.videoStatus === "error";

  const statusLabel = isValidated
    ? "Terminé"
    : scene.videoStatus === "video_generated"
    ? "À valider"
    : isGenerating
    ? "En génération"
    : isError
    ? "Erreur"
    : "En attente";

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-gold-light">Scène #{scene.index}</span>
        <Badge tone={isValidated ? "success" : isError ? "danger" : scene.videoStatus === "video_generated" ? "gold" : "neutral"}>
          {statusLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-[80px_1fr] gap-3">
        <div className="aspect-[9/16] bg-surface2 border border-border rounded overflow-hidden shrink-0">
          {scene.frameUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scene.frameUrl} alt="frame" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="aspect-[9/16] bg-surface2 border border-border rounded overflow-hidden flex items-center justify-center">
          {isGenerating && (
            <div className="flex flex-col items-center gap-2 text-ink-secondary">
              <RefreshCw className="w-5 h-5 animate-spin text-gold" />
              <span className="text-[10px] font-mono">~15-30s estimées</span>
            </div>
          )}
          {!isGenerating && scene.videoUrl && (
            <video src={scene.videoUrl} controls className="w-full h-full object-cover" />
          )}
          {!isGenerating && !scene.videoUrl && (
            <span className="text-xs text-ink-secondary px-4 text-center">Aucune vidéo générée</span>
          )}
        </div>
      </div>

      {!isGenerating && scene.videoError && (
        <div className="flex items-start gap-1.5 bg-red-950/30 border border-red-900/50 rounded p-2 text-[11px] text-red-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{scene.videoError}</span>
        </div>
      )}

      {editing ? (
        <div className="space-y-2">
          <Textarea rows={3} value={promptDraft} onChange={(e) => setPromptDraft(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { setEditing(false); runGeneration(promptDraft); }}>
              Régénérer avec ce prompt
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-secondary line-clamp-2">{scene.videoPrompt}</p>
      )}

      <div className="flex items-center justify-between text-[11px] font-mono text-ink-secondary">
        <span>{scene.videoCostEstimate ? formatCost(scene.videoCostEstimate) : "—"}</span>
        {scene.videoUrl && !isGenerating && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => submitFeedback("up")}
              className={`p-1 rounded ${scene.feedback?.rating === "up" ? "text-gold" : "text-ink-secondary hover:text-ink"}`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => submitFeedback("down")}
              className={`p-1 rounded ${scene.feedback?.rating === "down" ? "text-red-400" : "text-ink-secondary hover:text-ink"}`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {feedbackOpen && (
        <div className="bg-surface2 border border-border rounded p-3 space-y-2">
          <Select
            value={feedbackReason}
            onChange={(e) => setFeedbackReason(e.target.value)}
            options={FEEDBACK_REASONS}
          />
          <Textarea
            rows={2}
            placeholder="Qu'est-ce qui n'allait pas ?"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={confirmNegativeFeedback}>Envoyer</Button>
            <Button size="sm" variant="secondary" onClick={() => setFeedbackOpen(false)}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {!scene.videoUrl && (
          <Button size="sm" onClick={() => runGeneration(scene.videoPrompt)} disabled={isGenerating}>
            {scene.videoError ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" /> Réessayer
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Générer la vidéo
              </>
            )}
          </Button>
        )}
        {scene.videoUrl && !isGenerating && (
          <>
            {isValidated ? (
              <Button size="sm" variant="secondary" disabled>
                <Check className="w-3.5 h-3.5" /> Validée
              </Button>
            ) : (
              <Button size="sm" onClick={() => updateScene(scene.id, { videoStatus: "video_validated" })}>
                <Check className="w-3.5 h-3.5" /> Valider
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => runGeneration(scene.videoPrompt)}>
              <RefreshCw className="w-3.5 h-3.5" /> Régénérer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Modifier le prompt
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function VideoGenerator() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const updateScene = useProjectStore((s) => s.updateScene);
  const recalcTotalCost = useProjectStore((s) => s.recalcTotalCost);
  const styles = useStyleStore((s) => s.styles);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const motionIntensity = useSettingsStore((s) => s.generationDefaults.motionIntensity);
  const mandatoryVideoRules = useSettingsStore((s) => s.advancedPrompts.mandatoryVideoRules);
  const learningEntries = useLearningStore((s) => s.entries);
  const [generatingFirstBatch, setGeneratingFirstBatch] = useState(false);
  const [generatingRest, setGeneratingRest] = useState(false);

  const plan = currentProject?.plan;
  if (!plan || !currentProject) return null;

  const scenes = plan.scenes;
  const validatedCount = scenes.filter((s) => s.videoStatus === "video_validated").length;
  const allValidated = scenes.length > 0 && validatedCount === scenes.length;

  const style = styles.find((s) => s.id === currentProject.styleId) ?? styles[0];
  const engine = currentProject.videoEngine ?? "auto";
  const lang = currentProject.lang ?? "fr";
  const characterNames = plan.characterNames;

  // Workflow "3 premières puis batch" — uniquement pertinent s'il y a plus de
  // 3 scènes ; sinon la génération individuelle normale suffit.
  const firstBatch = scenes.slice(0, 3);
  const restBatch = scenes.slice(3);
  const firstBatchGenerated = firstBatch.length > 0 && firstBatch.every((s) => !!s.videoUrl);
  const firstBatchValidated = firstBatch.length > 0 && firstBatch.every((s) => s.videoStatus === "video_validated");

  async function generateBatch(batchScenes: Scene[]) {
    await mapWithConcurrency(batchScenes, 8, (scene) =>
      generateSceneVideo({
        scene,
        prompt: scene.videoPrompt,
        style,
        engine,
        lang,
        motionIntensity,
        mandatoryVideoRules,
        characterNames,
        learningEntries,
        apiKey: apiKeys.falApiKey,
        updateScene,
        recalcTotalCost,
      })
    );
  }

  async function handleGenerateFirstBatch() {
    setGeneratingFirstBatch(true);
    await generateBatch(firstBatch);
    setGeneratingFirstBatch(false);
  }

  async function handleGenerateRest() {
    setGeneratingRest(true);
    await generateBatch(restBatch);
    setGeneratingRest(false);
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink mb-1">Génération des vidéos</h1>
          <p className="text-sm text-ink-secondary">
            {validatedCount}/{scenes.length} vidéos validées
          </p>
        </div>
        {restBatch.length > 0 && (
          <div className="flex gap-2">
            {!firstBatchValidated ? (
              <Button variant="secondary" onClick={handleGenerateFirstBatch} disabled={generatingFirstBatch}>
                <Sparkles className="w-4 h-4" />{" "}
                {generatingFirstBatch
                  ? "Génération..."
                  : firstBatchGenerated
                  ? "Régénérer les 3 premières"
                  : "Générer les 3 premières"}
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleGenerateRest} disabled={generatingRest}>
                <Sparkles className="w-4 h-4" /> {generatingRest ? "Génération..." : `Générer le reste en batch (${restBatch.length})`}
              </Button>
            )}
          </div>
        )}
      </div>

      {restBatch.length > 0 && !firstBatchValidated && (
        <p className="text-xs text-ink-secondary bg-surface2 border border-border rounded p-3">
          Valide d&apos;abord les 3 premières vidéos (voix + rendu global) avant de lancer le reste en batch.
        </p>
      )}

      <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold transition-all duration-500"
          style={{ width: `${scenes.length ? (validatedCount / scenes.length) * 100 : 0}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.map((scene) => (
          <SceneVideoCard key={scene.id} scene={scene} />
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={() => setStatus("export")} disabled={!allValidated}>
          Finaliser le projet
        </Button>
      </div>
    </div>
  );
}
