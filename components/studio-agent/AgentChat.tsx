"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  RefreshCw,
  Send,
  Sparkles,
  UploadCloud,
  Users,
  Wand2,
  MapPin,
} from "lucide-react";
import { useBrandStore } from "@/store/brandStore";
import { useStyleStore } from "@/store/styleStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useProjectStore } from "@/store/projectStore";
import { useLearningStore } from "@/store/learningStore";
import { CoConstructionMessage, ImageEngine, Lang, VideoEngine } from "@/types";
import { analyzeBrief, coConstructBrief, extractStyleFromImages } from "@/lib/claude";
import { buildLearningContext, buildCharacterSheetPrompt, buildLocationSheetPrompt } from "@/lib/prompts";
import { autoRouteImageEngine, autoRouteVideoEngine, falGenerateImage } from "@/lib/fal";
import { fileToBase64 } from "@/lib/storage";
import { cn } from "@/lib/utils";

function Bubble({ role, children }: { role: "agent" | "user"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[92%] rounded-lg px-3.5 py-3 text-[13px] leading-relaxed",
          role === "agent" ? "bg-agent-s2 border border-agent-bd text-agent-t1 w-full" : "bg-agent-acc/15 border border-agent-acc/30 text-agent-t1"
        )}
      >
        {children}
      </div>
    </div>
  );
}

function AgentAvatar() {
  return (
    <div className="w-5 h-5 rounded-full bg-agent-acc flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
      A
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        variant === "primary" ? "bg-agent-acc hover:bg-agent-acc2 text-white" : "bg-agent-s3 hover:bg-agent-bd2 text-agent-t1 border border-agent-bd2"
      )}
    >
      {children}
    </button>
  );
}

/** Étape 0 (existante) : style verrouillé avant le script — remise en forme visuelle uniquement. */
function StyleAndBriefTurn() {
  const brands = useBrandStore((s) => s.brands);
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const touchLastUsed = useBrandStore((s) => s.touchLastUsed);
  const styles = useStyleStore((s) => s.styles);
  const addCustomStyle = useStyleStore((s) => s.addCustomStyle);
  const settings = useSettingsStore((s) => s.generationDefaults);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const advancedPrompts = useSettingsStore((s) => s.advancedPrompts);
  const learningEntries = useLearningStore((s) => s.entries);
  const initProject = useProjectStore((s) => s.initProject);
  const updateCurrentProject = useProjectStore((s) => s.updateCurrentProject);
  const setStatus = useProjectStore((s) => s.setStatus);

  const [brandId, setBrandId] = useState(activeBrandId ?? brands[0]?.id ?? "");
  const [lang, setLang] = useState<Lang>(settings.defaultLang);
  const [styleId, setStyleId] = useState("");
  const [customStyleOpen, setCustomStyleOpen] = useState(false);
  const [customStyleImages, setCustomStyleImages] = useState<string[]>([]);
  const [extractingStyle, setExtractingStyle] = useState(false);
  const [customStyleError, setCustomStyleError] = useState<string | undefined>();
  const customStyleInputRef = useRef<HTMLInputElement>(null);
  const [brief, setBrief] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!brandId && (activeBrandId || brands.length > 0)) setBrandId(activeBrandId ?? brands[0].id);
  }, [brandId, activeBrandId, brands]);

  const selectedStyle = styles.find((s) => s.id === styleId);

  async function handleAddCustomStyleImages(files: FileList) {
    const encoded = await Promise.all(Array.from(files).map(fileToBase64));
    setCustomStyleImages((prev) => [...prev, ...encoded]);
  }

  async function handleExtractStyle() {
    if (customStyleImages.length === 0) return;
    setExtractingStyle(true);
    setCustomStyleError(undefined);
    try {
      const extracted = await extractStyleFromImages(customStyleImages, lang, apiKeys.claudeApiKey);
      const style = addCustomStyle(extracted);
      setStyleId(style.id);
      setCustomStyleOpen(false);
      setCustomStyleImages([]);
    } catch (e) {
      setCustomStyleError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setExtractingStyle(false);
    }
  }

  async function handleAnalyze() {
    if (!brief.trim() || !selectedStyle) return;
    setAnalyzing(true);
    const brand = brands.find((b) => b.id === brandId);
    const resolvedImageEngine = selectedStyle.recommendedImageEngine ?? autoRouteImageEngine();
    const resolvedVideoEngine = selectedStyle.recommendedVideoEngine ?? autoRouteVideoEngine(lang);

    initProject({
      name: `${brand?.name ?? "Projet"} — ${new Date().toLocaleDateString("fr-FR")}`,
      brandId,
      styleId: selectedStyle.id,
      lang,
      targetDuration: 60,
      imageEngine: resolvedImageEngine as ImageEngine,
      videoEngine: resolvedVideoEngine as VideoEngine,
    });
    updateCurrentProject({ brief, referenceImages: [] });
    if (brandId) touchLastUsed(brandId);

    if (apiKeys.claudeApiKey) {
      setStatus("brief_chat");
      setAnalyzing(false);
      return;
    }

    setStatus("analyzing");
    try {
      const plan = await analyzeBrief({
        brief,
        brand,
        style: selectedStyle,
        lang,
        targetDuration: 60,
        motionIntensity: settings.motionIntensity,
        learningContext: buildLearningContext(learningEntries),
        apiKey: apiKeys.claudeApiKey,
        systemPromptOverride: advancedPrompts.analyzeBriefSystemPrompt,
        minSceneDurationSeconds: advancedPrompts.minSceneDurationSeconds,
        maxSceneDurationSeconds: advancedPrompts.maxSceneDurationSeconds,
      });
      updateCurrentProject({ plan, imageEngine: resolvedImageEngine, videoEngine: resolvedVideoEngine, status: "plan_ready" });
      setStatus("plan_ready");
    } finally {
      setAnalyzing(false);
    }
  }

  if (!selectedStyle) {
    return (
      <Bubble role="agent">
        <div className="flex items-center gap-2 mb-3">
          <AgentAvatar />
          <span className="font-medium">Quel style visuel pour cette vidéo ?</span>
        </div>
        <p className="text-agent-t2 mb-3">Choix entièrement libre — je ne recommande jamais un style par défaut.</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => setStyleId(style.id)}
              className="text-left p-2.5 rounded-md bg-agent-s3 hover:bg-agent-bd2 border border-agent-bd transition-colors"
            >
              <div className="text-[12.5px] font-medium text-agent-t1">{style.name}</div>
              <div className="text-[11px] text-agent-t2 line-clamp-2">{style.shortDescription}</div>
            </button>
          ))}
        </div>

        {!customStyleOpen ? (
          <button
            type="button"
            onClick={() => setCustomStyleOpen(true)}
            className="text-[11.5px] text-agent-t2 hover:text-agent-acc flex items-center gap-1.5"
          >
            <ImagePlus className="w-3.5 h-3.5" /> Style atypique ? Envoyer des références visuelles
          </button>
        ) : (
          <div className="bg-agent-s3 border border-agent-bd rounded-md p-3 space-y-2">
            <p className="text-[11.5px] text-agent-t2">Envoie une dizaine d&apos;images du style que tu veux.</p>
            {customStyleImages.length > 0 && (
              <div className="grid grid-cols-5 gap-1.5">
                {customStyleImages.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt="" className="aspect-square object-cover rounded" />
                ))}
              </div>
            )}
            {customStyleError && <p className="text-[11px] text-red-400">{customStyleError}</p>}
            <div className="flex gap-1.5 flex-wrap">
              <ActionButton variant="secondary" onClick={() => customStyleInputRef.current?.click()}>
                <UploadCloud className="w-3.5 h-3.5" /> Ajouter
              </ActionButton>
              <input
                ref={customStyleInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) void handleAddCustomStyleImages(e.target.files);
                  e.target.value = "";
                }}
              />
              <ActionButton onClick={handleExtractStyle} disabled={customStyleImages.length === 0 || extractingStyle}>
                <Wand2 className="w-3.5 h-3.5" /> {extractingStyle ? "Extraction..." : "Extraire le style"}
              </ActionButton>
            </div>
          </div>
        )}
      </Bubble>
    );
  }

  return (
    <>
      <Bubble role="agent">
        <div className="flex items-center gap-2">
          <AgentAvatar />
          <span>
            Style <b className="text-agent-acc">{selectedStyle.name}</b> verrouillé pour tout le projet.
          </span>
        </div>
      </Bubble>
      <Bubble role="agent">
        <div className="flex items-center gap-2 mb-2">
          <AgentAvatar />
          <span className="font-medium">Colle ton script</span>
        </div>
        <p className="text-agent-t2 mb-2">
          Seul input nécessaire — marque, langue, personnages, découpage sont détectés automatiquement.
        </p>
        <textarea
          rows={7}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Colle ton script complet..."
          className="w-full bg-agent-s3 border border-agent-bd rounded-md p-2.5 text-[12.5px] text-agent-t1 placeholder:text-agent-t3 focus:outline-none focus:border-agent-acc resize-none mb-2"
        />
        <div className="flex items-center gap-2 mb-2">
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="bg-agent-s3 border border-agent-bd rounded-md px-2 py-1.5 text-[11.5px] text-agent-t1"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <div className="flex bg-agent-s3 border border-agent-bd rounded-md overflow-hidden">
            {(["fr", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-2.5 py-1.5 text-[11.5px] uppercase",
                  lang === l ? "bg-agent-acc text-white" : "text-agent-t2"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <ActionButton onClick={handleAnalyze} disabled={!brief.trim() || analyzing}>
          <Wand2 className="w-3.5 h-3.5" /> {analyzing ? "Analyse..." : "Analyser le script"}
        </ActionButton>
      </Bubble>
    </>
  );
}

/** Étape co-construction (existante) : reformulée visuellement, même logique. */
function CoConstructionTurn() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateCurrentProject = useProjectStore((s) => s.updateCurrentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const styles = useStyleStore((s) => s.styles);
  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];
  const settings = useSettingsStore((s) => s.generationDefaults);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const advancedPrompts = useSettingsStore((s) => s.advancedPrompts);
  const learningEntries = useLearningStore((s) => s.entries);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const messages = currentProject?.coConstruction?.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  const awaitingValidation = lastMessage?.role === "assistant" && !!lastMessage.isFinalSynthesis;

  useEffect(() => {
    if (startedRef.current || !currentProject) return;
    if (messages.length > 0) return;
    startedRef.current = true;
    void sendTurn([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id]);

  async function sendTurn(historyWithNewUserTurn: CoConstructionMessage[]) {
    if (!currentProject) return;
    setSending(true);
    setError(null);
    try {
      const turn = await coConstructBrief({
        brief: currentProject.brief,
        history: historyWithNewUserTurn.map((m) => ({ role: m.role, content: m.content })),
        apiKey: apiKeys.claudeApiKey,
        systemPromptOverride: advancedPrompts.coConstructionSystemPrompt,
        styleName: style?.name,
      });
      const assistantMessage: CoConstructionMessage = {
        role: "assistant",
        content: turn.message,
        quickReplies: turn.quickReplies,
        isFinalSynthesis: turn.isFinalSynthesis,
      };
      updateCurrentProject({
        coConstruction: {
          messages: [...historyWithNewUserTurn, assistantMessage],
          synthesis: turn.isFinalSynthesis ? turn.synthesis ?? turn.message : currentProject.coConstruction?.synthesis,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de connexion à Claude.");
    } finally {
      setSending(false);
    }
  }

  function handleSend(text: string) {
    if (!text.trim() || sending || !currentProject) return;
    const userMessage: CoConstructionMessage = { role: "user", content: text.trim() };
    const updated = [...messages, userMessage];
    updateCurrentProject({ coConstruction: { messages: updated, synthesis: currentProject.coConstruction?.synthesis } });
    setInput("");
    void sendTurn(updated);
  }

  async function handleLaunch() {
    if (!currentProject || !style) return;
    const synthesis = currentProject.coConstruction?.synthesis;
    setLaunching(true);
    setStatus("analyzing");
    try {
      const enrichedBrief = synthesis ? `${currentProject.brief}\n\n${synthesis}` : currentProject.brief;
      const plan = await analyzeBrief({
        brief: enrichedBrief,
        brand,
        style,
        lang: currentProject.lang,
        targetDuration: currentProject.targetDuration,
        motionIntensity: settings.motionIntensity,
        learningContext: buildLearningContext(learningEntries),
        apiKey: apiKeys.claudeApiKey,
        systemPromptOverride: advancedPrompts.analyzeBriefSystemPrompt,
        minSceneDurationSeconds: advancedPrompts.minSceneDurationSeconds,
        maxSceneDurationSeconds: advancedPrompts.maxSceneDurationSeconds,
      });
      updateCurrentProject({ plan, status: "plan_ready" });
      setStatus("plan_ready");
    } finally {
      setLaunching(false);
    }
  }

  if (!currentProject) return null;

  return (
    <>
      {messages.map((m, i) => (
        <div key={i}>
          <Bubble role={m.role === "user" ? "user" : "agent"}>
            {m.role === "assistant" ? (
              <div className="flex items-start gap-2">
                <AgentAvatar />
                <p className="whitespace-pre-wrap flex-1">{m.content}</p>
              </div>
            ) : (
              <p>{m.content}</p>
            )}
          </Bubble>
          {i === messages.length - 1 && m.role === "assistant" && !sending && (
            <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
              {m.isFinalSynthesis ? (
                <>
                  <ActionButton onClick={handleLaunch} disabled={launching}>
                    <Check className="w-3.5 h-3.5" /> {launching ? "Lancement..." : "Tout est bon, on lance"}
                  </ActionButton>
                  <ActionButton variant="secondary" onClick={() => document.getElementById("agent-chat-input")?.focus()}>
                    Je veux modifier un point
                  </ActionButton>
                </>
              ) : (
                m.quickReplies?.map((qr, qi) => (
                  <ActionButton key={qi} variant="secondary" onClick={() => handleSend(qr)}>
                    {qr}
                  </ActionButton>
                ))
              )}
            </div>
          )}
        </div>
      ))}
      {sending && (
        <div className="flex items-center gap-2 text-agent-t2 text-[11.5px]">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-agent-acc" /> Claude réfléchit...
        </div>
      )}
      {error && <div className="bg-red-950/30 border border-red-900/50 rounded-md p-2.5 text-[12px] text-red-400">{error}</div>}
      <ChatInputSlot value={input} onChange={setInput} onSend={() => handleSend(input)} disabled={sending} placeholder={
        awaitingValidation ? "Décris ce que tu veux modifier..." : "Réponds librement..."
      } />
    </>
  );
}

/** Zone de saisie libre, montée dans le flux du tour de co-construction. */
function ChatInputSlot({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <textarea
        id="agent-chat-input"
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-agent-s3 border border-agent-bd rounded-md p-2 text-[12.5px] text-agent-t1 placeholder:text-agent-t3 focus:outline-none focus:border-agent-acc resize-none"
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="self-end bg-agent-acc hover:bg-agent-acc2 disabled:opacity-40 text-white p-2 rounded-md"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

function AnalyzingTurn() {
  return (
    <Bubble role="agent">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-agent-acc" />
        <span>Analyse du brief en cours...</span>
      </div>
    </Bubble>
  );
}

/** Résumé de l'analyse (hook, arc, points de vigilance) + validation du découpage. */
function PlanSummaryTurn() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const plan = currentProject?.plan;
  if (!plan) return null;

  const totalDuration = plan.scenes.reduce((sum, s) => sum + s.durationSeconds, 0);

  return (
    <Bubble role="agent">
      <div className="flex items-center gap-2 mb-2">
        <AgentAvatar />
        <span className="font-medium">Brief analysé ✓</span>
      </div>
      {plan.briefAnalysis && <p className="text-agent-t2 mb-3">{plan.briefAnalysis}</p>}

      {plan.hook && (
        <div className="mb-2.5 bg-agent-s3 border border-agent-bd rounded-md p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wide text-agent-t3">Hook</span>
            <span
              className={cn(
                "text-[10.5px] px-1.5 py-0.5 rounded",
                plan.hook.evaluation === "fort" && "bg-agent-grn/15 text-agent-grn",
                plan.hook.evaluation === "moyen" && "bg-agent-amb/15 text-agent-amb",
                plan.hook.evaluation === "faible" && "bg-red-500/15 text-red-400"
              )}
            >
              {plan.hook.evaluation}
            </span>
          </div>
          <p className="italic text-agent-t1">« {plan.hook.texte} »</p>
          {plan.hook.probleme && <p className="text-[11.5px] text-agent-amb mt-1">{plan.hook.probleme}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-2.5 text-[11px]">
        {plan.marqueDetectee && <span className="bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-agent-t2">Marque : {plan.marqueDetectee}</span>}
        {plan.arcNarratif && <span className="bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-agent-t2">Arc : {plan.arcNarratif}</span>}
        <span className="bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-agent-t2">{plan.scenes.length} frames · {Math.round(totalDuration)}s</span>
      </div>

      {plan.pointsVigilance && plan.pointsVigilance.length > 0 && (
        <div className="mb-3 bg-agent-amb/10 border border-agent-amb/30 rounded-md p-2.5">
          <div className="flex items-center gap-1.5 text-agent-amb text-[11px] uppercase tracking-wide mb-1">
            <AlertTriangle className="w-3 h-3" /> Points de vigilance
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-[12px] text-agent-t2">
            {plan.pointsVigilance.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <ActionButton onClick={() => setStatus("characters")}>
        <Check className="w-3.5 h-3.5" /> Valider le découpage
      </ActionButton>
    </Bubble>
  );
}

/** Une carte de design par personnage récurrent — génère la fiche unique (pas de variantes). */
function CharacterTurn() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const initCharacterReferences = useProjectStore((s) => s.initCharacterReferences);
  const updateCharacterReference = useProjectStore((s) => s.updateCharacterReference);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const styles = useStyleStore((s) => s.styles);
  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const plan = currentProject?.plan;
  const distinctAssetIds = Array.from(new Set((plan?.scenes ?? []).flatMap((s) => s.characters)));

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

  useEffect(() => {
    if (currentProject && distinctAssetIds.length === 0) {
      const hasLocations = (plan?.scenes ?? []).some((s) => !!s.locationId);
      setStatus(hasLocations ? "locations" : "frames");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, distinctAssetIds.length]);

  if (!currentProject || distinctAssetIds.length === 0) return null;

  const references = distinctAssetIds
    .map((assetId) => ({ key: assetId, ref: currentProject.characterReferences?.[assetId] }))
    .filter((r): r is { key: string; ref: NonNullable<typeof r.ref> } => !!r.ref);
  const allValidated = references.length > 0 && references.every((r) => r.ref.status === "validated");

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

  return (
    <Bubble role="agent">
      <div className="flex items-center gap-2 mb-3">
        <AgentAvatar />
        <span className="font-medium">Design des personnages récurrents</span>
      </div>
      <div className="space-y-3">
        {references.map(({ key, ref }) => (
          <div key={key} className="bg-agent-s3 border border-agent-bd rounded-md p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12.5px] font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-agent-acc" /> {ref.name}
              </span>
              <span
                className={cn(
                  "text-[10.5px] px-1.5 py-0.5 rounded",
                  ref.status === "validated" ? "bg-agent-grn/15 text-agent-grn" : "bg-agent-s2 text-agent-t2"
                )}
              >
                {ref.status === "validated" ? "Validé" : ref.status === "generating" ? "Génération..." : ref.status === "generated" ? "À valider" : "En attente"}
              </span>
            </div>
            {ref.sheetUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ref.sheetUrl} alt={ref.name} className="w-full rounded mb-2" />
            )}
            {errors[key] && (
              <div className="flex items-start gap-1.5 bg-red-950/30 border border-red-900/50 rounded-md p-2 text-[11px] text-red-400 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {errors[key]}
              </div>
            )}
            <div className="flex gap-1.5 flex-wrap">
              {!ref.sheetUrl ? (
                <ActionButton onClick={() => generate(key, ref.prompt)} disabled={ref.status === "generating"}>
                  {errors[key] ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Réessayer
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Générer la fiche
                    </>
                  )}
                </ActionButton>
              ) : ref.status !== "validated" ? (
                <>
                  <ActionButton onClick={() => updateCharacterReference(key, { status: "validated" })}>
                    <Check className="w-3.5 h-3.5" /> Valider
                  </ActionButton>
                  <ActionButton variant="secondary" onClick={() => generate(key, ref.prompt)}>
                    <RefreshCw className="w-3.5 h-3.5" /> Régénérer
                  </ActionButton>
                </>
              ) : (
                <span className="text-[11.5px] text-agent-grn flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Validé</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <ActionButton
          onClick={() => {
            const hasLocations = (plan?.scenes ?? []).some((s) => !!s.locationId);
            setStatus(hasLocations ? "locations" : "frames");
          }}
          disabled={!allValidated}
        >
          Continuer
        </ActionButton>
      </div>
    </Bubble>
  );
}

/** Une carte par lieu récurrent détecté — optionnel, skippable. */
function LocationTurn() {
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

  useEffect(() => {
    if (currentProject && distinctLocationIds.length === 0) setStatus("frames");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, distinctLocationIds.length]);

  if (!currentProject || distinctLocationIds.length === 0) return null;

  const references = distinctLocationIds
    .map((id) => ({ id, ref: currentProject.locationReferences?.[id] }))
    .filter((r): r is { id: string; ref: NonNullable<typeof r.ref> } => !!r.ref);
  const allValidated = references.length > 0 && references.every((r) => r.ref.status === "validated");

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
    <Bubble role="agent">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AgentAvatar />
          <span className="font-medium">Décors récurrents (optionnel)</span>
        </div>
        <button onClick={() => setStatus("frames")} className="text-[11px] text-agent-t3 hover:text-agent-t1">
          Passer
        </button>
      </div>
      <div className="space-y-3">
        {references.map(({ id, ref }) => (
          <div key={id} className="bg-agent-s3 border border-agent-bd rounded-md p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12.5px] font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-agent-acc" /> {ref.name}
              </span>
              <span className={cn("text-[10.5px] px-1.5 py-0.5 rounded", ref.status === "validated" ? "bg-agent-grn/15 text-agent-grn" : "bg-agent-s2 text-agent-t2")}>
                {ref.status === "validated" ? "Validé" : ref.status === "generating" ? "Génération..." : ref.status === "generated" ? "À valider" : "En attente"}
              </span>
            </div>
            {ref.sheetUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ref.sheetUrl} alt={ref.name} className="w-full rounded mb-2" />
            )}
            {errors[id] && (
              <div className="flex items-start gap-1.5 bg-red-950/30 border border-red-900/50 rounded-md p-2 text-[11px] text-red-400 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {errors[id]}
              </div>
            )}
            <div className="flex gap-1.5 flex-wrap">
              {!ref.sheetUrl ? (
                <ActionButton onClick={() => generate(id, ref.prompt)} disabled={ref.status === "generating"}>
                  {errors[id] ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}{" "}
                  {errors[id] ? "Réessayer" : "Générer"}
                </ActionButton>
              ) : ref.status !== "validated" ? (
                <>
                  <ActionButton onClick={() => updateLocationReference(id, { status: "validated" })}>
                    <Check className="w-3.5 h-3.5" /> Valider
                  </ActionButton>
                  <ActionButton variant="secondary" onClick={() => generate(id, ref.prompt)}>
                    <RefreshCw className="w-3.5 h-3.5" /> Régénérer
                  </ActionButton>
                </>
              ) : (
                <span className="text-[11.5px] text-agent-grn flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Validé</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <ActionButton onClick={() => setStatus("frames")} disabled={!allValidated}>
          Continuer vers les frames
        </ActionButton>
      </div>
    </Bubble>
  );
}

function ProductionTurn() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const status = currentProject?.status;
  const plan = currentProject?.plan;
  if (!plan) return null;
  const framedScenes = plan.scenes.filter((s) => s.needsFrame);
  const validatedFrames = framedScenes.filter((s) => s.frameStatus === "frame_validated").length;
  const validatedVideos = plan.scenes.filter((s) => s.videoStatus === "video_validated").length;

  return (
    <Bubble role="agent">
      <div className="flex items-center gap-2 mb-2">
        <AgentAvatar />
        <span className="font-medium">
          {status === "frames" ? "Génération des frames" : "Génération des vidéos"}
        </span>
      </div>
      <p className="text-agent-t2">
        {status === "frames"
          ? `${validatedFrames}/${framedScenes.length} frames validées — tout se passe dans le canvas à droite.`
          : `${validatedVideos}/${plan.scenes.length} vidéos validées — tout se passe dans le canvas à droite.`}
      </p>
    </Bubble>
  );
}

function CollapsedHistory() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [open, setOpen] = useState(false);
  const brands = useBrandStore((s) => s.brands);
  const styles = useStyleStore((s) => s.styles);
  if (!currentProject) return null;
  const brand = brands.find((b) => b.id === currentProject.brandId);
  const style = styles.find((s) => s.id === currentProject.styleId);
  const status = currentProject.status;
  if (status === "brief") return null;

  return (
    <div className="mb-1">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 text-[11px] text-agent-t3 hover:text-agent-t2">
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Historique
      </button>
      {open && (
        <div className="mt-1.5 text-[11.5px] text-agent-t2 bg-agent-s2 border border-agent-bd rounded-md p-2.5 space-y-1">
          <div>Marque : {brand?.name ?? "—"}</div>
          <div>Style : {style?.name ?? "—"}</div>
          <div className="line-clamp-2">Brief : {currentProject.brief}</div>
        </div>
      )}
    </div>
  );
}

export function AgentChat({ onOpenProjectBrain }: { onOpenProjectBrain: () => void }) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const bottomRef = useRef<HTMLDivElement>(null);
  const status = currentProject?.status ?? "brief";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [status]);

  return (
    <div className="w-[380px] shrink-0 border-r border-agent-bd bg-agent-s1 flex flex-col h-full">
      <div className="h-11 shrink-0 border-b border-agent-bd flex items-center px-4 gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-agent-acc animate-pulse" />
        <span className="text-[12.5px] font-medium text-agent-t1">Agent</span>
        <span className="ml-auto text-[11px] text-agent-t3 uppercase tracking-wide">
          {status === "brief" ? "brief" : status === "brief_chat" ? "co-construction" : status === "analyzing" ? "analyse" : status === "plan_ready" ? "découpage" : status}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-3">
        <CollapsedHistory />
        {(!currentProject || status === "brief") && <StyleAndBriefTurn />}
        {currentProject && status === "brief_chat" && <CoConstructionTurn />}
        {currentProject && status === "analyzing" && <AnalyzingTurn />}
        {currentProject && status === "plan_ready" && <PlanSummaryTurn />}
        {currentProject && status === "characters" && <CharacterTurn />}
        {currentProject && status === "locations" && <LocationTurn />}
        {currentProject && (status === "frames" || status === "videos" || status === "export" || status === "completed") && <ProductionTurn />}
        <div ref={bottomRef} />
      </div>

      {currentProject && (
        <div className="h-10 shrink-0 border-t border-agent-bd flex items-center px-3.5">
          <button onClick={onOpenProjectBrain} className="text-[11.5px] text-agent-t2 hover:text-agent-t1 flex items-center gap-1.5">
            Project Brain
          </button>
        </div>
      )}
    </div>
  );
}
