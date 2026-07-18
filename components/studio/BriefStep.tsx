"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Wand2 } from "lucide-react";
import { useBrandStore } from "@/store/brandStore";
import { useStyleStore } from "@/store/styleStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useProjectStore } from "@/store/projectStore";
import { useTemplateStore } from "@/store/templateStore";
import { useLearningStore } from "@/store/learningStore";
import { ImageEngine, IMAGE_ENGINE_LABELS, Lang, VideoEngine, VIDEO_ENGINE_LABELS } from "@/types";
import { Label, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StyleCard } from "@/components/styles/StyleCard";
import { generateHooks, analyzeBrief } from "@/lib/claude";
import { buildLearningContext } from "@/lib/prompts";
import { estimateFrameCountForDuration, formatDuration } from "@/lib/utils";
import { autoRouteImageEngine, autoRouteVideoEngine } from "@/lib/fal";

const IMAGE_ENGINE_OPTIONS = (Object.keys(IMAGE_ENGINE_LABELS) as ImageEngine[]).map((v) => ({
  value: v,
  label: IMAGE_ENGINE_LABELS[v],
}));
const VIDEO_ENGINE_OPTIONS = (Object.keys(VIDEO_ENGINE_LABELS) as VideoEngine[]).map((v) => ({
  value: v,
  label: VIDEO_ENGINE_LABELS[v],
}));

/**
 * Le script est le SEUL input requis pour lancer l'analyse. Marque, style,
 * durée et moteurs sont des réglages optionnels avec des valeurs par défaut
 * automatiques — jamais bloquants avant l'étape d'analyse.
 */
export function BriefStep() {
  const brands = useBrandStore((s) => s.brands);
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const touchLastUsed = useBrandStore((s) => s.touchLastUsed);
  const styles = useStyleStore((s) => s.styles);
  const settings = useSettingsStore((s) => s.generationDefaults);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const advancedPrompts = useSettingsStore((s) => s.advancedPrompts);
  const initProject = useProjectStore((s) => s.initProject);
  const updateCurrentProject = useProjectStore((s) => s.updateCurrentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const pendingTemplate = useTemplateStore((s) => s.pendingTemplate);
  const clearPendingTemplate = useTemplateStore((s) => s.clearPendingTemplate);
  const learningEntries = useLearningStore((s) => s.entries);

  const [brandId, setBrandId] = useState(activeBrandId ?? brands[0]?.id ?? "");
  const [lang, setLang] = useState<Lang>(settings.defaultLang);
  const [styleId, setStyleId] = useState(settings.defaultStyleId ?? styles[0]?.id ?? "");
  const [duration, setDuration] = useState(pendingTemplate?.recommendedDuration ?? 60);
  const [imageEngine, setImageEngine] = useState<ImageEngine>(settings.imageEngine);
  const [videoEngine, setVideoEngine] = useState<VideoEngine>(settings.videoEngine);

  const [brief, setBrief] = useState(pendingTemplate?.structure ?? "");
  const [hooks, setHooks] = useState<string[]>([]);
  const [loadingHooks, setLoadingHooks] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (pendingTemplate) {
      clearPendingTemplate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La réhydratation de Zustand (persist) est asynchrone : les marques/styles
  // peuvent arriver après le premier rendu, donc on synchronise une fois disponibles.
  useEffect(() => {
    if (!brandId && (activeBrandId || brands.length > 0)) {
      setBrandId(activeBrandId ?? brands[0].id);
    }
  }, [brandId, activeBrandId, brands]);

  useEffect(() => {
    if (!styleId && styles.length > 0) {
      setStyleId(settings.defaultStyleId ?? styles[0].id);
    }
  }, [styleId, styles, settings.defaultStyleId]);

  const brand = brands.find((b) => b.id === brandId);
  const filteredStyles = [...styles].sort((a, b) => {
    const aMatch = a.bestFor.includes(lang) ? 0 : 1;
    const bMatch = b.bestFor.includes(lang) ? 0 : 1;
    return aMatch - bMatch;
  });
  const frameTarget = estimateFrameCountForDuration(duration);

  async function handleGenerateHooks() {
    setLoadingHooks(true);
    try {
      const result = await generateHooks({
        brand,
        lang,
        apiKey: apiKeys.claudeApiKey,
        systemPromptOverride: advancedPrompts.generateHooksSystemPrompt,
      });
      setHooks(result);
    } finally {
      setLoadingHooks(false);
    }
  }

  function applyHook(hook: string) {
    setBrief((prev) => (prev ? `${hook}\n\n${prev}` : hook));
  }

  async function handleAnalyze() {
    if (!brief.trim()) return;
    setAnalyzing(true);

    const style = styles.find((s) => s.id === styleId) ?? styles[0];
    const resolvedImageEngine =
      imageEngine === "auto" ? style.recommendedImageEngine ?? autoRouteImageEngine() : imageEngine;
    const resolvedVideoEngine =
      videoEngine === "auto" ? style.recommendedVideoEngine ?? autoRouteVideoEngine(lang) : videoEngine;

    const project = initProject({
      name: `${brand?.name ?? "Projet"} — ${new Date().toLocaleDateString("fr-FR")}`,
      brandId,
      styleId: style.id,
      lang,
      targetDuration: duration,
      imageEngine,
      videoEngine,
      templateSourceId: pendingTemplate?.id,
    });
    updateCurrentProject({ brief, referenceImages: [] });
    if (brandId) touchLastUsed(brandId);

    // Avec une clé Claude, on passe d'abord par la co-construction du brief
    // (Étape 0) — une conversation guidée, jamais de génération immédiate.
    // Sans clé, la conversation n'aurait aucune valeur (pas de vraie IA en
    // mode simulé) : on garde l'ancien flux direct vers l'analyse.
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
        style,
        lang,
        targetDuration: duration,
        motionIntensity: settings.motionIntensity,
        learningContext: buildLearningContext(learningEntries),
        apiKey: apiKeys.claudeApiKey,
        systemPromptOverride: advancedPrompts.analyzeBriefSystemPrompt,
        minSceneDurationSeconds: advancedPrompts.minSceneDurationSeconds,
        maxSceneDurationSeconds: advancedPrompts.maxSceneDurationSeconds,
      });
      updateCurrentProject({
        plan,
        imageEngine: resolvedImageEngine,
        videoEngine: resolvedVideoEngine,
        status: "plan_ready",
      });
      setStatus("plan_ready");
    } finally {
      setAnalyzing(false);
    }
    void project;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink mb-1">Nouveau projet</h1>
        <p className="text-sm text-ink-secondary">
          Colle ton script — c&apos;est le seul input nécessaire. Golddust Studio l&apos;analyse automatiquement :
          personnages, découpage en scènes, durées et cadrages sont détectés pour toi.
        </p>
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="mb-0">Script</Label>
          <Button variant="secondary" size="sm" onClick={handleGenerateHooks} disabled={loadingHooks}>
            <Sparkles className="w-3.5 h-3.5" /> {loadingHooks ? "Génération..." : "Générer des hooks"}
          </Button>
        </div>

        {hooks.length > 0 && (
          <div className="grid gap-2">
            {hooks.map((hook, i) => (
              <button
                key={i}
                onClick={() => applyHook(hook)}
                className="text-left text-sm bg-surface2 border border-border rounded p-3 hover:border-gold/50 transition-colors"
              >
                <span className="text-gold-light font-mono text-xs mr-2">#{i + 1}</span>
                {hook}
              </button>
            ))}
          </div>
        )}

        <Textarea
          rows={12}
          style={{ minHeight: 260 }}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Colle ton script complet — histoire, personnages, scènes, dialogues..."
          autoFocus
        />

        <div className="flex justify-end">
          <Button onClick={handleAnalyze} disabled={!brief.trim() || analyzing} size="lg">
            <Wand2 className="w-4 h-4" /> {analyzing ? "Analyse en cours..." : "Analyser le script"}
          </Button>
        </div>
      </Card>

      <div>
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-mono uppercase tracking-wide text-ink-secondary hover:text-ink py-1"
        >
          <span>Réglages (optionnel — valeurs par défaut appliquées automatiquement)</span>
          {settingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {settingsOpen && (
          <Card className="p-5 space-y-5 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Marque</Label>
                <Select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  options={
                    brands.length
                      ? brands.map((b) => ({ value: b.id, label: b.name }))
                      : [{ value: "", label: "Aucune marque — optionnel, créez-en une dans /brands" }]
                  }
                />
              </div>
              <div>
                <Label>Langue</Label>
                <Toggle
                  value={lang}
                  onChange={setLang}
                  options={[
                    { value: "fr", label: "Français" },
                    { value: "en", label: "English" },
                  ]}
                />
              </div>
            </div>

            <div>
              <Label>Style visuel</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {filteredStyles.map((style) => (
                  <div
                    key={style.id}
                    onClick={() => setStyleId(style.id)}
                    className={styleId === style.id ? "ring-2 ring-gold rounded-lg" : "rounded-lg"}
                  >
                    <StyleCard style={style} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Slider
                label="Durée cible"
                valueLabel={`${formatDuration(duration)} · cible ${frameTarget.min}-${frameTarget.max} frames`}
                min={40}
                max={180}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Moteur image (override)</Label>
                <Select
                  value={imageEngine}
                  onChange={(e) => setImageEngine(e.target.value as ImageEngine)}
                  options={IMAGE_ENGINE_OPTIONS}
                />
              </div>
              <div>
                <Label>Moteur vidéo (override)</Label>
                <Select
                  value={videoEngine}
                  onChange={(e) => setVideoEngine(e.target.value as VideoEngine)}
                  options={VIDEO_ENGINE_OPTIONS}
                />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
