"use client";

import { useEffect, useState } from "react";
import { Wand2, Sparkles, X } from "lucide-react";
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
import { Dropzone } from "@/components/ui/Dropzone";
import { StyleCard } from "@/components/styles/StyleCard";
import { generateHooks, analyzeBrief } from "@/lib/claude";
import { buildLearningContext } from "@/lib/prompts";
import { estimateSceneCountFromBrief, formatDuration } from "@/lib/utils";
import { autoRouteImageEngine, autoRouteVideoEngine } from "@/lib/fal";

const IMAGE_ENGINE_OPTIONS = (Object.keys(IMAGE_ENGINE_LABELS) as ImageEngine[]).map((v) => ({
  value: v,
  label: IMAGE_ENGINE_LABELS[v],
}));
const VIDEO_ENGINE_OPTIONS = (Object.keys(VIDEO_ENGINE_LABELS) as VideoEngine[]).map((v) => ({
  value: v,
  label: VIDEO_ENGINE_LABELS[v],
}));

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
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [hooks, setHooks] = useState<string[]>([]);
  const [loadingHooks, setLoadingHooks] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

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
  const sceneEstimate = estimateSceneCountFromBrief(
    brief,
    duration,
    advancedPrompts.minSceneDurationSeconds,
    advancedPrompts.maxSceneDurationSeconds
  );

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
    updateCurrentProject({ brief, referenceImages });
    setStatus("analyzing");
    if (brandId) touchLastUsed(brandId);

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
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink mb-1">Nouveau projet</h1>
        <p className="text-sm text-ink-secondary">
          Configurez le projet puis décrivez votre vidéo — Golddust Studio générera le plan de production.
        </p>
      </div>

      {/* Étape 1 — Configuration */}
      <section className="space-y-5">
        <h2 className="font-mono text-xs uppercase tracking-wide text-gold-light">Étape 1 · Configuration</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Marque</Label>
            <Select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              options={
                brands.length
                  ? brands.map((b) => ({ value: b.id, label: b.name }))
                  : [{ value: "", label: "Aucune marque — créez-en une dans /brands" }]
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
                className={
                  styleId === style.id ? "ring-2 ring-gold rounded-lg" : "rounded-lg"
                }
              >
                <StyleCard style={style} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Slider
            label="Durée cible"
            valueLabel={`${formatDuration(duration)} · ~${sceneEstimate} plans${
              brief.trim().length > 0 ? " (détecté depuis le script)" : ""
            }`}
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
      </section>

      {/* Étape 2 — Brief */}
      <section className="space-y-4 pt-4 border-t border-border">
        <h2 className="font-mono text-xs uppercase tracking-wide text-gold-light">Étape 2 · Brief</h2>

        <div className="flex items-center justify-between">
          <Label className="mb-0">Décris ta vidéo</Label>
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
          rows={8}
          style={{ minHeight: 200 }}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Décris ta vidéo — histoire, ambiance, messages clés, personnages, scènes..."
        />

        <div>
          <Label>Images de référence (optionnel)</Label>
          <Dropzone
            onFiles={(files) => setReferenceImages((prev) => [...prev, ...files])}
            hint="En complément des photos produit de la marque"
          />
          {referenceImages.length > 0 && (
            <div className="grid grid-cols-6 gap-2 mt-2">
              {referenceImages.map((url, i) => (
                <div key={i} className="relative aspect-[9/16] rounded overflow-hidden bg-surface2 border border-border group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="ref" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setReferenceImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-black/70 rounded p-0.5 opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleAnalyze} disabled={!brief.trim() || analyzing || !brandId}>
            <Wand2 className="w-4 h-4" /> {analyzing ? "Analyse en cours..." : "Analyser le brief"}
          </Button>
        </div>
      </section>
    </div>
  );
}
