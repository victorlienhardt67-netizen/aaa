"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  Film,
  ImageIcon,
  Library,
  RefreshCw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UploadCloud,
  X,
} from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useBrandStore } from "@/store/brandStore";
import { useStyleStore } from "@/store/styleStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useLearningStore } from "@/store/learningStore";
import { Scene } from "@/types";
import { falGenerateImage } from "@/lib/fal";
import { buildImagePrompt } from "@/lib/prompts";
import { downloadImage, formatCost, mapWithConcurrency } from "@/lib/utils";
import { fileToBase64 } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { getReferenceImageInfo } from "@/lib/frameReferences";
import { generateSceneVideo } from "@/lib/videoGeneration";

const FEEDBACK_REASONS = [
  { value: "mouvement_lent", label: "Mouvement trop lent" },
  { value: "style_non_respecte", label: "Style pas respecté" },
  { value: "personnage_incoherent", label: "Personnage incohérent" },
  { value: "autre", label: "Autre" },
];

function statusBorder(status: Scene["frameStatus"] | Scene["videoStatus"], selected: boolean): string {
  if (selected) return "border-agent-acc shadow-[0_0_0_1px_rgba(168,85,247,0.4)]";
  if (status === "frame_validated" || status === "video_validated") return "border-agent-grn/50";
  if (status === "frame_generating" || status === "video_generating") return "border-agent-acc/60 animate-pulse";
  if (status === "error") return "border-red-500/50";
  if (status === "frame_generated" || status === "video_generated") return "border-agent-bd2";
  return "border-agent-bd";
}

function FrameDrawer({ scene, onClose }: { scene: Scene; onClose: () => void }) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateScene = useProjectStore((s) => s.updateScene);
  const recalcTotalCost = useProjectStore((s) => s.recalcTotalCost);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const styles = useStyleStore((s) => s.styles);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const mandatoryImageRules = useSettingsStore((s) => s.advancedPrompts.mandatoryImageRules);
  const [promptDraft, setPromptDraft] = useState(scene.imagePrompt);
  const uploadRef = useRef<HTMLInputElement>(null);

  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];
  const isGenerating = scene.frameStatus === "frame_generating";

  async function runGeneration(prompt: string) {
    updateScene(scene.id, { frameStatus: "frame_generating", frameError: undefined });
    const { urls, hasCharacterReference, hasProductReference, hasLocationReference } = getReferenceImageInfo(
      scene,
      currentProject ?? undefined,
      brand
    );
    const fullPrompt = buildImagePrompt({ imagePrompt: prompt }, style, brand, {
      hasCharacterReference,
      hasProductReference,
      hasLocationReference,
      customRules: mandatoryImageRules,
    });
    try {
      const result = await falGenerateImage(fullPrompt, currentProject?.imageEngine ?? "auto", apiKeys.falApiKey, urls.length > 0 ? urls : undefined);
      updateScene(scene.id, {
        frameUrl: result.url,
        frameStatus: "frame_generated",
        frameHistory: [...scene.frameHistory, result.url],
        imageCostEstimate: result.costEstimate,
        imagePrompt: prompt,
        frameError: undefined,
      });
      recalcTotalCost();
    } catch (e) {
      updateScene(scene.id, { frameStatus: "error", frameError: e instanceof Error ? e.message : "Erreur inconnue" });
    }
  }

  async function handleUpload(file: File) {
    const base64 = await fileToBase64(file);
    updateScene(scene.id, {
      frameUrl: base64,
      frameStatus: "frame_generated",
      frameHistory: [...scene.frameHistory, base64],
      frameProvided: true,
      frameError: undefined,
    });
  }

  return (
    <div className="absolute inset-0 z-20 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-[420px] shrink-0 bg-agent-s1 border-l border-agent-bd h-full overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-medium text-agent-t1">Scène #{scene.index}</span>
          <button onClick={onClose} className="text-agent-t3 hover:text-agent-t1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="aspect-[9/16] bg-agent-s2 border border-agent-bd rounded-lg overflow-hidden mb-3 flex items-center justify-center relative">
          {isGenerating && <RefreshCw className="w-6 h-6 animate-spin text-agent-acc" />}
          {!isGenerating && scene.frameUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scene.frameUrl} alt="" className="w-full h-full object-cover" />
          )}
          {!isGenerating && !scene.frameUrl && <span className="text-[12px] text-agent-t3">Aucune frame</span>}
          {scene.frameUrl && (
            <button
              onClick={() => downloadImage(scene.frameUrl!, `scene-${scene.index}-frame.jpg`)}
              className="absolute top-2 right-2 p-1.5 rounded bg-black/50 text-white hover:bg-black/70"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {scene.frameError && (
          <div className="flex items-start gap-1.5 bg-red-950/30 border border-red-900/50 rounded-md p-2.5 text-[11.5px] text-red-400 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {scene.frameError}
          </div>
        )}

        <textarea
          rows={4}
          value={promptDraft}
          onChange={(e) => setPromptDraft(e.target.value)}
          className="w-full bg-agent-s3 border border-agent-bd rounded-md p-2.5 text-[12px] text-agent-t1 focus:outline-none focus:border-agent-acc resize-none mb-3"
        />

        <div className="flex flex-wrap gap-1.5">
          {!scene.frameUrl ? (
            <>
              <button
                onClick={() => runGeneration(promptDraft)}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md bg-agent-acc hover:bg-agent-acc2 text-white disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" /> {scene.frameError ? "Réessayer" : "Générer"}
              </button>
              <button
                onClick={() => uploadRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md bg-agent-s3 border border-agent-bd2 text-agent-t1"
              >
                <UploadCloud className="w-3.5 h-3.5" /> J&apos;ai déjà une frame
              </button>
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                  e.target.value = "";
                }}
              />
            </>
          ) : (
            <>
              {scene.frameStatus !== "frame_validated" ? (
                <button
                  onClick={() => updateScene(scene.id, { frameStatus: "frame_validated" })}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md bg-agent-acc hover:bg-agent-acc2 text-white"
                >
                  <Check className="w-3.5 h-3.5" /> Valider
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-agent-grn"><Check className="w-3.5 h-3.5" /> Validée</span>
              )}
              <button
                onClick={() => runGeneration(promptDraft)}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md bg-agent-s3 border border-agent-bd2 text-agent-t1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Régénérer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FrameGrid({ onSelect }: { onSelect: (id: string) => void }) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const plan = currentProject?.plan;
  if (!plan) return null;
  const scenes = plan.scenes.filter((s) => s.needsFrame);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
      {scenes.map((scene) => {
        const isGenerating = scene.frameStatus === "frame_generating";
        const isValidated = scene.frameStatus === "frame_validated";
        return (
          <button
            key={scene.id}
            onClick={() => onSelect(scene.id)}
            className={cn(
              "text-left aspect-[9/16] bg-agent-s2 border rounded-lg overflow-hidden relative flex flex-col transition-colors",
              statusBorder(scene.frameStatus, false)
            )}
          >
            <div className="flex-1 flex items-center justify-center relative">
              {isGenerating && <RefreshCw className="w-4 h-4 animate-spin text-agent-acc" />}
              {!isGenerating && scene.frameUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={scene.frameUrl} alt="" className="w-full h-full object-cover" />
              )}
              {!isGenerating && !scene.frameUrl && <ImageIcon className="w-5 h-5 text-agent-t3" />}
              {isValidated && (
                <span className="absolute top-1.5 right-1.5 bg-agent-grn text-white rounded-full p-0.5">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </div>
            <div className="px-1.5 py-1 bg-agent-s1/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-agent-t2">#{scene.index}</span>
              {scene.frameError && <AlertTriangle className="w-3 h-3 text-red-400" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function VideoList() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateScene = useProjectStore((s) => s.updateScene);
  const recalcTotalCost = useProjectStore((s) => s.recalcTotalCost);
  const addLearningEntry = useLearningStore((s) => s.addEntry);
  const learningEntries = useLearningStore((s) => s.entries);
  const styles = useStyleStore((s) => s.styles);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const motionIntensity = useSettingsStore((s) => s.generationDefaults.motionIntensity);
  const mandatoryVideoRules = useSettingsStore((s) => s.advancedPrompts.mandatoryVideoRules);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [feedbackReason, setFeedbackReason] = useState(FEEDBACK_REASONS[0].value);

  const plan = currentProject?.plan;
  if (!plan || !currentProject) return null;

  const style = styles.find((s) => s.id === currentProject.styleId) ?? styles[0];
  const engine = currentProject.videoEngine ?? "auto";
  const lang = currentProject.lang ?? "fr";

  async function runGeneration(scene: Scene) {
    await generateSceneVideo({
      scene,
      prompt: scene.videoPrompt,
      style,
      engine,
      lang,
      motionIntensity,
      mandatoryVideoRules,
      characterNames: plan!.characterNames,
      learningEntries,
      apiKey: apiKeys.falApiKey,
      updateScene,
      recalcTotalCost,
    });
  }

  return (
    <div className="divide-y divide-agent-bd">
      {plan.scenes.map((scene) => {
        const isGenerating = scene.videoStatus === "video_generating";
        const isValidated = scene.videoStatus === "video_validated";
        return (
          <div key={scene.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 aspect-[9/16] bg-agent-s2 border border-agent-bd rounded overflow-hidden shrink-0">
              {scene.frameUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={scene.frameUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[12.5px] text-agent-t1">
                <span className="font-medium">Scène #{scene.index}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded",
                    isValidated && "bg-agent-grn/15 text-agent-grn",
                    isGenerating && "bg-agent-acc/15 text-agent-acc",
                    scene.videoStatus === "error" && "bg-red-500/15 text-red-400",
                    scene.videoStatus === "video_generated" && "bg-agent-amb/15 text-agent-amb"
                  )}
                >
                  {isValidated ? "Validée" : isGenerating ? "Génération..." : scene.videoStatus === "error" ? "Erreur" : scene.videoStatus === "video_generated" ? "À valider" : "En attente"}
                </span>
              </div>
              <div className="text-[11px] text-agent-t3 truncate">
                {engine} · {scene.durationSeconds}s · 9:16 {scene.videoCostEstimate ? `· ${formatCost(scene.videoCostEstimate)}` : ""}
              </div>
              {scene.videoError && <div className="text-[11px] text-red-400 mt-0.5">{scene.videoError}</div>}
            </div>
            {scene.videoUrl && !isGenerating && (
              <video src={scene.videoUrl} controls className="w-16 aspect-[9/16] rounded bg-black shrink-0" />
            )}
            <div className="flex items-center gap-1 shrink-0">
              {scene.videoUrl && (
                <button onClick={() => downloadImage(scene.videoUrl!, `scene-${scene.index}.mp4`)} className="p-1.5 text-agent-t3 hover:text-agent-t1">
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
              {!scene.videoUrl ? (
                <button
                  onClick={() => runGeneration(scene)}
                  disabled={isGenerating}
                  className="text-[11.5px] font-medium px-2.5 py-1.5 rounded-md bg-agent-acc hover:bg-agent-acc2 text-white disabled:opacity-40"
                >
                  {scene.videoError ? "Réessayer" : "Générer"}
                </button>
              ) : !isValidated ? (
                <button
                  onClick={() => updateScene(scene.id, { videoStatus: "video_validated" })}
                  className="text-[11.5px] font-medium px-2.5 py-1.5 rounded-md bg-agent-acc hover:bg-agent-acc2 text-white"
                >
                  Valider
                </button>
              ) : (
                <>
                  <button
                    onClick={() =>
                      updateScene(scene.id, { feedback: { id: scene.id, sceneId: scene.id, rating: "up", engine, createdAt: new Date().toISOString() } })
                    }
                    className={cn("p-1 rounded", scene.feedback?.rating === "up" ? "text-agent-acc" : "text-agent-t3 hover:text-agent-t1")}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFeedbackFor(scene.id)}
                    className={cn("p-1 rounded", scene.feedback?.rating === "down" ? "text-red-400" : "text-agent-t3 hover:text-agent-t1")}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
            {feedbackFor === scene.id && (
              <div className="absolute right-4 mt-2 bg-agent-s2 border border-agent-bd rounded-md p-2.5 z-10 shadow-lg">
                <select
                  value={feedbackReason}
                  onChange={(e) => setFeedbackReason(e.target.value)}
                  className="bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-[11.5px] text-agent-t1 mb-2 w-full"
                >
                  {FEEDBACK_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      updateScene(scene.id, {
                        feedback: { id: scene.id, sceneId: scene.id, rating: "down", reason: feedbackReason, engine, createdAt: new Date().toISOString() },
                      });
                      addLearningEntry({ engine, reason: FEEDBACK_REASONS.find((r) => r.value === feedbackReason)?.label ?? feedbackReason });
                      setFeedbackFor(null);
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-agent-acc text-white"
                  >
                    Envoyer
                  </button>
                  <button onClick={() => setFeedbackFor(null)} className="text-[11px] px-2 py-1 rounded bg-agent-s3 text-agent-t2">
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MediaCanvas({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const updateScene = useProjectStore((s) => s.updateScene);
  const recalcTotalCost = useProjectStore((s) => s.recalcTotalCost);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const styles = useStyleStore((s) => s.styles);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const mandatoryImageRules = useSettingsStore((s) => s.advancedPrompts.mandatoryImageRules);

  const [view, setView] = useState<"frames" | "videos">("frames");
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);

  const plan = currentProject?.plan;
  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];

  if (!currentProject || !plan) {
    return (
      <div className="flex-1 flex items-center justify-center text-agent-t3 text-[13px]">
        Aucune production active — décris ton brief dans le chat pour commencer.
      </div>
    );
  }

  const framedScenes = plan.scenes.filter((s) => s.needsFrame);
  const validatedFrames = framedScenes.filter((s) => s.frameStatus === "frame_validated").length;
  const validatedVideos = plan.scenes.filter((s) => s.videoStatus === "video_validated").length;
  const allFramesValidated = framedScenes.length > 0 && validatedFrames === framedScenes.length;
  const allVideosValidated = plan.scenes.length > 0 && validatedVideos === plan.scenes.length;
  const isGeneratingAny = plan.scenes.some((s) => s.frameStatus === "frame_generating" || s.videoStatus === "video_generating");
  const selectedScene = plan.scenes.find((s) => s.id === selectedSceneId);

  async function handleGenerateAllFrames() {
    setGeneratingAll(true);
    const engine = currentProject!.imageEngine ?? "auto";
    await mapWithConcurrency(
      framedScenes.filter((s) => !s.frameUrl),
      8,
      async (scene) => {
        updateScene(scene.id, { frameStatus: "frame_generating", frameError: undefined });
        const { urls, hasCharacterReference, hasProductReference, hasLocationReference } = getReferenceImageInfo(
          scene,
          currentProject ?? undefined,
          brand
        );
        const fullPrompt = buildImagePrompt({ imagePrompt: scene.imagePrompt }, style, brand, {
          hasCharacterReference,
          hasProductReference,
          hasLocationReference,
          customRules: mandatoryImageRules,
        });
        try {
          const result = await falGenerateImage(fullPrompt, engine, apiKeys.falApiKey, urls.length > 0 ? urls : undefined);
          updateScene(scene.id, {
            frameUrl: result.url,
            frameStatus: "frame_generated",
            frameHistory: [result.url],
            imageCostEstimate: result.costEstimate,
            frameError: undefined,
          });
        } catch (e) {
          updateScene(scene.id, { frameStatus: "error", frameError: e instanceof Error ? e.message : "Erreur inconnue" });
        }
      }
    );
    recalcTotalCost();
    setGeneratingAll(false);
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-agent-bg relative">
      <div className="h-11 shrink-0 border-b border-agent-bd flex items-center px-4 gap-3">
        <div className="flex bg-agent-s2 border border-agent-bd rounded-md overflow-hidden">
          <button
            onClick={() => setView("frames")}
            className={cn("px-3 py-1.5 text-[12px] font-medium flex items-center gap-1.5", view === "frames" ? "bg-agent-acc text-white" : "text-agent-t2")}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Frames
          </button>
          <button
            onClick={() => setView("videos")}
            className={cn("px-3 py-1.5 text-[12px] font-medium flex items-center gap-1.5", view === "videos" ? "bg-agent-acc text-white" : "text-agent-t2")}
          >
            <Film className="w-3.5 h-3.5" /> Vidéos
          </button>
        </div>
        <div className="text-[11.5px] text-agent-t3">
          {view === "frames" ? `${framedScenes.length} frames · ${currentProject.imageEngine} · 9:16` : `${plan.scenes.length} vidéos · ${currentProject.videoEngine} · 9:16`}
        </div>
        {isGeneratingAny && (
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-agent-acc">
            <RefreshCw className="w-3 h-3 animate-spin" /> Génération en cours...
          </span>
        )}
        {view === "frames" && (
          <button
            onClick={handleGenerateAllFrames}
            disabled={generatingAll}
            className={cn("text-[11.5px] font-medium px-2.5 py-1.5 rounded-md bg-agent-s2 border border-agent-bd2 text-agent-t1", !isGeneratingAny && "ml-auto")}
          >
            {generatingAll ? "Génération..." : "Générer toutes les frames"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === "frames" ? <FrameGrid onSelect={setSelectedSceneId} /> : <VideoList />}
      </div>

      <div className="h-14 shrink-0 border-t border-agent-bd flex items-center px-4 gap-4">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-[10.5px] text-agent-t3 w-14">Frames</span>
          <div className="flex-1 h-1.5 bg-agent-s3 rounded-full overflow-hidden">
            <div className="h-full bg-agent-acc transition-all" style={{ width: `${framedScenes.length ? (validatedFrames / framedScenes.length) * 100 : 0}%` }} />
          </div>
          <span className="text-[10.5px] text-agent-t2 font-mono">{validatedFrames}/{framedScenes.length}</span>
        </div>
        <div className="flex-1 flex items-center gap-2">
          <span className="text-[10.5px] text-agent-t3 w-14">Vidéos</span>
          <div className="flex-1 h-1.5 bg-agent-s3 rounded-full overflow-hidden">
            <div className="h-full bg-agent-grn transition-all" style={{ width: `${plan.scenes.length ? (validatedVideos / plan.scenes.length) * 100 : 0}%` }} />
          </div>
          <span className="text-[10.5px] text-agent-t2 font-mono">{validatedVideos}/{plan.scenes.length}</span>
        </div>
        <button onClick={onOpenLibrary} className="flex items-center gap-1.5 text-[12px] text-agent-t2 hover:text-agent-t1 px-2.5 py-1.5 rounded-md border border-agent-bd">
          <Library className="w-3.5 h-3.5" /> Bibliothèque
        </button>
        {currentProject.status === "videos" && allVideosValidated ? (
          <button
            onClick={() => setStatus("export")}
            className="text-[12.5px] font-medium px-3.5 py-2 rounded-md bg-agent-grn hover:opacity-90 text-white"
          >
            Finaliser
          </button>
        ) : (
          <button
            onClick={() => setStatus("videos")}
            disabled={!allFramesValidated || currentProject.status === "videos"}
            className="text-[12.5px] font-medium px-3.5 py-2 rounded-md bg-agent-acc hover:bg-agent-acc2 disabled:opacity-40 text-white"
          >
            Lancer les vidéos
          </button>
        )}
      </div>

      {selectedScene && <FrameDrawer scene={selectedScene} onClose={() => setSelectedSceneId(null)} />}
    </div>
  );
}
