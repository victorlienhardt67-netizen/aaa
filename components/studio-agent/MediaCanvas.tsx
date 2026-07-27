"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  AlertTriangle,
  Blocks,
  Camera,
  Check,
  ChevronDown,
  Download,
  FileText,
  Film,
  Flame,
  GripVertical,
  Hand,
  ImageIcon,
  Leaf,
  Library,
  FlaskConical,
  MapPin,
  Mic,
  Package,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  RotateCcw,
  Scissors,
  Shapes,
  Smartphone,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Tv,
  UploadCloud,
  User,
  UserRound,
  Users,
  Wand2,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useBrandStore } from "@/store/brandStore";
import { useStyleStore } from "@/store/styleStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useLearningStore } from "@/store/learningStore";
import {
  IMAGE_ENGINE_LABELS as FULL_IMAGE_ENGINE_LABELS,
  ImageEngine,
  Lang,
  Scene,
  StylePreset,
  VIDEO_ENGINE_LABELS as FULL_VIDEO_ENGINE_LABELS,
  VideoEngine,
} from "@/types";
import { analyzeBrief, refineCharacterPrompt } from "@/lib/claude";
import { autoRouteImageEngine, autoRouteVideoEngine, falGenerateImage, type FalTranscriptWord } from "@/lib/fal";
import { transcribeAudio } from "@/lib/transcription";
import { buildCharacterSheetPrompt, buildImagePrompt, buildLearningContext, buildLocationSheetPrompt } from "@/lib/prompts";
import {
  alignScenesToTranscriptWords,
  downloadImage,
  estimateDurationFromWordCount,
  formatCost,
  generateId,
  mapWithConcurrency,
} from "@/lib/utils";
import { fileToBase64, fileToCompressedBase64 } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { getReferenceImageInfo } from "@/lib/frameReferences";
import { generateSceneVideo } from "@/lib/videoGeneration";

const FEEDBACK_REASONS = [
  { value: "mouvement_lent", label: "Mouvement trop lent" },
  { value: "style_non_respecte", label: "Style pas respecté" },
  { value: "personnage_incoherent", label: "Personnage incohérent" },
  { value: "autre", label: "Autre" },
];

const CARD_WIDTH = 260;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;
const DURATION_OPTIONS = [4, 6, 8, 10];
const IMAGE_ENGINE_LABELS: Record<string, string> = {
  auto: "Auto",
  nano_banana: "Nano Banana",
  flux_pro: "Flux Pro",
  ideogram_v3: "Ideogram V3",
};
const VIDEO_ENGINE_LABELS: Record<string, string> = {
  auto: "Auto",
  kling_3_0: "Kling",
  grok_video: "Grok",
  seedance_2_0: "Seedance",
};

function clampZoom(z: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

const STYLE_ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Blocks,
  User,
  UserRound,
  Hand,
  Leaf,
  Zap,
  Camera,
  Smartphone,
  Tv,
  Palette,
  Film,
  Shapes,
  Wand2,
  Star,
  Flame,
  FlaskConical,
  Scissors,
  Rocket,
};
const STYLE_ICON_OPTIONS = Object.keys(STYLE_ICON_MAP);
const ENGINE_SELECT_CLASS = "bg-agent-s3 border border-agent-bd rounded px-1.5 py-1 text-[10.5px] text-agent-t1";

function StyleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = STYLE_ICON_MAP[name] ?? Sparkles;
  return <Icon className={className} />;
}

/** Formulaire compact de création d'un style custom — mêmes champs que /styles, thème violet. */
function StyleCreateForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (data: Omit<StylePreset, "id" | "isCustom" | "createdAt">) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Sparkles");
  const [shortDescription, setShortDescription] = useState("");
  const [photoPrompt, setPhotoPrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [imageEngine, setImageEngine] = useState<ImageEngine>("nano_banana");
  const [videoEngine, setVideoEngine] = useState<VideoEngine>("kling_3_0");
  const [illustrationImageUrl, setIllustrationImageUrl] = useState<string | undefined>();
  const illustrationInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom du style"
        className="w-full bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-[11px] text-agent-t1 placeholder:text-agent-t3"
      />
      <select value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-[11px] text-agent-t1">
        {STYLE_ICON_OPTIONS.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
      {illustrationImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={illustrationImageUrl} alt="" className="w-full aspect-video object-cover rounded border border-agent-bd" />
      ) : (
        <button
          onClick={() => illustrationInputRef.current?.click()}
          className="w-full aspect-video flex flex-col items-center justify-center gap-1 rounded border border-dashed border-agent-bd text-agent-t3 hover:text-agent-t1"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-[10px]">Image d&apos;illustration (paysage)</span>
        </button>
      )}
      {illustrationImageUrl && (
        <button onClick={() => illustrationInputRef.current?.click()} className="w-full text-[10px] text-agent-t2 hover:text-agent-t1">
          Changer l&apos;image
        </button>
      )}
      <input
        ref={illustrationInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) setIllustrationImageUrl(await fileToCompressedBase64(f));
          e.target.value = "";
        }}
      />
      <input
        value={shortDescription}
        onChange={(e) => setShortDescription(e.target.value)}
        placeholder="Description courte"
        className="w-full bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-[11px] text-agent-t1 placeholder:text-agent-t3"
      />
      <textarea
        rows={3}
        value={photoPrompt}
        onChange={(e) => setPhotoPrompt(e.target.value)}
        placeholder="Prompt Photo (apparence/look, injecté automatiquement)"
        className="w-full bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-[10.5px] text-agent-t1 placeholder:text-agent-t3 resize-none"
      />
      <textarea
        rows={2}
        value={videoPrompt}
        onChange={(e) => setVideoPrompt(e.target.value)}
        placeholder="Prompt Vidéo (animation/mouvement spécifique)"
        className="w-full bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-[10.5px] text-agent-t1 placeholder:text-agent-t3 resize-none"
      />
      <textarea
        rows={2}
        value={negativePrompt}
        onChange={(e) => setNegativePrompt(e.target.value)}
        placeholder="Prompt négatif système"
        className="w-full bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-[10.5px] text-agent-t1 placeholder:text-agent-t3 resize-none"
      />
      <div className="grid grid-cols-2 gap-1.5">
        <select value={imageEngine} onChange={(e) => setImageEngine(e.target.value as ImageEngine)} className={ENGINE_SELECT_CLASS}>
          {Object.entries(FULL_IMAGE_ENGINE_LABELS)
            .filter(([v]) => v !== "auto")
            .map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
        </select>
        <select value={videoEngine} onChange={(e) => setVideoEngine(e.target.value as VideoEngine)} className={ENGINE_SELECT_CLASS}>
          {Object.entries(FULL_VIDEO_ENGINE_LABELS)
            .filter(([v]) => v !== "auto")
            .map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
        </select>
      </div>
      <div className="flex gap-1.5 pt-1">
        <button onClick={onCancel} className="flex-1 text-[10.5px] px-2 py-1.5 rounded bg-agent-s3 border border-agent-bd2 text-agent-t2">
          Annuler
        </button>
        <button
          onClick={() =>
            name.trim() &&
            onCreate({
              name: name.trim(),
              icon,
              shortDescription,
              photoPrompt,
              videoPrompt,
              negativePrompt,
              recommendedImageEngine: imageEngine,
              recommendedVideoEngine: videoEngine,
              bestFor: ["fr", "en"],
              illustrationImageUrl,
            })
          }
          disabled={!name.trim()}
          className="flex-1 text-[10.5px] px-2 py-1.5 rounded bg-agent-acc hover:bg-agent-acc2 text-white disabled:opacity-40"
        >
          Créer
        </button>
      </div>
    </div>
  );
}

/** Édition des prompts d'un style existant (custom ou de base) — même logique que /styles, thème violet. */
function StyleEditForm({
  style,
  onCancel,
  onSave,
  onDelete,
}: {
  style: StylePreset;
  onCancel: () => void;
  onSave: (patch: Partial<StylePreset>) => void;
  onDelete?: () => void;
}) {
  const [photoPrompt, setPhotoPrompt] = useState(style.photoPrompt);
  const [videoPrompt, setVideoPrompt] = useState(style.videoPrompt);
  const [negativePrompt, setNegativePrompt] = useState(style.negativePrompt);
  const [imageEngine, setImageEngine] = useState(style.recommendedImageEngine);
  const [videoEngine, setVideoEngine] = useState(style.recommendedVideoEngine);
  const [illustrationImageUrl, setIllustrationImageUrl] = useState(style.illustrationImageUrl);
  const illustrationInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-agent-t1">
        <StyleIcon name={style.icon} className="w-3.5 h-3.5 text-agent-acc" /> {style.name}
      </div>
      <p className="text-[10px] text-agent-t3">{style.shortDescription}</p>
      {illustrationImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={illustrationImageUrl} alt="" className="w-full aspect-video object-cover rounded border border-agent-bd" />
      ) : (
        <button
          onClick={() => illustrationInputRef.current?.click()}
          className="w-full aspect-video flex flex-col items-center justify-center gap-1 rounded border border-dashed border-agent-bd text-agent-t3 hover:text-agent-t1"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-[10px]">Image d&apos;illustration (paysage)</span>
        </button>
      )}
      {illustrationImageUrl && (
        <button onClick={() => illustrationInputRef.current?.click()} className="w-full text-[10px] text-agent-t2 hover:text-agent-t1">
          Changer l&apos;image
        </button>
      )}
      <input
        ref={illustrationInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) setIllustrationImageUrl(await fileToCompressedBase64(f));
          e.target.value = "";
        }}
      />
      <textarea
        rows={3}
        value={photoPrompt}
        onChange={(e) => setPhotoPrompt(e.target.value)}
        placeholder="Prompt Photo (apparence/look)"
        className="w-full bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-[10.5px] text-agent-t1 resize-none"
      />
      <textarea
        rows={2}
        value={videoPrompt}
        onChange={(e) => setVideoPrompt(e.target.value)}
        placeholder="Prompt Vidéo (animation/mouvement)"
        className="w-full bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-[10.5px] text-agent-t1 resize-none"
      />
      <textarea
        rows={2}
        value={negativePrompt}
        onChange={(e) => setNegativePrompt(e.target.value)}
        className="w-full bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-[10.5px] text-agent-t1 resize-none"
      />
      <div className="grid grid-cols-2 gap-1.5">
        <select value={imageEngine} onChange={(e) => setImageEngine(e.target.value as ImageEngine)} className={ENGINE_SELECT_CLASS}>
          {Object.entries(FULL_IMAGE_ENGINE_LABELS)
            .filter(([v]) => v !== "auto")
            .map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
        </select>
        <select value={videoEngine} onChange={(e) => setVideoEngine(e.target.value as VideoEngine)} className={ENGINE_SELECT_CLASS}>
          {Object.entries(FULL_VIDEO_ENGINE_LABELS)
            .filter(([v]) => v !== "auto")
            .map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
        </select>
      </div>
      <div className="flex items-center gap-1.5 pt-1">
        {onDelete && (
          <button onClick={onDelete} className="text-[10.5px] px-2 py-1.5 rounded bg-red-950/40 border border-red-900/50 text-red-400">
            Supprimer
          </button>
        )}
        <button onClick={onCancel} className="flex-1 text-[10.5px] px-2 py-1.5 rounded bg-agent-s3 border border-agent-bd2 text-agent-t2">
          Retour
        </button>
        <button
          onClick={() =>
            onSave({
              photoPrompt,
              videoPrompt,
              negativePrompt,
              recommendedImageEngine: imageEngine,
              recommendedVideoEngine: videoEngine,
              illustrationImageUrl,
            })
          }
          className="flex-1 text-[10.5px] px-2 py-1.5 rounded bg-agent-acc hover:bg-agent-acc2 text-white"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

/** Menu de sélection de style : liste + création + édition des prompts, remplace le simple <select>. */
function StylePickerBlock({ styleId, onSelect }: { styleId: string; onSelect: (id: string) => void }) {
  const styles = useStyleStore((s) => s.styles);
  const addCustomStyle = useStyleStore((s) => s.addCustomStyle);
  const updateStyle = useStyleStore((s) => s.updateStyle);
  const deleteStyle = useStyleStore((s) => s.deleteStyle);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"list" | "create" | string>("list");
  const popRef = useRef<HTMLDivElement>(null);

  const selected = styles.find((s) => s.id === styleId);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
        setMode("list");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const editingStyle = mode !== "list" && mode !== "create" ? styles.find((s) => s.id === mode) : undefined;

  return (
    <div className="relative" ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 bg-agent-s3 border border-agent-bd rounded px-2 py-1.5 text-[11px] text-agent-t1"
      >
        <StyleIcon name={selected?.icon ?? "Sparkles"} className="w-3.5 h-3.5 text-agent-acc shrink-0" />
        <span className="flex-1 min-w-0 text-left truncate">{selected?.name ?? "Choisir un style..."}</span>
        <ChevronDown className="w-3 h-3 text-agent-t3 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-[300px] bg-agent-s1 border border-agent-bd rounded-lg shadow-2xl p-2 max-h-[420px] overflow-y-auto">
          {mode === "list" && (
            <>
              <div className="space-y-1 mb-2">
                {styles.map((st) => (
                  <div
                    key={st.id}
                    className={cn(
                      "flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-agent-s3",
                      st.id === styleId && "bg-agent-accs border border-agent-acc/40"
                    )}
                    onClick={() => {
                      onSelect(st.id);
                      setOpen(false);
                    }}
                  >
                    {st.illustrationImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={st.illustrationImageUrl} alt="" className="w-9 h-6 object-cover rounded shrink-0" />
                    ) : (
                      <StyleIcon name={st.icon} className="w-4 h-4 text-agent-acc shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11.5px] text-agent-t1 truncate">{st.name}</div>
                      <div className="text-[10px] text-agent-t3 truncate">{st.shortDescription}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMode(st.id);
                      }}
                      className="p-1 text-agent-t3 hover:text-agent-t1 shrink-0"
                      title="Modifier les prompts"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setMode("create")}
                className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-medium px-2 py-1.5 rounded bg-agent-acc hover:bg-agent-acc2 text-white"
              >
                <Plus className="w-3.5 h-3.5" /> Nouveau style
              </button>
            </>
          )}

          {mode === "create" && (
            <StyleCreateForm
              onCancel={() => setMode("list")}
              onCreate={(data) => {
                const created = addCustomStyle(data);
                onSelect(created.id);
                setMode("list");
                setOpen(false);
              }}
            />
          )}

          {editingStyle && (
            <StyleEditForm
              style={editingStyle}
              onCancel={() => setMode("list")}
              onSave={(patch) => {
                updateStyle(editingStyle.id, patch);
                setMode("list");
              }}
              onDelete={
                editingStyle.isCustom
                  ? () => {
                      deleteStyle(editingStyle.id);
                      if (styleId === editingStyle.id) onSelect("");
                      setMode("list");
                    }
                  : undefined
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

function statusBorder(status: Scene["frameStatus"] | Scene["videoStatus"], selected: boolean): string {
  if (selected) return "border-agent-acc shadow-[0_0_0_1px_rgba(226,103,46,0.4)]";
  if (status === "frame_validated" || status === "video_validated") return "border-agent-grn/50";
  if (status === "frame_generating" || status === "video_generating") return "border-agent-acc/60 animate-pulse";
  if (status === "error") return "border-red-500/50";
  if (status === "frame_generated" || status === "video_generated") return "border-agent-bd2";
  return "border-agent-bd";
}

/** Ligne reliant l'emplacement d'origine d'une carte à sa position glissée. */
function ConnectorLine({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <div
      className="absolute top-0 left-0 h-px bg-agent-acc/60 pointer-events-none z-20"
      style={{ width: length, transform: `translate(${from.x}px, ${from.y}px) rotate(${angle}deg)`, transformOrigin: "0 0" }}
    />
  );
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
    const { urls, characterReferenceCount, hasProductReference, hasLocationReference } = await getReferenceImageInfo(
      scene,
      currentProject ?? undefined,
      brand
    );
    const fullPrompt = buildImagePrompt({ imagePrompt: prompt }, style, brand, {
      characterReferenceCount,
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
    <div className="absolute inset-0 z-40 flex">
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
                J&apos;ai déjà une frame
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

/** Bloc "Script + cadrage" — première colonne du canvas, remplace l'ancien chat de brief. */
type DragHandleProps = {
  offset: { x: number; y: number };
  active: boolean;
  onDragStart: (e: ReactPointerEvent) => void;
  measureRef: (el: HTMLDivElement | null) => void;
};

function ScriptBlock({ offset, active, onDragStart, measureRef }: DragHandleProps) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const brands = useBrandStore((s) => s.brands);
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const touchLastUsed = useBrandStore((s) => s.touchLastUsed);
  const styles = useStyleStore((s) => s.styles);
  const settings = useSettingsStore((s) => s.generationDefaults);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const advancedPrompts = useSettingsStore((s) => s.advancedPrompts);
  const learningEntries = useLearningStore((s) => s.entries);
  const initProject = useProjectStore((s) => s.initProject);
  const updateCurrentProject = useProjectStore((s) => s.updateCurrentProject);
  const updateScene = useProjectStore((s) => s.updateScene);
  const setStatus = useProjectStore((s) => s.setStatus);

  const [brandId, setBrandId] = useState(currentProject?.brandId ?? activeBrandId ?? brands[0]?.id ?? "");
  const [lang, setLang] = useState<Lang>(currentProject?.lang ?? settings.defaultLang);
  const [styleId, setStyleId] = useState(currentProject?.styleId ?? "");
  const [brief, setBrief] = useState(currentProject?.brief ?? "");
  const [analyzing, setAnalyzing] = useState(false);

  // Même course de réhydratation que pour brandId ci-dessous : au tout premier
  // rendu (juste après un rechargement de page), le store zustand persist n'a
  // pas encore fini de relire localStorage — brief/lang/styleId se figaient
  // alors sur des valeurs vides au lieu du projet réellement en cours, faisant
  // croire à une perte de projet alors que la donnée réelle était intacte
  // (juste jamais réaffichée). Ces refs empêchent la resynchronisation dès que
  // l'utilisateur modifie lui-même le champ concerné.
  const briefTouchedRef = useRef(false);
  const langTouchedRef = useRef(false);
  const styleTouchedRef = useRef(false);

  useEffect(() => {
    if (briefTouchedRef.current) return;
    if (currentProject?.brief !== undefined && currentProject.brief !== brief) setBrief(currentProject.brief);
  }, [brief, currentProject?.brief]);

  useEffect(() => {
    if (langTouchedRef.current) return;
    const resolved = currentProject?.lang ?? settings.defaultLang;
    if (resolved && resolved !== lang) setLang(resolved);
  }, [lang, currentProject?.lang, settings.defaultLang]);

  useEffect(() => {
    if (styleTouchedRef.current) return;
    if (currentProject?.styleId && currentProject.styleId !== styleId) setStyleId(currentProject.styleId);
  }, [styleId, currentProject?.styleId]);

  // Préselection depuis la Bibliothèque de styles (clic sur une carte de
  // /styles → /studio?styleId=...) : ne s'applique qu'au démarrage d'une
  // nouvelle production (aucun projet en cours), pour ne jamais écraser un
  // travail déjà entamé. `window.location.search` plutôt que useSearchParams
  // évite d'exiger un Suspense boundary sur cette page par ailleurs statique.
  useEffect(() => {
    if (currentProject || styleTouchedRef.current) return;
    const preselect = new URLSearchParams(window.location.search).get("styleId");
    if (preselect) {
      setStyleId(preselect);
      styleTouchedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Voix off optionnelle fournie dès le brief (avant même l'analyse) : sa
  // durée réelle sert à caler le nombre de frames et le rythme de la vidéo,
  // au lieu de la durée cible fixe de 60s utilisée par défaut.
  const [voAudioUrl, setVoAudioUrl] = useState<string | undefined>(currentProject?.voiceOverAudioUrl);
  const [voAudioDuration, setVoAudioDuration] = useState<number | undefined>(currentProject?.voiceOverAudioDurationSeconds);
  const [voAudioUploading, setVoAudioUploading] = useState(false);
  const [voAudioError, setVoAudioError] = useState("");
  const voAudioTouchedRef = useRef(false);

  useEffect(() => {
    if (voAudioTouchedRef.current) return;
    if (currentProject?.voiceOverAudioUrl && currentProject.voiceOverAudioUrl !== voAudioUrl) {
      setVoAudioUrl(currentProject.voiceOverAudioUrl);
      setVoAudioDuration(currentProject.voiceOverAudioDurationSeconds);
    }
  }, [voAudioUrl, currentProject?.voiceOverAudioUrl, currentProject?.voiceOverAudioDurationSeconds]);
  // Transcription Whisper (mot par mot) — permet de caler chaque scène sur sa
  // durée réelle exacte plutôt qu'une estimation par nombre de mots. Optionnelle :
  // si elle échoue (backend voiceover-sync non configuré/indisponible...), on
  // retombe sur l'estimation par mots sans bloquer l'upload de l'audio lui-même.
  const [voTranscriptWords, setVoTranscriptWords] = useState<FalTranscriptWord[] | undefined>(undefined);
  const [voTranscribing, setVoTranscribing] = useState(false);
  const [voTranscriptError, setVoTranscriptError] = useState("");
  const voAudioInputRef = useRef<HTMLInputElement>(null);

  // Type de narration : par défaut Claude détecte scène par scène (gère déjà
  // nativement les runs mixtes) — cette valeur ne force une contrainte que si
  // l'utilisateur choisit explicitement autre chose que "auto".
  const [narrationType, setNarrationType] = useState<"auto" | "voiceover" | "lipsync" | "hybrid">("auto");

  async function handleVoAudioUpload(file: File) {
    voAudioTouchedRef.current = true;
    setVoAudioUploading(true);
    setVoAudioError("");
    setVoTranscriptWords(undefined);
    setVoTranscriptError("");
    try {
      const base64 = await fileToBase64(file);
      const duration = await new Promise<number>((resolve, reject) => {
        const audio = new Audio();
        audio.addEventListener("loadedmetadata", () => resolve(audio.duration));
        audio.addEventListener("error", () => reject(new Error("Fichier audio illisible")));
        audio.src = base64;
      });
      setVoAudioUrl(base64);
      setVoAudioDuration(duration);
      if (currentProject) updateCurrentProject({ voiceOverAudioUrl: base64, voiceOverAudioDurationSeconds: duration });

      setVoTranscribing(true);
      try {
        const transcription = await transcribeAudio(file, lang);
        setVoTranscriptWords(transcription.words);
      } catch (transcriptionError) {
        setVoTranscriptError(
          transcriptionError instanceof Error
            ? transcriptionError.message
            : "Transcription Whisper indisponible"
        );
      } finally {
        setVoTranscribing(false);
      }
    } catch (e) {
      setVoAudioError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setVoAudioUploading(false);
    }
  }

  // Au premier rendu, le store zustand (persist) n'a pas encore fini de
  // réhydrater depuis localStorage : brandId ci-dessus se fige alors sur le
  // premier brand du seed par défaut (ex: Lynae) au lieu de la marque
  // réellement active de l'utilisateur, qui n'arrive qu'un instant après.
  // Tant que l'utilisateur n'a pas lui-même touché le sélecteur, on continue
  // à resynchroniser brandId avec la valeur persistée une fois disponible —
  // sinon la marque (et donc sa photo produit) utilisée pour l'analyse et la
  // génération peut silencieusement être la mauvaise.
  const brandTouchedRef = useRef(false);
  useEffect(() => {
    if (brandTouchedRef.current) return;
    const resolved = currentProject?.brandId ?? activeBrandId ?? brands[0]?.id ?? "";
    if (resolved && resolved !== brandId) setBrandId(resolved);
  }, [brandId, currentProject?.brandId, activeBrandId, brands]);

  const selectedStyle = styles.find((s) => s.id === styleId);
  const plan = currentProject?.plan;

  async function handleAnalyze() {
    if (!brief.trim() || !selectedStyle) return;
    setAnalyzing(true);
    const brand = brands.find((b) => b.id === brandId);
    const resolvedImageEngine = currentProject?.imageEngine ?? (selectedStyle.recommendedImageEngine || autoRouteImageEngine());
    const resolvedVideoEngine = currentProject?.videoEngine ?? (selectedStyle.recommendedVideoEngine || autoRouteVideoEngine(lang));
    // Si une voix off réelle a été fournie au brief, la durée cible de la vidéo
    // (et donc le nombre de frames estimé) se cale dessus plutôt que sur 60s par défaut.
    const resolvedTargetDuration = voAudioDuration ? Math.max(1, Math.round(voAudioDuration)) : 60;

    if (!currentProject) {
      initProject({
        name: `${brand?.name ?? "Projet"} — ${new Date().toLocaleDateString("fr-FR")}`,
        brandId,
        styleId: selectedStyle.id,
        lang,
        targetDuration: resolvedTargetDuration,
        imageEngine: resolvedImageEngine as ImageEngine,
        videoEngine: resolvedVideoEngine as VideoEngine,
      });
    } else {
      updateCurrentProject({ brandId, styleId: selectedStyle.id, lang, targetDuration: resolvedTargetDuration });
    }
    updateCurrentProject({
      brief,
      ...(voAudioUrl ? { voiceOverAudioUrl: voAudioUrl, voiceOverAudioDurationSeconds: voAudioDuration } : {}),
    });
    if (brandId) touchLastUsed(brandId);

    setStatus("analyzing");
    try {
      const producedPlan = await analyzeBrief({
        brief,
        brand,
        style: selectedStyle,
        lang,
        targetDuration: resolvedTargetDuration,
        motionIntensity: settings.motionIntensity,
        learningContext: buildLearningContext(learningEntries),
        apiKey: apiKeys.claudeApiKey,
        systemPromptOverride: advancedPrompts.analyzeBriefSystemPrompt,
        minSceneDurationSeconds: advancedPrompts.minSceneDurationSeconds,
        maxSceneDurationSeconds: advancedPrompts.maxSceneDurationSeconds,
        narrationTypeOverride: narrationType === "auto" ? undefined : narrationType,
      });
      updateCurrentProject({
        plan: producedPlan,
        imageEngine: resolvedImageEngine as ImageEngine,
        videoEngine: resolvedVideoEngine as VideoEngine,
        status: "characters",
      });
      // Calage automatique des durées de scène sur la voix off fournie au
      // brief — même calcul que le bouton "Appliquer ces durées" du bloc Voix
      // off, mais appliqué d'emblée pour ne pas obliger à ré-uploader le
      // fichier une seconde fois une fois le plan généré. Priorité à
      // l'alignement Whisper mot par mot (timestamps réels) quand disponible,
      // sinon repli sur l'estimation proportionnelle au nombre de mots.
      if (voTranscriptWords && voTranscriptWords.length > 0) {
        const aligned = alignScenesToTranscriptWords(producedPlan.scenes, voTranscriptWords);
        aligned.forEach(({ sceneId, startSeconds, endSeconds }) => {
          const durationSeconds = Math.max(1, Math.round((endSeconds - startSeconds) * 10) / 10);
          updateScene(sceneId, {
            durationSeconds,
            durationJustification:
              "Calé sur la transcription Whisper exacte du fichier audio (timestamps réels, alignement séquentiel mot à mot).",
          });
        });
      } else if (voAudioDuration) {
        const linesWithVo = producedPlan.scenes.filter((s) => s.voiceOver?.text?.trim());
        if (linesWithVo.length > 0) {
          const wordCounts = linesWithVo.map((s) => Math.max(1, s.voiceOver!.text.trim().split(/\s+/).filter(Boolean).length));
          const totalWords = wordCounts.reduce((a, b) => a + b, 0);
          linesWithVo.forEach((s, i) => {
            const share = wordCounts[i] / totalWords;
            const durationSeconds = Math.max(1, Math.round(share * voAudioDuration * 10) / 10);
            updateScene(s.id, {
              durationSeconds,
              durationJustification:
                "Calé automatiquement sur la durée réelle du fichier audio voix off fourni au brief (estimation proportionnelle au nombre de mots).",
            });
          });
        }
      }
      setStatus("characters");
    } finally {
      setAnalyzing(false);
    }
  }

  const totalVoDuration = (plan?.scenes ?? []).reduce(
    (sum, s) => sum + (s.voiceOver?.text ? estimateDurationFromWordCount(s.voiceOver.text) : 0),
    0
  );

  return (
    <div
      ref={measureRef}
      data-card
      className={cn("relative bg-agent-s1 border border-agent-bd rounded-lg p-3 mb-4", active && "z-30 shadow-xl")}
      style={{ width: CARD_WIDTH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <div className="flex items-center gap-1.5 mb-2 text-[12.5px] font-medium text-agent-t1">
        <button onPointerDown={onDragStart} title="Déplacer" className="cursor-grab active:cursor-grabbing text-agent-t3 hover:text-agent-t1 -ml-0.5">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <FileText className="w-3.5 h-3.5 text-agent-acc" /> Script + cadrage
      </div>
      <div className="mb-2">
        <StylePickerBlock
          styleId={styleId}
          onSelect={(id) => {
            styleTouchedRef.current = true;
            setStyleId(id);
          }}
        />
      </div>
      <textarea
        rows={6}
        value={brief}
        onChange={(e) => {
          briefTouchedRef.current = true;
          setBrief(e.target.value);
        }}
        placeholder="Colle ton script complet..."
        className="w-full bg-agent-s3 border border-agent-bd rounded-md p-2 text-[11.5px] text-agent-t1 placeholder:text-agent-t3 focus:outline-none focus:border-agent-acc resize-none mb-2"
      />
      <div className="flex items-center gap-1.5 mb-2">
        <select
          value={brandId}
          onChange={(e) => {
            brandTouchedRef.current = true;
            setBrandId(e.target.value);
          }}
          className="flex-1 min-w-0 bg-agent-s3 border border-agent-bd rounded px-1.5 py-1 text-[11px] text-agent-t1"
        >
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <div className="flex bg-agent-s3 border border-agent-bd rounded overflow-hidden shrink-0">
          {(["fr", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                langTouchedRef.current = true;
                setLang(l);
              }}
              className={cn("px-2 py-1 text-[10.5px] uppercase", lang === l ? "bg-agent-acc text-white" : "text-agent-t2")}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2">
        <p className="text-[10px] text-agent-t3 mb-1">As-tu un fichier MP3 de la voix off ? (optionnel)</p>
        {!voAudioUrl ? (
          <>
            <button
              onClick={() => voAudioInputRef.current?.click()}
              disabled={voAudioUploading}
              className="w-full inline-flex items-center justify-center gap-1.5 text-[10.5px] font-medium px-2 py-1.5 rounded bg-agent-s3 border border-dashed border-agent-bd2 text-agent-t2 hover:text-agent-t1 disabled:opacity-40"
            >
              <UploadCloud className="w-3.5 h-3.5" /> {voAudioUploading ? "Lecture du fichier..." : "Uploader la voix off (MP3)"}
            </button>
            {voAudioError && <div className="text-[10px] text-red-400 mt-1">{voAudioError}</div>}
            <input
              ref={voAudioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleVoAudioUpload(f);
                e.target.value = "";
              }}
            />
          </>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10.5px] text-agent-grn bg-agent-s3 border border-agent-bd rounded px-2 py-1.5">
              <Check className="w-3 h-3 shrink-0" />
              <span className="flex-1 min-w-0">
                Audio fourni : {voAudioDuration?.toFixed(1)}s — nombre de frames et rythme calés dessus.
              </span>
              <button
                onClick={() => {
                  voAudioTouchedRef.current = true;
                  setVoAudioUrl(undefined);
                  setVoAudioDuration(undefined);
                  setVoTranscriptWords(undefined);
                  setVoTranscriptError("");
                  if (currentProject) updateCurrentProject({ voiceOverAudioUrl: undefined, voiceOverAudioDurationSeconds: undefined });
                }}
                className="text-agent-t3 hover:text-agent-t1 shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {voTranscribing && (
              <p className="text-[9.5px] text-agent-t3">Transcription Whisper en cours (calage exact mot par mot)...</p>
            )}
            {!voTranscribing && voTranscriptWords && voTranscriptWords.length > 0 && (
              <p className="text-[9.5px] text-agent-grn">
                Transcription Whisper obtenue ({voTranscriptWords.length} mots) — les durées de scène seront calées sur les timestamps exacts.
              </p>
            )}
            {!voTranscribing && voTranscriptError && (
              <p className="text-[9.5px] text-agent-amb">
                Transcription Whisper indisponible ({voTranscriptError}) — repli sur l&apos;estimation par nombre de mots.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mb-2">
        <label className="text-[10px] text-agent-t3 mb-1 block">Voix des personnages (optionnel — laissé à Claude par défaut)</label>
        <select
          value={narrationType}
          onChange={(e) => setNarrationType(e.target.value as typeof narrationType)}
          className="w-full bg-agent-s3 border border-agent-bd rounded px-1.5 py-1 text-[11px] text-agent-t1"
        >
          <option value="auto">Auto (Claude détecte scène par scène)</option>
          <option value="voiceover">Voix off partout (jamais de synchro labiale)</option>
          <option value="lipsync">Personnages parlent partout (synchro labiale)</option>
          <option value="hybrid">Mixte — détecter explicitement scène par scène</option>
        </select>
      </div>

      {totalVoDuration > 0 && (
        <div className="text-[10.5px] text-agent-grn flex items-center gap-1 mb-2">
          <Check className="w-3 h-3" /> VO du script : {totalVoDuration.toFixed(1)}s
        </div>
      )}
      <button
        onClick={handleAnalyze}
        disabled={!brief.trim() || !selectedStyle || analyzing}
        className="w-full inline-flex items-center justify-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md bg-agent-acc hover:bg-agent-acc2 text-white disabled:opacity-40"
      >
        <Wand2 className="w-3.5 h-3.5" /> {analyzing ? "Analyse..." : plan ? "Réanalyser" : "Analyser"}
      </button>

      {plan?.briefAnalysis && (
        <div className="mt-2.5 pt-2.5 border-t border-agent-bd space-y-2">
          <p className="text-[10.5px] text-agent-t2">{plan.briefAnalysis}</p>
          {plan.hook && (
            <div className="bg-agent-s3 border border-agent-bd rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-wide text-agent-t3">Hook</span>
                <span
                  className={cn(
                    "text-[9.5px] px-1.5 py-0.5 rounded",
                    plan.hook.evaluation === "fort" && "bg-agent-grn/15 text-agent-grn",
                    plan.hook.evaluation === "moyen" && "bg-agent-amb/15 text-agent-amb",
                    plan.hook.evaluation === "faible" && "bg-red-500/15 text-red-400"
                  )}
                >
                  {plan.hook.evaluation}
                </span>
              </div>
              <p className="italic text-agent-t1 text-[10.5px]">« {plan.hook.texte} »</p>
            </div>
          )}
          {plan.pointsVigilance && plan.pointsVigilance.length > 0 && (
            <div className="bg-agent-amb/10 border border-agent-amb/30 rounded p-2">
              <div className="flex items-center gap-1 text-agent-amb text-[9px] uppercase tracking-wide mb-1">
                <AlertTriangle className="w-3 h-3" /> À surveiller
              </div>
              <ul className="list-disc pl-3.5 space-y-0.5 text-[10.5px] text-agent-t2">
                {plan.pointsVigilance.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Bloc "Voix off" — liste des répliques détectées, une par frame. */
/** Calage voix off — estimation (mots) par défaut, ou calée sur la durée réelle d'un fichier audio uploadé. */
function VoiceOverBlock({ offset, active, onDragStart, measureRef }: DragHandleProps) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateCurrentProject = useProjectStore((s) => s.updateCurrentProject);
  const updateScene = useProjectStore((s) => s.updateScene);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  const plan = currentProject?.plan;
  const lines = (plan?.scenes ?? []).filter((s) => s.voiceOver?.text?.trim());
  if (!plan || lines.length === 0) return null;

  const wordCounts = lines.map((s) => Math.max(1, s.voiceOver!.text.trim().split(/\s+/).filter(Boolean).length));
  const totalWords = wordCounts.reduce((a, b) => a + b, 0);
  const audioDuration = currentProject?.voiceOverAudioDurationSeconds;
  const estimatedDuration = lines.reduce((sum, s) => sum + estimateDurationFromWordCount(s.voiceOver!.text), 0);

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    setApplied(false);
    try {
      const base64 = await fileToBase64(file);
      const duration = await new Promise<number>((resolve, reject) => {
        const audio = new Audio();
        audio.addEventListener("loadedmetadata", () => resolve(audio.duration));
        audio.addEventListener("error", () => reject(new Error("Fichier audio illisible")));
        audio.src = base64;
      });
      updateCurrentProject({ voiceOverAudioUrl: base64, voiceOverAudioDurationSeconds: duration });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setUploading(false);
    }
  }

  function applyAudioDurations() {
    if (!audioDuration) return;
    lines.forEach((s, i) => {
      const share = wordCounts[i] / totalWords;
      const durationSeconds = Math.max(1, Math.round(share * audioDuration * 10) / 10);
      updateScene(s.id, {
        durationSeconds,
        durationJustification: "Calé sur la durée réelle du fichier audio voix off (estimation proportionnelle au nombre de mots — pas un timestamp exact).",
      });
    });
    setApplied(true);
  }

  return (
    <div
      ref={measureRef}
      data-card
      className={cn("relative bg-agent-s1 border border-agent-bd rounded-lg p-3 mb-4", active && "z-30 shadow-xl")}
      style={{ width: CARD_WIDTH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <div className="flex items-center gap-1.5 mb-2 text-[12.5px] font-medium text-agent-t1">
        <button onPointerDown={onDragStart} title="Déplacer" className="cursor-grab active:cursor-grabbing text-agent-t3 hover:text-agent-t1 -ml-0.5">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <Mic className="w-3.5 h-3.5 text-agent-acc" /> Voix off
      </div>
      <ol className="space-y-1.5 mb-2">
        {lines.map((s, i) => (
          <li key={s.id} className="text-[10.5px] text-agent-t2 flex gap-1.5">
            <span className="text-agent-t3 font-mono shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className="line-clamp-2">{s.voiceOver!.text}</span>
          </li>
        ))}
      </ol>

      {!currentProject?.voiceOverAudioUrl ? (
        <>
          <div className="text-[10.5px] text-agent-t2 flex items-center gap-1 mb-2">
            <Check className="w-3 h-3 text-agent-grn" /> Estimation mots : {estimatedDuration.toFixed(1)}s
          </div>
          <p className="text-[9.5px] text-agent-t3 mb-1.5">Tu as le fichier audio final (ex: export ElevenLabs) ? Cale les durées de scène dessus plutôt que sur l&apos;estimation.</p>
          <button
            onClick={() => uploadRef.current?.click()}
            disabled={uploading}
            className="w-full inline-flex items-center justify-center gap-1.5 text-[10.5px] font-medium px-2 py-1.5 rounded bg-agent-s2 border border-dashed border-agent-bd2 text-agent-t2 hover:text-agent-t1 disabled:opacity-40"
          >
            <UploadCloud className="w-3.5 h-3.5" /> {uploading ? "Lecture du fichier..." : "Uploader la voix off (MP3)"}
          </button>
          {error && <div className="text-[10px] text-red-400 mt-1">{error}</div>}
          <input
            ref={uploadRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
        </>
      ) : (
        <div className="space-y-1.5">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio src={currentProject.voiceOverAudioUrl} controls className="w-full h-8" />
          <div className="text-[10.5px] text-agent-t2">
            Durée réelle : <span className="text-agent-t1 font-medium">{audioDuration?.toFixed(1)}s</span> — estimation mots : {estimatedDuration.toFixed(1)}s
          </div>
          <p className="text-[9.5px] text-agent-t3">
            Durées par scène recalculées au prorata du nombre de mots de chaque fragment — c&apos;est une estimation, pas un timestamp exact. Ajuste ensuite manuellement si besoin.
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={applyAudioDurations}
              className="flex-1 inline-flex items-center justify-center gap-1 text-[10.5px] font-medium px-2 py-1.5 rounded bg-agent-acc hover:bg-agent-acc2 text-white"
            >
              <Check className="w-3 h-3" /> {applied ? "Ré-appliquer les durées" : "Appliquer ces durées"}
            </button>
            <button
              onClick={() => {
                updateCurrentProject({ voiceOverAudioUrl: undefined, voiceOverAudioDurationSeconds: undefined });
                setApplied(false);
              }}
              className="text-[10.5px] px-2 py-1.5 rounded bg-agent-s2 border border-agent-bd2 text-agent-t2 hover:text-agent-t1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {applied && (
            <div className="text-[10.5px] text-agent-grn flex items-center gap-1">
              <Check className="w-3 h-3" /> Durées de scène mises à jour
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Bloc "Casting" — fiches de référence des personnages (ou objets anthropomorphisés) récurrents. */
function CastingBlock({ offset, active, onDragStart, measureRef }: DragHandleProps) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const initCharacterReferences = useProjectStore((s) => s.initCharacterReferences);
  const updateCharacterReference = useProjectStore((s) => s.updateCharacterReference);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const styles = useStyleStore((s) => s.styles);
  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modDrafts, setModDrafts] = useState<Record<string, string>>({});
  const [refining, setRefining] = useState<Record<string, boolean>>({});

  const plan = currentProject?.plan;
  const distinctAssetIds = Array.from(new Set((plan?.scenes ?? []).flatMap((s) => s.characters)));
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!currentProject || distinctAssetIds.length === 0) return;
    const missing = distinctAssetIds.filter((assetId) => !currentProject.characterReferences?.[assetId]);
    if (missing.length === 0) return;
    const refs = missing.map((assetId) => {
      const photo = brand?.characterPhotos.find((p) => p.id === assetId);
      const name = photo?.name || plan?.characterNames?.[assetId] || "Personnage";
      const physicalState = plan?.characterProfiles?.[assetId]?.physicalState;
      return { assetId, name, prompt: buildCharacterSheetPrompt(name, style, physicalState), status: "pending" as const };
    });
    initCharacterReferences(refs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, distinctAssetIds.join(",")]);

  // Toutes les fiches existantes (détectées par Claude + ajoutées manuellement) —
  // pas seulement celles référencées par une scène, pour que "Claude n'a pas
  // détecté ce personnage" reste réparable ici sans dépendre du découpage.
  const references = Object.entries(currentProject?.characterReferences ?? {}).map(([key, ref]) => ({ key, ref }));
  const allValidated = references.length > 0 && references.every((r) => r.ref.status === "validated");

  useEffect(() => {
    if (!allValidated) return;
    const hasLocations = (plan?.scenes ?? []).some((s) => !!s.locationId);
    setStatus(hasLocations ? "locations" : "frames");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allValidated]);

  if (!currentProject || !plan) return null;

  function handleManualAdd() {
    const name = newName.trim();
    if (!name) return;
    initCharacterReferences([
      { assetId: generateId("char"), name, prompt: buildCharacterSheetPrompt(name, style), status: "pending" },
    ]);
    setNewName("");
    setAddOpen(false);
  }

  async function generate(key: string, prompt: string) {
    updateCharacterReference(key, { status: "generating" });
    setErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      const originalPhoto = brand?.characterPhotos.find((p) => p.id === key);
      const result = await falGenerateImage(prompt, "nano_banana", apiKeys.falApiKey, originalPhoto?.url ? [originalPhoto.url] : undefined);
      updateCharacterReference(key, { sheetUrl: result.url, status: "generated" });
    } catch (e) {
      updateCharacterReference(key, { status: "pending" });
      setErrors((prev) => ({ ...prev, [key]: e instanceof Error ? e.message : "Erreur inconnue" }));
    }
  }

  async function adjust(key: string, basePrompt: string) {
    const modification = (modDrafts[key] ?? "").trim();
    if (!modification) return;
    setRefining((prev) => ({ ...prev, [key]: true }));
    try {
      const refinedPrompt = await refineCharacterPrompt(basePrompt, modification, apiKeys.claudeApiKey);
      updateCharacterReference(key, { prompt: refinedPrompt });
      setModDrafts((prev) => ({ ...prev, [key]: "" }));
      await generate(key, refinedPrompt);
    } finally {
      setRefining((prev) => ({ ...prev, [key]: false }));
    }
  }

  return (
    <div
      ref={measureRef}
      data-card
      className={cn("relative bg-agent-s1 border border-agent-bd rounded-lg p-3 mb-4", active && "z-30 shadow-xl")}
      style={{ width: CARD_WIDTH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <div className="flex items-center gap-1.5 mb-2 text-[12.5px] font-medium text-agent-t1">
        <button onPointerDown={onDragStart} title="Déplacer" className="cursor-grab active:cursor-grabbing text-agent-t3 hover:text-agent-t1 -ml-0.5">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <Users className="w-3.5 h-3.5 text-agent-acc" /> Casting
      </div>
      <div className="space-y-2.5">
        {references.map(({ key, ref }) => (
          <div key={key} className="bg-agent-s3 border border-agent-bd rounded-md p-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11.5px] font-medium text-agent-t1">{ref.name}</span>
              <span
                className={cn(
                  "text-[9.5px] px-1.5 py-0.5 rounded",
                  ref.status === "validated" ? "bg-agent-grn/15 text-agent-grn" : "bg-agent-s2 text-agent-t2"
                )}
              >
                {ref.status === "validated" ? "Validé" : ref.status === "generating" ? "..." : ref.status === "generated" ? "À valider" : "En attente"}
              </span>
            </div>
            {ref.sheetUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ref.sheetUrl} alt={ref.name} className="w-full rounded mb-1.5" />
            )}
            {errors[key] && <div className="text-[10px] text-red-400 mb-1.5">{errors[key]}</div>}
            <div className="flex gap-1 flex-wrap">
              {!ref.sheetUrl ? (
                <button
                  onClick={() => generate(key, ref.prompt)}
                  disabled={ref.status === "generating"}
                  className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-1 rounded bg-agent-acc hover:bg-agent-acc2 text-white disabled:opacity-40"
                >
                  {errors[key] ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />} {errors[key] ? "Réessayer" : "Générer"}
                </button>
              ) : ref.status !== "validated" ? (
                <>
                  <button
                    onClick={() => updateCharacterReference(key, { status: "validated" })}
                    className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-1 rounded bg-agent-acc hover:bg-agent-acc2 text-white"
                  >
                    <Check className="w-3 h-3" /> Valider
                  </button>
                  <button
                    onClick={() => generate(key, ref.prompt)}
                    className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-1 rounded bg-agent-s2 border border-agent-bd2 text-agent-t1"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <span className="text-[10.5px] text-agent-grn flex items-center gap-1">
                  <Check className="w-3 h-3" /> Validé
                </span>
              )}
            </div>
            {ref.sheetUrl && ref.status !== "validated" && (
              <div className="mt-1.5 pt-1.5 border-t border-agent-bd">
                <p className="text-[10px] text-agent-t3 mb-1">Satisfait de ce personnage, ou tu veux ajuster quelque chose ?</p>
                <div className="flex gap-1">
                  <input
                    value={modDrafts[key] ?? ""}
                    onChange={(e) => setModDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder='ex : "trop vieille", "cheveux plus foncés"...'
                    disabled={refining[key]}
                    className="flex-1 min-w-0 bg-agent-s3 border border-agent-bd rounded px-1.5 py-1 text-[10.5px] text-agent-t1 placeholder:text-agent-t3"
                  />
                  <button
                    onClick={() => adjust(key, ref.prompt)}
                    disabled={refining[key] || !(modDrafts[key] ?? "").trim()}
                    className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-1 rounded bg-agent-s2 border border-agent-bd2 text-agent-t1 disabled:opacity-40 shrink-0"
                  >
                    {refining[key] ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Ajuster
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-agent-bd">
        {addOpen ? (
          <div className="space-y-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom du personnage"
              autoFocus
              className="w-full bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-[11px] text-agent-t1 placeholder:text-agent-t3"
            />
            <div className="flex gap-1.5">
              <button onClick={() => setAddOpen(false)} className="flex-1 text-[10.5px] px-2 py-1.5 rounded bg-agent-s3 border border-agent-bd2 text-agent-t2">
                Annuler
              </button>
              <button
                onClick={handleManualAdd}
                disabled={!newName.trim()}
                className="flex-1 text-[10.5px] px-2 py-1.5 rounded bg-agent-acc hover:bg-agent-acc2 text-white disabled:opacity-40"
              >
                Ajouter
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddOpen(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] text-agent-t2 hover:text-agent-t1 px-2 py-1.5 rounded border border-dashed border-agent-bd"
          >
            <Plus className="w-3.5 h-3.5" /> Claude a raté un personnage ? Ajouter
          </button>
        )}
      </div>
    </div>
  );
}

/** Bloc "Produit" — la photo exacte du produit sert de référence visuelle dans les frames. */
function ProductBlock({ offset, active, onDragStart, measureRef }: DragHandleProps) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const addProductPhoto = useBrandStore((s) => s.addProductPhoto);
  const removeProductPhoto = useBrandStore((s) => s.removeProductPhoto);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!currentProject || !brand) return null;
  const photo = brand.productPhotos[0];

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      addProductPhoto(brand!.id, { url: base64, name: brand!.name });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      ref={measureRef}
      data-card
      className={cn("relative bg-agent-s1 border border-agent-bd rounded-lg p-3 mb-4", active && "z-30 shadow-xl")}
      style={{ width: CARD_WIDTH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <div className="flex items-center gap-1.5 mb-2 text-[12.5px] font-medium text-agent-t1">
        <button onPointerDown={onDragStart} title="Déplacer" className="cursor-grab active:cursor-grabbing text-agent-t3 hover:text-agent-t1 -ml-0.5">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <Package className="w-3.5 h-3.5 text-agent-acc" /> Produit
      </div>
      <p className="text-[10px] text-agent-t3 mb-2">
        La photo exacte du produit sert de référence visuelle — sans elle, l&apos;IA invente son propre packaging.
      </p>
      {photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={brand.name} className="w-full rounded mb-2 border border-agent-bd" />
          <div className="flex gap-1.5">
            <button
              onClick={() => uploadRef.current?.click()}
              disabled={uploading}
              className="flex-1 text-[10.5px] px-2 py-1.5 rounded bg-agent-s3 border border-agent-bd2 text-agent-t1 disabled:opacity-40"
            >
              {uploading ? "Envoi..." : "Remplacer"}
            </button>
            <button
              onClick={() => removeProductPhoto(brand.id, photo.id)}
              className="p-1.5 rounded bg-red-950/40 border border-red-900/50 text-red-400"
              title="Retirer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => uploadRef.current?.click()}
          disabled={uploading}
          className="w-full inline-flex items-center justify-center gap-1.5 text-[11.5px] font-medium px-2 py-1.5 rounded bg-agent-acc hover:bg-agent-acc2 text-white disabled:opacity-40"
        >
          <UploadCloud className="w-3.5 h-3.5" /> {uploading ? "Envoi..." : "Ajouter une photo produit"}
        </button>
      )}
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
    </div>
  );
}

/** Bloc "Décors" — références de lieux récurrents (optionnel). */
function DecorBlock({ offset, active, onDragStart, measureRef }: DragHandleProps) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const initLocationReferences = useProjectStore((s) => s.initLocationReferences);
  const updateLocationReference = useProjectStore((s) => s.updateLocationReference);
  const styles = useStyleStore((s) => s.styles);
  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const plan = currentProject?.plan;
  const distinctLocationIds = Array.from(new Set((plan?.scenes ?? []).map((s) => s.locationId).filter((id): id is string => !!id)));

  useEffect(() => {
    if (!currentProject || distinctLocationIds.length === 0) return;
    const missing = distinctLocationIds.filter((id) => !currentProject.locationReferences?.[id]);
    if (missing.length === 0) return;
    const refs = missing.map((id) => {
      const name = plan?.locationNames?.[id] || "Lieu";
      return { id, name, prompt: buildLocationSheetPrompt(name, style), status: "pending" as const };
    });
    initLocationReferences(refs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, distinctLocationIds.join(",")]);

  const references = distinctLocationIds
    .map((id) => ({ id, ref: currentProject?.locationReferences?.[id] }))
    .filter((r): r is { id: string; ref: NonNullable<typeof r.ref> } => !!r.ref);
  const allValidated = references.length > 0 && references.every((r) => r.ref.status === "validated");

  useEffect(() => {
    if (allValidated) setStatus("frames");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allValidated]);

  if (!currentProject || distinctLocationIds.length === 0) return null;

  async function generate(id: string, prompt: string) {
    updateLocationReference(id, { status: "generating" });
    setErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      const result = await falGenerateImage(prompt, "nano_banana", apiKeys.falApiKey);
      updateLocationReference(id, { sheetUrl: result.url, status: "generated" });
    } catch (e) {
      updateLocationReference(id, { status: "pending" });
      setErrors((prev) => ({ ...prev, [id]: e instanceof Error ? e.message : "Erreur inconnue" }));
    }
  }

  return (
    <div
      ref={measureRef}
      data-card
      className={cn("relative bg-agent-s1 border border-agent-bd rounded-lg p-3 mb-4", active && "z-30 shadow-xl")}
      style={{ width: CARD_WIDTH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <div className="flex items-center gap-1.5 mb-2 text-[12.5px] font-medium text-agent-t1">
        <button onPointerDown={onDragStart} title="Déplacer" className="cursor-grab active:cursor-grabbing text-agent-t3 hover:text-agent-t1 -ml-0.5">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <MapPin className="w-3.5 h-3.5 text-agent-acc" /> Décors
      </div>
      <div className="space-y-2.5">
        {references.map(({ id, ref }) => (
          <div key={id} className="bg-agent-s3 border border-agent-bd rounded-md p-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11.5px] font-medium text-agent-t1">{ref.name}</span>
              <span
                className={cn(
                  "text-[9.5px] px-1.5 py-0.5 rounded",
                  ref.status === "validated" ? "bg-agent-grn/15 text-agent-grn" : "bg-agent-s2 text-agent-t2"
                )}
              >
                {ref.status === "validated" ? "Validé" : ref.status === "generating" ? "..." : ref.status === "generated" ? "À valider" : "En attente"}
              </span>
            </div>
            {ref.sheetUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ref.sheetUrl} alt={ref.name} className="w-full rounded mb-1.5" />
            )}
            {errors[id] && <div className="text-[10px] text-red-400 mb-1.5">{errors[id]}</div>}
            <div className="flex gap-1 flex-wrap">
              {!ref.sheetUrl ? (
                <button
                  onClick={() => generate(id, ref.prompt)}
                  disabled={ref.status === "generating"}
                  className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-1 rounded bg-agent-acc hover:bg-agent-acc2 text-white disabled:opacity-40"
                >
                  {errors[id] ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />} {errors[id] ? "Réessayer" : "Générer"}
                </button>
              ) : ref.status !== "validated" ? (
                <>
                  <button
                    onClick={() => updateLocationReference(id, { status: "validated" })}
                    className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-1 rounded bg-agent-acc hover:bg-agent-acc2 text-white"
                  >
                    <Check className="w-3 h-3" /> Valider
                  </button>
                  <button
                    onClick={() => generate(id, ref.prompt)}
                    className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-1 rounded bg-agent-s2 border border-agent-bd2 text-agent-t1"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <span className="text-[10.5px] text-agent-grn flex items-center gap-1">
                  <Check className="w-3 h-3" /> Validé
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const COL1_GAP = 16; // = mb-4 sur chaque bloc

/**
 * Première colonne du canvas : script, voix off, casting et décors, empilés —
 * pas de chat séparé. Chaque bloc est déplaçable comme les cartes de scène, et
 * une ligne droite (toujours visible, jamais courbe) relie chaque bloc au
 * suivant puis au premier plan, quelle que soit sa position glissée.
 */
function FirstColumn({
  cardOffsets,
  activeCardId,
  onDragStart,
  measuredHeights,
  getMeasureRef,
  firstSceneId,
}: {
  cardOffsets: Record<string, { x: number; y: number }>;
  activeCardId: string | null;
  onDragStart: (id: string, e: ReactPointerEvent) => void;
  measuredHeights: Record<string, number>;
  getMeasureRef: (id: string) => (el: HTMLDivElement | null) => void;
  firstSceneId?: string;
}) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const plan = currentProject?.plan;
  const hasVoiceOver = !!plan?.scenes.some((s) => s.voiceOver?.text?.trim());
  // Casting reste affiché dès qu'un plan existe (pas seulement si Claude a détecté un
  // personnage) — c'est là qu'on ajoute manuellement un personnage raté par l'analyse.
  const hasCasting = !!plan;
  const hasDecor = !!plan && plan.scenes.some((s) => !!s.locationId);

  // Produit : nécessite un projet (donc une marque) déjà créé, comme Casting/Décors.
  const order = [
    "script",
    ...(hasCasting ? ["product"] : []),
    ...(hasVoiceOver ? ["voiceover"] : []),
    ...(hasCasting ? ["casting"] : []),
    ...(hasDecor ? ["decor"] : []),
  ];

  let cursor = 0;
  const anchors: Record<string, { top: number; height: number }> = {};
  for (const key of order) {
    const h = measuredHeights[key] ?? 140;
    anchors[key] = { top: cursor, height: h };
    cursor += h + COL1_GAP;
  }

  function off(id: string) {
    return cardOffsets[id] ?? { x: 0, y: 0 };
  }

  function dragProps(id: string): DragHandleProps {
    return { offset: off(id), active: activeCardId === id, onDragStart: (e) => onDragStart(id, e), measureRef: getMeasureRef(id) };
  }

  const sceneImgOffset = firstSceneId ? off(`img-${firstSceneId}`) : { x: 0, y: 0 };
  const sceneImgHeight = firstSceneId ? measuredHeights[`img-${firstSceneId}`] ?? (CARD_WIDTH * 16) / 9 : 0;

  return (
    <div className="relative flex flex-col shrink-0" style={{ width: CARD_WIDTH }}>
      <ScriptBlock {...dragProps("script")} />
      {hasCasting && <ProductBlock {...dragProps("product")} />}
      {hasVoiceOver && <VoiceOverBlock {...dragProps("voiceover")} />}
      {hasCasting && <CastingBlock {...dragProps("casting")} />}
      {hasDecor && <DecorBlock {...dragProps("decor")} />}

      {order.slice(0, -1).map((key, i) => {
        const nextKey = order[i + 1];
        const fromOffset = off(key);
        const toOffset = off(nextKey);
        return (
          <ConnectorLine
            key={`${key}-${nextKey}`}
            from={{ x: CARD_WIDTH / 2 + fromOffset.x, y: anchors[key].top + anchors[key].height + fromOffset.y }}
            to={{ x: CARD_WIDTH / 2 + toOffset.x, y: anchors[nextKey].top + toOffset.y }}
          />
        );
      })}

      {firstSceneId &&
        order.length > 0 &&
        (() => {
          const lastKey = order[order.length - 1];
          const lastOffset = off(lastKey);
          return (
            <ConnectorLine
              from={{ x: CARD_WIDTH + lastOffset.x, y: anchors[lastKey].top + anchors[lastKey].height / 2 + lastOffset.y }}
              to={{ x: CARD_WIDTH + 32 + sceneImgOffset.x, y: sceneImgHeight / 2 + sceneImgOffset.y }}
            />
          );
        })()}
    </div>
  );
}

function ImageCard({
  scene,
  offset,
  active,
  imageEngine,
  characters,
  onOpenDrawer,
  onDragStart,
  measureRef,
}: {
  scene: Scene;
  offset: { x: number; y: number };
  active: boolean;
  imageEngine: string;
  characters: { key: string; name: string; sheetUrl?: string }[];
  onOpenDrawer: () => void;
  onDragStart: (e: ReactPointerEvent) => void;
  measureRef: (el: HTMLDivElement | null) => void;
}) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const updateScene = useProjectStore((s) => s.updateScene);
  const recalcTotalCost = useProjectStore((s) => s.recalcTotalCost);
  const styles = useStyleStore((s) => s.styles);
  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const mandatoryImageRules = useSettingsStore((s) => s.advancedPrompts.mandatoryImageRules);
  const [visionDraft, setVisionDraft] = useState(scene.customVision ?? "");

  const isGenerating = scene.frameStatus === "frame_generating";
  const isValidated = scene.frameStatus === "frame_validated";
  const selectedCharacters = characters.filter((c) => scene.characters.includes(c.key));

  function toggleCharacter(key: string) {
    const next = scene.characters.includes(key)
      ? scene.characters.filter((k) => k !== key)
      : [...scene.characters, key];
    updateScene(scene.id, { characters: next });
  }

  async function regenerate() {
    updateScene(scene.id, { frameStatus: "frame_generating", frameError: undefined, customVision: visionDraft.trim() || undefined });
    const { urls, characterReferenceCount, hasProductReference, hasLocationReference } = await getReferenceImageInfo(
      scene,
      currentProject ?? undefined,
      brand
    );
    const productRoleNote = scene.hasProduct && scene.productRole
      ? scene.productRole === "hero"
        ? "Le produit est l'élément central de la composition, mis en avant au premier plan, net et bien éclairé."
        : "Le produit est visible mais discret, en arrière-plan, jamais au centre de l'attention."
      : "";
    const imagePromptWithVision = [scene.imagePrompt, productRoleNote, visionDraft.trim() && `Vision personnalisée du client : ${visionDraft.trim()}`]
      .filter(Boolean)
      .join("\n\n");
    const fullPrompt = buildImagePrompt({ imagePrompt: imagePromptWithVision }, style, brand, {
      characterReferenceCount,
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
        frameError: undefined,
      });
      recalcTotalCost();
    } catch (e) {
      updateScene(scene.id, { frameStatus: "error", frameError: e instanceof Error ? e.message : "Erreur inconnue" });
    }
  }

  return (
    <div
      ref={measureRef}
      data-card
      className={cn(
        "bg-agent-s2 border rounded-lg overflow-hidden relative flex flex-col shrink-0",
        statusBorder(scene.frameStatus, false),
        active && "z-30 shadow-xl"
      )}
      style={{ width: CARD_WIDTH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <button
        onPointerDown={onDragStart}
        title="Déplacer"
        className="absolute top-1.5 left-1.5 z-10 p-1 rounded bg-black/50 text-white/80 hover:text-white cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5">
        <span className="text-[11px] font-medium text-agent-t1">Scène {scene.index}</span>
        <span className="text-[10px] text-agent-t3">{IMAGE_ENGINE_LABELS[imageEngine] ?? imageEngine}</span>
      </div>

      {scene.beatLabel && (
        <div className="flex items-center gap-1 px-2.5 pb-1.5 flex-wrap">
          <span className="text-[9px] font-semibold uppercase tracking-wide bg-agent-acc/15 text-agent-acc px-1.5 py-0.5 rounded">
            {scene.beatLabel}
          </span>
          {scene.framing && (
            <span className="text-[9px] uppercase tracking-wide bg-agent-s3 text-agent-t3 px-1.5 py-0.5 rounded">
              {scene.framing.replace("_", " ")}
            </span>
          )}
        </div>
      )}

      {scene.voiceOver?.text && <p className="px-2.5 pb-1.5 text-[10.5px] italic text-agent-t2 line-clamp-3">« {scene.voiceOver.text} »</p>}

      <button onClick={onOpenDrawer} className="aspect-[9/16] flex items-center justify-center relative">
        {isGenerating && <RefreshCw className="w-4 h-4 animate-spin text-agent-acc" />}
        {!isGenerating && scene.frameUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scene.frameUrl} alt="" className="w-full h-full object-cover" />
        )}
        {!isGenerating && !scene.frameUrl && <ImageIcon className="w-5 h-5 text-agent-t3" />}
        <span className="absolute top-1.5 left-1.5 text-[9px] font-mono bg-black/50 text-white px-1 rounded">
          SC-{String(scene.index).padStart(2, "0")}
        </span>
        {isValidated && (
          <span className="absolute top-1.5 right-1.5 bg-agent-grn text-white rounded-full p-0.5">
            <Check className="w-3 h-3" />
          </span>
        )}
      </button>

      <div className="p-2.5 space-y-2">
        <div>
          <label className="flex items-center gap-1 text-[9.5px] uppercase tracking-wide text-agent-t3 mb-1">
            <User className="w-3 h-3" /> Personnages ({selectedCharacters.length || "aucun"})
          </label>
          {characters.length === 0 ? (
            <p className="text-[10px] text-agent-t3">Aucun personnage détecté pour ce projet.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {characters.map((c) => {
                const isSelected = scene.characters.includes(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggleCharacter(c.key)}
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-1 rounded border text-[10px] transition-colors",
                      isSelected
                        ? "bg-agent-acc/15 border-agent-acc/50 text-agent-t1"
                        : "border-agent-bd text-agent-t3 hover:text-agent-t1"
                    )}
                    title={c.name}
                  >
                    {c.sheetUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.sheetUrl} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
                    )}
                    <span className="truncate max-w-[80px]">{c.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <label className="flex items-center gap-1.5 text-[10.5px] text-agent-t2">
          <input
            type="checkbox"
            checked={scene.hasProduct}
            onChange={(e) =>
              updateScene(scene.id, {
                hasProduct: e.target.checked,
                productAssetId: e.target.checked ? brand?.productPhotos[0]?.id : undefined,
                productRole: e.target.checked ? scene.productRole ?? "hero" : undefined,
              })
            }
          />
          Afficher le produit dans la scène
        </label>

        {scene.hasProduct && !brand?.productPhotos.some((p) => p.id === scene.productAssetId) && (
          <div className="flex items-start gap-1 text-[9.5px] text-agent-amb">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            Aucune photo produit trouvée pour cette marque — l&apos;IA va imaginer le produit sans référence réelle.
            Ajoute une photo produit dans Marques pour qu&apos;il soit fidèle.
          </div>
        )}

        {scene.hasProduct && (brand?.productPhotos.length ?? 0) > 1 && (
          <div>
            <label className="text-[9.5px] uppercase tracking-wide text-agent-t3 mb-1 block">Quelle photo produit ?</label>
            <div className="flex flex-wrap gap-1">
              {brand!.productPhotos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => updateScene(scene.id, { productAssetId: p.id })}
                  className={cn(
                    "w-9 h-9 rounded border-2 overflow-hidden shrink-0",
                    scene.productAssetId === p.id ? "border-agent-acc" : "border-agent-bd"
                  )}
                  title={p.name || "Photo produit"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {scene.hasProduct && (
          <div className="flex gap-1">
            <button
              onClick={() => updateScene(scene.id, { productRole: "hero" })}
              className={cn(
                "flex-1 text-[9.5px] px-1.5 py-1 rounded border",
                scene.productRole === "hero" ? "bg-agent-acc/15 border-agent-acc text-agent-acc" : "border-agent-bd text-agent-t3"
              )}
            >
              ⭐ Star du plan
            </button>
            <button
              onClick={() => updateScene(scene.id, { productRole: "background" })}
              className={cn(
                "flex-1 text-[9.5px] px-1.5 py-1 rounded border",
                scene.productRole === "background" ? "bg-agent-acc/15 border-agent-acc text-agent-acc" : "border-agent-bd text-agent-t3"
              )}
            >
              🎬 En fond
            </button>
          </div>
        )}

        <textarea
          rows={2}
          value={visionDraft}
          onChange={(e) => setVisionDraft(e.target.value)}
          placeholder="Ta vision / prompt custom (optionnel)"
          className="w-full bg-agent-s3 border border-agent-bd rounded px-1.5 py-1 text-[10.5px] text-agent-t1 placeholder:text-agent-t3 focus:outline-none focus:border-agent-acc resize-none"
        />

        {scene.frameError && (
          <div className="flex items-start gap-1 text-[9.5px] text-red-400">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {scene.frameError}
          </div>
        )}

        <button
          onClick={regenerate}
          disabled={isGenerating}
          className="w-full inline-flex items-center justify-center gap-1.5 text-[10.5px] font-medium px-2 py-1.5 rounded bg-agent-acc hover:bg-agent-acc2 text-white disabled:opacity-40"
        >
          <RefreshCw className="w-3 h-3" /> {scene.frameUrl ? "Régénérer avec ma vision" : "Générer"}
        </button>

        {scene.frameUrl && scene.frameStatus !== "frame_validated" && (
          <button
            onClick={() => updateScene(scene.id, { frameStatus: "frame_validated" })}
            className="w-full text-[10.5px] font-medium px-2 py-1.5 rounded bg-agent-s3 border border-agent-bd2 text-agent-t1"
          >
            Valider
          </button>
        )}
      </div>
    </div>
  );
}

function VideoCard({
  scene,
  style,
  engine,
  lang,
  offset,
  active,
  onDragStart,
}: {
  scene: Scene;
  style: StylePreset;
  engine: VideoEngine;
  lang: "fr" | "en";
  offset: { x: number; y: number };
  active: boolean;
  onDragStart: (e: ReactPointerEvent) => void;
}) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateScene = useProjectStore((s) => s.updateScene);
  const recalcTotalCost = useProjectStore((s) => s.recalcTotalCost);
  const addLearningEntry = useLearningStore((s) => s.addEntry);
  const learningEntries = useLearningStore((s) => s.entries);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const motionIntensity = useSettingsStore((s) => s.generationDefaults.motionIntensity);
  const mandatoryVideoRules = useSettingsStore((s) => s.advancedPrompts.mandatoryVideoRules);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState(FEEDBACK_REASONS[0].value);
  const [videoVisionDraft, setVideoVisionDraft] = useState(scene.customVideoVision ?? "");

  const isGenerating = scene.videoStatus === "video_generating";
  const isValidated = scene.videoStatus === "video_validated";
  // L'utilisateur peut forcer Kling ou Grok pour CETTE vidéo précise, en plus
  // du routage automatique par langue — undefined = suit le routage par défaut.
  const effectiveEngine = scene.videoEngineOverride ?? engine;

  async function runGeneration() {
    updateScene(scene.id, { customVideoVision: videoVisionDraft.trim() || undefined });
    const promptWithVision = [scene.videoPrompt, videoVisionDraft.trim() && `Direction additionnelle du client : ${videoVisionDraft.trim()}`]
      .filter(Boolean)
      .join("\n\n");
    await generateSceneVideo({
      scene,
      prompt: promptWithVision,
      style,
      engine: effectiveEngine,
      lang,
      motionIntensity,
      mandatoryVideoRules,
      characterNames: currentProject?.plan?.characterNames,
      learningEntries,
      apiKey: apiKeys.falApiKey,
      audioCalibrated: !!currentProject?.voiceOverAudioUrl,
      updateScene,
      recalcTotalCost,
    });
  }

  return (
    <div
      data-card
      className={cn(
        "bg-agent-s2 border rounded-lg overflow-hidden relative flex flex-col shrink-0",
        statusBorder(scene.videoStatus, false),
        active && "z-30 shadow-xl"
      )}
      style={{ width: CARD_WIDTH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <button
        onPointerDown={onDragStart}
        title="Déplacer"
        className="absolute top-1.5 left-1.5 z-10 p-1 rounded bg-black/50 text-white/80 hover:text-white cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5 gap-1.5">
        <span className="text-[11px] font-medium text-agent-t1 shrink-0">Vidéo · SC-{String(scene.index).padStart(2, "0")}</span>
        <div className="flex items-center gap-1">
          <select
            value={scene.videoEngineOverride ?? "auto"}
            onChange={(e) => {
              const v = e.target.value;
              updateScene(scene.id, { videoEngineOverride: v === "auto" ? undefined : (v as VideoEngine) });
            }}
            title="Forcer le moteur vidéo pour cette scène précise"
            className="text-[10px] bg-agent-s3 border border-agent-bd rounded px-1 py-0.5 text-agent-t2"
          >
            <option value="auto">Auto ({VIDEO_ENGINE_LABELS[engine] ?? engine})</option>
            <option value="kling_3_0">Kling 3.0</option>
            <option value="grok_video">Grok Video</option>
          </select>
          <span className="text-[10px] text-agent-t3 shrink-0">{scene.durationSeconds}s</span>
        </div>
      </div>

      <div className="px-2.5 pb-1.5">
        <textarea
          rows={2}
          value={videoVisionDraft}
          onChange={(e) => setVideoVisionDraft(e.target.value)}
          placeholder="Ta vision pour la vidéo (optionnel) — action, caméra, ambiance, transition... sinon AUTO"
          className="w-full bg-agent-s3 border border-agent-bd rounded px-1.5 py-1 text-[10px] text-agent-t1 placeholder:text-agent-t3 resize-none focus:outline-none focus:border-agent-acc"
        />
      </div>

      <div className="aspect-[9/16] relative flex items-center justify-center bg-black">
        {scene.videoUrl && !isGenerating ? (
          <video src={scene.videoUrl} controls className="w-full h-full object-cover" />
        ) : isGenerating ? (
          <RefreshCw className="w-4 h-4 animate-spin text-agent-acc" />
        ) : (
          <Film className="w-5 h-5 text-agent-t3" />
        )}
        {isValidated && (
          <span className="absolute top-1.5 right-1.5 bg-agent-grn text-white rounded-full p-0.5">
            <Check className="w-3 h-3" />
          </span>
        )}
        {scene.videoUrl && (
          <button
            onClick={() => downloadImage(scene.videoUrl!, `scene-${scene.index}.mp4`)}
            className="absolute bottom-1.5 right-1.5 p-1 rounded bg-black/50 text-white hover:bg-black/70"
          >
            <Download className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="p-2.5 space-y-2">
        <div className="flex gap-1">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => updateScene(scene.id, { durationSeconds: d })}
              className={cn(
                "flex-1 text-[10px] py-1 rounded border",
                scene.durationSeconds === d ? "bg-agent-acc/15 border-agent-acc text-agent-acc" : "border-agent-bd text-agent-t3"
              )}
            >
              {d}s
            </button>
          ))}
        </div>

        {scene.videoError && (
          <div className="text-[9.5px] text-red-400 flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {scene.videoError}
          </div>
        )}

        {!scene.videoUrl ? (
          <button
            onClick={runGeneration}
            disabled={isGenerating}
            className="w-full inline-flex items-center justify-center gap-1.5 text-[10.5px] font-medium px-2 py-1.5 rounded bg-agent-acc hover:bg-agent-acc2 text-white disabled:opacity-40"
          >
            <Sparkles className="w-3 h-3" /> {scene.videoError ? "Réessayer" : "Régénérer la vidéo"}
          </button>
        ) : !isValidated ? (
          <div className="flex gap-1">
            <button
              onClick={() => updateScene(scene.id, { videoStatus: "video_validated" })}
              className="flex-1 text-[10.5px] font-medium px-2 py-1.5 rounded bg-agent-acc hover:bg-agent-acc2 text-white"
            >
              Valider
            </button>
            <button
              onClick={runGeneration}
              className="flex-1 text-[10.5px] font-medium px-2 py-1.5 rounded bg-agent-s3 border border-agent-bd2 text-agent-t1"
            >
              Régénérer
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                updateScene(scene.id, { feedback: { id: scene.id, sceneId: scene.id, rating: "up", engine, createdAt: new Date().toISOString() } })
              }
              className={cn("p-1 rounded", scene.feedback?.rating === "up" ? "text-agent-acc" : "text-agent-t3 hover:text-agent-t1")}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFeedbackOpen(true)}
              className={cn("p-1 rounded", scene.feedback?.rating === "down" ? "text-red-400" : "text-agent-t3 hover:text-agent-t1")}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {feedbackOpen && (
        <div className="absolute z-40 left-0 right-0 top-full mt-1 bg-agent-s2 border border-agent-bd rounded-md p-2 shadow-lg">
          <select
            value={feedbackReason}
            onChange={(e) => setFeedbackReason(e.target.value)}
            className="bg-agent-s3 border border-agent-bd rounded px-1.5 py-1 text-[10.5px] text-agent-t1 mb-1.5 w-full"
          >
            {FEEDBACK_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            <button
              onClick={() => {
                updateScene(scene.id, {
                  feedback: { id: scene.id, sceneId: scene.id, rating: "down", reason: feedbackReason, engine, createdAt: new Date().toISOString() },
                });
                addLearningEntry({ engine, reason: FEEDBACK_REASONS.find((r) => r.value === feedbackReason)?.label ?? feedbackReason });
                setFeedbackOpen(false);
              }}
              className="text-[10px] px-1.5 py-1 rounded bg-agent-acc text-white"
            >
              Envoyer
            </button>
            <button onClick={() => setFeedbackOpen(false)} className="text-[10px] px-1.5 py-1 rounded bg-agent-s3 text-agent-t2">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MediaCanvas({ onOpenLibrary, onOpenProjectBrain }: { onOpenLibrary: () => void; onOpenProjectBrain: () => void }) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const updateScene = useProjectStore((s) => s.updateScene);
  const recalcTotalCost = useProjectStore((s) => s.recalcTotalCost);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const styles = useStyleStore((s) => s.styles);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const mandatoryImageRules = useSettingsStore((s) => s.advancedPrompts.mandatoryImageRules);
  const mandatoryVideoRules = useSettingsStore((s) => s.advancedPrompts.mandatoryVideoRules);
  const motionIntensity = useSettingsStore((s) => s.generationDefaults.motionIntensity);
  const learningEntries = useLearningStore((s) => s.entries);

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [generatingAllFrames, setGeneratingAllFrames] = useState(false);
  const [generatingAllVideos, setGeneratingAllVideos] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [canvasView, setCanvasView] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
  const [cardOffsets, setCardOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});

  const plan = currentProject?.plan;
  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];

  // Mesure la hauteur réelle de chaque bloc/carte (ResizeObserver, non affectée par
  // le transform pan/zoom du canvas) pour empiler/relier les blocs avec des lignes
  // toujours justes, même quand leur contenu change de taille (texte, images...).
  const resizeObserversRef = useRef<Map<string, ResizeObserver>>(new Map());
  const measureRefCacheRef = useRef<Record<string, (el: HTMLDivElement | null) => void>>({});
  function getMeasureRef(id: string) {
    if (!measureRefCacheRef.current[id]) {
      measureRefCacheRef.current[id] = (el: HTMLDivElement | null) => {
        resizeObserversRef.current.get(id)?.disconnect();
        resizeObserversRef.current.delete(id);
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
          const h = entries[0]?.contentRect.height;
          if (h != null) setMeasuredHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
        });
        ro.observe(el);
        resizeObserversRef.current.set(id, ro);
      };
    }
    return measureRefCacheRef.current[id];
  }

  const wheelCleanupRef = useRef<(() => void) | null>(null);
  const boardWrapCallbackRef = (el: HTMLDivElement | null) => {
    wheelCleanupRef.current?.();
    wheelCleanupRef.current = null;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setCanvasView((prev) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const newZoom = clampZoom(prev.zoom * factor);
        const ratio = newZoom / prev.zoom;
        return { zoom: newZoom, pan: { x: cx - (cx - prev.pan.x) * ratio, y: cy - (cy - prev.pan.y) * ratio } };
      });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    wheelCleanupRef.current = () => el.removeEventListener("wheel", onWheel);
  };

  const framedScenes = plan?.scenes.filter((s) => s.needsFrame) ?? [];
  const validatedFrames = framedScenes.filter((s) => s.frameStatus === "frame_validated").length;
  const validatedVideos = plan?.scenes.filter((s) => s.videoStatus === "video_validated").length ?? 0;
  const allFramesValidated = framedScenes.length > 0 && validatedFrames === framedScenes.length;
  const allVideosValidated = !!plan && plan.scenes.length > 0 && validatedVideos === plan.scenes.length;
  const isGeneratingAny = !!plan && plan.scenes.some((s) => s.frameStatus === "frame_generating" || s.videoStatus === "video_generating");
  const selectedScene = plan?.scenes.find((s) => s.id === selectedSceneId);
  const engine = currentProject?.videoEngine ?? "auto";
  const lang = currentProject?.lang ?? "fr";
  const characterList = Object.entries(currentProject?.characterReferences ?? {}).map(([key, ref]) => ({
    key,
    name: ref.name,
    sheetUrl: ref.sheetUrl,
  }));
  const hasVoice = !!plan?.scenes.some((s) => s.voiceType === "voiceover" || s.voiceType === "lipsync");
  const hasFailed = framedScenes.some((s) => s.frameStatus === "error") || !!plan?.scenes.some((s) => s.videoStatus === "error");
  const hasUnvalidated = !!plan?.scenes.some(
    (s) => (s.needsFrame && s.frameStatus === "frame_generated") || s.videoStatus === "video_generated"
  );

  /** Valide en un clic toutes les frames/vidéos déjà générées (mais pas encore validées) — évite de cocher chaque case une par une. */
  function handleValidateAll() {
    plan?.scenes.forEach((s) => {
      if (s.needsFrame && s.frameStatus === "frame_generated") {
        updateScene(s.id, { frameStatus: "frame_validated" });
      }
      if (s.videoStatus === "video_generated") {
        updateScene(s.id, { videoStatus: "video_validated" });
      }
    });
  }

  function handleCardDragStart(cardId: string, e: ReactPointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    setActiveCardId(cardId);
    const startX = e.clientX;
    const startY = e.clientY;
    const startOffset = cardOffsets[cardId] ?? { x: 0, y: 0 };
    const zoomNow = canvasView.zoom;
    function onMove(ev: PointerEvent) {
      const dx = (ev.clientX - startX) / zoomNow;
      const dy = (ev.clientY - startY) / zoomNow;
      setCardOffsets((prev) => ({ ...prev, [cardId]: { x: startOffset.x + dx, y: startOffset.y + dy } }));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setActiveCardId(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function handleBoardPointerDown(e: ReactPointerEvent) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-card]")) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPan = canvasView.pan;
    function onMove(ev: PointerEvent) {
      setCanvasView((v) => ({ ...v, pan: { x: startPan.x + (ev.clientX - startX), y: startPan.y + (ev.clientY - startY) } }));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function zoomBy(factor: number) {
    setCanvasView((v) => ({ ...v, zoom: clampZoom(v.zoom * factor) }));
  }

  function resetView() {
    setCanvasView({ zoom: 1, pan: { x: 0, y: 0 } });
  }

  async function generateFrame(scene: Scene) {
    updateScene(scene.id, { frameStatus: "frame_generating", frameError: undefined });
    const { urls, characterReferenceCount, hasProductReference, hasLocationReference } = await getReferenceImageInfo(
      scene,
      currentProject ?? undefined,
      brand
    );
    const fullPrompt = buildImagePrompt({ imagePrompt: scene.imagePrompt }, style, brand, {
      characterReferenceCount,
      hasProductReference,
      hasLocationReference,
      customRules: mandatoryImageRules,
    });
    try {
      const result = await falGenerateImage(fullPrompt, currentProject!.imageEngine ?? "auto", apiKeys.falApiKey, urls.length > 0 ? urls : undefined);
      updateScene(scene.id, {
        frameUrl: result.url,
        frameStatus: "frame_generated",
        frameHistory: [...scene.frameHistory, result.url],
        imageCostEstimate: result.costEstimate,
        frameError: undefined,
      });
    } catch (e) {
      updateScene(scene.id, { frameStatus: "error", frameError: e instanceof Error ? e.message : "Erreur inconnue" });
    }
  }

  async function generateVideo(scene: Scene) {
    await generateSceneVideo({
      scene,
      prompt: scene.videoPrompt,
      style,
      engine: scene.videoEngineOverride ?? engine,
      lang,
      motionIntensity,
      mandatoryVideoRules,
      characterNames: plan!.characterNames,
      learningEntries,
      apiKey: apiKeys.falApiKey,
      audioCalibrated: !!currentProject?.voiceOverAudioUrl,
      updateScene,
      recalcTotalCost,
    });
  }

  async function handleGenerateAllFrames() {
    if (!plan) return;
    setGeneratingAllFrames(true);
    await mapWithConcurrency(framedScenes.filter((s) => !s.frameUrl), 8, generateFrame);
    recalcTotalCost();
    setGeneratingAllFrames(false);
  }

  async function handleGenerateAllVideos() {
    if (!plan) return;
    setGeneratingAllVideos(true);
    await mapWithConcurrency(plan.scenes.filter((s) => s.frameUrl && !s.videoUrl), 4, generateVideo);
    setGeneratingAllVideos(false);
  }

  async function handleResume() {
    if (!plan) return;
    setResuming(true);
    await mapWithConcurrency(framedScenes.filter((s) => s.frameStatus === "error"), 8, generateFrame);
    await mapWithConcurrency(plan.scenes.filter((s) => s.videoStatus === "error"), 4, generateVideo);
    recalcTotalCost();
    setResuming(false);
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-agent-bg relative">
      {plan && (
        <div className="shrink-0 border-b border-agent-bd flex items-center flex-wrap gap-2 px-4 py-2">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-agent-t2 bg-agent-s2 border border-agent-bd rounded-md px-2.5 py-1">
            <User className="w-3.5 h-3.5" />
            {characterList.length > 0 ? characterList.map((c) => c.name).join(", ") : "Aucun personnage"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-agent-t2 bg-agent-s2 border border-agent-bd rounded-md px-2.5 py-1">
            <Wand2 className="w-3.5 h-3.5" /> {style?.name ?? "Style"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-agent-t2 bg-agent-s2 border border-agent-bd rounded-md px-2.5 py-1">
            <Mic className="w-3.5 h-3.5" /> {hasVoice ? `Voix ${lang.toUpperCase()}` : "Sans voix"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-agent-t2 bg-agent-s2 border border-agent-bd rounded-md px-2.5 py-1">
            <Film className="w-3.5 h-3.5" /> {engine}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-agent-t2 bg-agent-s2 border border-agent-bd rounded-md px-2.5 py-1">
            9:16
          </span>
          <span className="text-[11.5px] text-agent-t3">
            {validatedFrames}/{framedScenes.length} frames · {validatedVideos}/{plan.scenes.length} vidéos
          </span>

          {isGeneratingAny && (
            <span className="flex items-center gap-1.5 text-[11px] text-agent-acc">
              <RefreshCw className="w-3 h-3 animate-spin" /> Génération en cours...
            </span>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {hasFailed && (
              <button
                onClick={handleResume}
                disabled={resuming}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1.5 rounded-md bg-agent-amb/15 border border-agent-amb/40 text-agent-amb disabled:opacity-40"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", resuming && "animate-spin")} /> Reprendre
              </button>
            )}
            <button
              onClick={handleGenerateAllFrames}
              disabled={generatingAllFrames}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1.5 rounded-md bg-agent-s2 border border-agent-bd2 text-agent-t1 disabled:opacity-40"
            >
              <ImageIcon className="w-3.5 h-3.5" /> {generatingAllFrames ? "Génération..." : "Tout générer"}
            </button>
            <button
              onClick={handleGenerateAllVideos}
              disabled={generatingAllVideos}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1.5 rounded-md bg-agent-s2 border border-agent-bd2 text-agent-t1 disabled:opacity-40"
            >
              <Film className="w-3.5 h-3.5" /> {generatingAllVideos ? "Animation..." : "Tout animer"}
            </button>
            <button
              onClick={handleValidateAll}
              disabled={!hasUnvalidated}
              title="Valider toutes les frames et vidéos déjà générées"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1.5 rounded-md bg-agent-grn/15 border border-agent-grn/40 text-agent-grn disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" /> Tout valider
            </button>
          </div>
        </div>
      )}

      <div
        ref={boardWrapCallbackRef}
        onPointerDown={handleBoardPointerDown}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
      >
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ transform: `translate(${canvasView.pan.x}px, ${canvasView.pan.y}px) scale(${canvasView.zoom})` }}
        >
          <div className="flex gap-8 p-10 items-start">
            <FirstColumn
              cardOffsets={cardOffsets}
              activeCardId={activeCardId}
              onDragStart={handleCardDragStart}
              measuredHeights={measuredHeights}
              getMeasureRef={getMeasureRef}
              firstSceneId={plan?.scenes[0]?.id}
            />
            {plan?.scenes.map((scene) => {
              const imgOffset = cardOffsets[`img-${scene.id}`] ?? { x: 0, y: 0 };
              const vidOffset = cardOffsets[`vid-${scene.id}`] ?? { x: 0, y: 0 };
              const imageHeight = measuredHeights[`img-${scene.id}`] ?? (CARD_WIDTH * 16) / 9 + 260;
              const videoBaseY = imageHeight + 24;
              return (
                <div key={scene.id} className="relative shrink-0" style={{ width: CARD_WIDTH }}>
                  <ConnectorLine
                    from={{ x: CARD_WIDTH / 2 + imgOffset.x, y: videoBaseY + imgOffset.y }}
                    to={{ x: CARD_WIDTH / 2 + vidOffset.x, y: videoBaseY + vidOffset.y }}
                  />
                  {scene.needsFrame ? (
                    <ImageCard
                      scene={scene}
                      offset={imgOffset}
                      active={activeCardId === `img-${scene.id}`}
                      imageEngine={currentProject?.imageEngine ?? "auto"}
                      characters={characterList}
                      onOpenDrawer={() => setSelectedSceneId(scene.id)}
                      onDragStart={(e) => handleCardDragStart(`img-${scene.id}`, e)}
                      measureRef={getMeasureRef(`img-${scene.id}`)}
                    />
                  ) : (
                    <div style={{ width: CARD_WIDTH }} className="aspect-[9/16] rounded-lg border border-dashed border-agent-bd flex items-center justify-center text-[10px] text-agent-t3">
                      Pas de frame
                    </div>
                  )}
                  <div className="h-6 flex items-center justify-center">
                    <div className="w-px h-full bg-agent-bd2" />
                  </div>
                  <VideoCard
                    scene={scene}
                    style={style}
                    engine={engine}
                    lang={lang}
                    offset={vidOffset}
                    active={activeCardId === `vid-${scene.id}`}
                    onDragStart={(e) => handleCardDragStart(`vid-${scene.id}`, e)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-agent-s2 border border-agent-bd rounded-md p-1">
          <button onClick={() => zoomBy(0.85)} className="p-1.5 text-agent-t2 hover:text-agent-t1">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10.5px] text-agent-t3 w-9 text-center font-mono">{Math.round(canvasView.zoom * 100)}%</span>
          <button onClick={() => zoomBy(1 / 0.85)} className="p-1.5 text-agent-t2 hover:text-agent-t1">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={resetView} title="Réinitialiser la vue" className="p-1.5 text-agent-t2 hover:text-agent-t1">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 text-[10.5px] text-agent-t3 pointer-events-none">
          Molette = zoom · glisse le fond = déplacer la vue · glisse une carte = la repositionner
        </div>
      </div>

      {plan && (
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
          <button onClick={onOpenProjectBrain} className="flex items-center gap-1.5 text-[12px] text-agent-t2 hover:text-agent-t1 px-2.5 py-1.5 rounded-md border border-agent-bd">
            Project Brain
          </button>
          <button onClick={onOpenLibrary} className="flex items-center gap-1.5 text-[12px] text-agent-t2 hover:text-agent-t1 px-2.5 py-1.5 rounded-md border border-agent-bd">
            <Library className="w-3.5 h-3.5" /> Bibliothèque
          </button>
          {currentProject!.status === "videos" && allVideosValidated ? (
            <button
              onClick={() => setStatus("export")}
              className="text-[12.5px] font-medium px-3.5 py-2 rounded-md bg-agent-grn hover:opacity-90 text-white"
            >
              Finaliser
            </button>
          ) : (
            <button
              onClick={() => setStatus("videos")}
              disabled={!allFramesValidated || currentProject!.status === "videos"}
              className="text-[12.5px] font-medium px-3.5 py-2 rounded-md bg-agent-acc hover:bg-agent-acc2 disabled:opacity-40 text-white"
            >
              Lancer les vidéos
            </button>
          )}
        </div>
      )}

      {selectedScene && <FrameDrawer scene={selectedScene} onClose={() => setSelectedSceneId(null)} />}
    </div>
  );
}
