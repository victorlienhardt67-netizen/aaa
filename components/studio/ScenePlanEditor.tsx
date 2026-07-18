"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Film,
  Mic,
  Minus,
  Package,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useBrandStore } from "@/store/brandStore";
import { useStyleStore } from "@/store/styleStore";
import { useSettingsStore } from "@/store/settingsStore";
import {
  CAMERA_MOVEMENT_LABELS,
  CameraMovement,
  FRAMING_LABELS,
  IMAGE_ENGINE_LABELS,
  Lang,
  Scene,
  VIDEO_ENGINE_LABELS,
} from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Label, Textarea, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { CameraPresetPicker } from "@/components/studio/CameraPresetPicker";
import { AVAILABLE_VOICES } from "@/lib/higgsfield";
import { estimateImageCost, estimateVideoCost } from "@/lib/mock";
import { estimateFrameCountForDuration, formatCost, formatDuration } from "@/lib/utils";

const CAMERA_OPTIONS = (Object.keys(CAMERA_MOVEMENT_LABELS) as CameraMovement[]).map((v) => ({
  value: v,
  label: CAMERA_MOVEMENT_LABELS[v],
}));

function SceneEditor({ scene }: { scene: Scene }) {
  const updateScene = useProjectStore((s) => s.updateScene);
  const [open, setOpen] = useState(scene.index === 1);
  const currentProject = useProjectStore((s) => s.currentProject);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const voicesForLang = AVAILABLE_VOICES.filter((v) => v.lang === (scene.dialogueLang ?? "fr"));

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs text-gold-light shrink-0">#{scene.index}</span>
          <span className="text-sm text-ink truncate">{scene.description}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge tone="neutral">{formatDuration(scene.durationSeconds)}</Badge>
          {scene.framing && <Badge tone="neutral">{FRAMING_LABELS[scene.framing]}</Badge>}
          {scene.hasProduct && (
            <Badge tone="gold">
              <Package className="w-3 h-3" /> Produit
            </Badge>
          )}
          {scene.characters.length > 0 && (
            <Badge tone="gold">
              <Users className="w-3 h-3" /> Perso.
            </Badge>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-ink-secondary" /> : <ChevronDown className="w-4 h-4 text-ink-secondary" />}
        </div>
      </button>

      {open && (
        <div className="p-4 pt-0 space-y-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <Label>Description courte</Label>
              <Textarea
                rows={2}
                value={scene.description}
                onChange={(e) => updateScene(scene.id, { description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Durée (s)</Label>
                <Input
                  type="number"
                  value={scene.durationSeconds}
                  onChange={(e) => updateScene(scene.id, { durationSeconds: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Caméra</Label>
                <Select
                  value={scene.cameraMovement}
                  onChange={(e) => updateScene(scene.id, { cameraMovement: e.target.value as CameraMovement })}
                  options={CAMERA_OPTIONS}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-xs text-ink-secondary bg-surface2 border border-border rounded px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scene.hasProduct}
                onChange={(e) => updateScene(scene.id, { hasProduct: e.target.checked })}
                className="accent-gold"
              />
              Produit présent {brand?.productPhotos[0] ? `(${brand.name})` : ""}
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-secondary bg-surface2 border border-border rounded px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scene.needsFrame}
                onChange={(e) => updateScene(scene.id, { needsFrame: e.target.checked })}
                className="accent-gold"
              />
              Frame de départ nécessaire
            </label>
          </div>

          {scene.characters.length > 0 && (
            <div>
              <Label>État du personnage dans cette scène (ex : avant, après, fatiguée, rayonnante)</Label>
              <Input
                value={scene.characterState ?? ""}
                onChange={(e) => updateScene(scene.id, { characterState: e.target.value || undefined })}
                placeholder="Laisser vide si un seul état existe"
              />
            </div>
          )}

          <div>
            <Label>Prompt image (éditable)</Label>
            <Textarea
              rows={2}
              value={scene.imagePrompt}
              onChange={(e) => updateScene(scene.id, { imagePrompt: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="mb-0">Prompt vidéo (éditable) — directives de mouvement</Label>
            </div>
            <Textarea
              rows={3}
              value={scene.videoPrompt}
              onChange={(e) => updateScene(scene.id, { videoPrompt: e.target.value })}
            />
            <CameraPresetPicker
              className="mt-2"
              onPick={(label) =>
                updateScene(scene.id, { videoPrompt: `${scene.videoPrompt} ${label}.` })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-start">
            <div>
              <Label>Langue du dialogue</Label>
              <Toggle
                value={scene.dialogueLang ?? "fr"}
                onChange={(v: Lang) => updateScene(scene.id, { dialogueLang: v })}
                options={[
                  { value: "fr", label: "FR" },
                  { value: "en", label: "EN" },
                ]}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> Type de voix (détecté automatiquement, modifiable)
              </Label>
              <Select
                value={scene.voiceType ?? "none"}
                onChange={(e) => {
                  const voiceType = e.target.value as "voiceover" | "lipsync" | "none";
                  updateScene(scene.id, {
                    voiceType,
                    voiceOver:
                      voiceType === "none"
                        ? scene.voiceOver
                        : {
                            enabled: true,
                            text: scene.voiceOver?.text ?? "",
                            voiceId: scene.voiceOver?.voiceId ?? voicesForLang[0]?.id,
                            lang: scene.dialogueLang ?? "fr",
                          },
                  });
                }}
                options={[
                  { value: "none", label: "Aucune voix" },
                  { value: "voiceover", label: "Voix off (hors-champ)" },
                  { value: "lipsync", label: "Lip-sync (personnage parle à l'écran)" },
                ]}
              />
              {scene.voiceType && scene.voiceType !== "none" && (
                <div className="space-y-2 mt-2">
                  <Textarea
                    rows={2}
                    placeholder="Texte du dialogue..."
                    value={scene.voiceOver?.text ?? ""}
                    onChange={(e) =>
                      updateScene(scene.id, {
                        voiceOver: {
                          enabled: true,
                          text: e.target.value,
                          voiceId: scene.voiceOver?.voiceId ?? voicesForLang[0]?.id,
                          lang: scene.dialogueLang ?? "fr",
                        },
                      })
                    }
                  />
                  <Select
                    value={scene.voiceOver?.voiceId ?? ""}
                    onChange={(e) =>
                      updateScene(scene.id, { voiceOver: { ...scene.voiceOver!, voiceId: e.target.value } })
                    }
                    options={voicesForLang.map((v) => ({ value: v.id, label: `${v.name} (${v.gender})` }))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function ScenePlanEditor() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const addSceneToBeat = useProjectStore((s) => s.addSceneToBeat);
  const removeScene = useProjectStore((s) => s.removeScene);
  const motionIntensity = useSettingsStore((s) => s.generationDefaults.motionIntensity);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const style = useStyleStore((s) => s.styles.find((st) => st.id === currentProject?.styleId));

  const plan = currentProject?.plan;
  if (!plan || !currentProject) return null;

  const imageEngine = currentProject.imageEngine;
  const videoEngine = currentProject.videoEngine;
  const framedScenes = plan.scenes.filter((s) => s.needsFrame);
  const totalDuration = plan.scenes.reduce((sum, s) => sum + s.durationSeconds, 0);
  const estimatedImageCost = framedScenes.length * estimateImageCost(imageEngine);
  const estimatedVideoCost = plan.scenes.reduce((sum, s) => sum + estimateVideoCost(videoEngine, s.durationSeconds), 0);
  const estimatedTotalCost = estimatedImageCost + estimatedVideoCost;
  const frameTarget = estimateFrameCountForDuration(currentProject.targetDuration);
  const frameCountOk = plan.scenes.length >= frameTarget.min && plan.scenes.length <= frameTarget.max;

  const beatGroups: { label: string; scenes: Scene[] }[] = [];
  for (const scene of plan.scenes) {
    const label = scene.beatLabel ?? "Frames";
    const group = beatGroups.find((g) => g.label === label);
    if (group) group.scenes.push(scene);
    else beatGroups.push({ label, scenes: [scene] });
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink mb-1">Plan de production</h1>
        <p className="text-sm text-ink-secondary">
          <span className={frameCountOk ? "" : "text-amber-400"}>
            {plan.scenes.length} frames détectées (cible {frameTarget.min}-{frameTarget.max})
          </span>{" "}
          · langue confirmée : {plan.detectedLang.toUpperCase()} · intensité de mouvement : {motionIntensity}
        </p>
      </div>

      {plan.briefAnalysis && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <h2 className="font-display font-bold text-sm text-ink">Analyse complète du brief</h2>
          </div>
          <p className="text-sm text-ink-secondary leading-relaxed">{plan.briefAnalysis}</p>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="font-display font-bold text-sm text-ink mb-4">
          Récapitulatif avant génération — tout savoir avant de lancer
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1">Marque · Style</p>
            <p className="text-sm text-ink">
              {brand?.name ?? "—"} · {style?.name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Durée totale vidéo
            </p>
            <p className="text-sm text-ink">{formatDuration(totalDuration)}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1 flex items-center gap-1">
              <Film className="w-3 h-3" /> Moteurs
            </p>
            <p className="text-sm text-ink">
              {IMAGE_ENGINE_LABELS[imageEngine]} · {VIDEO_ENGINE_LABELS[videoEngine]}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Coût estimé total
            </p>
            <p className="text-sm text-gold-light font-mono">{formatCost(estimatedTotalCost)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-ink-secondary bg-surface2 border border-border rounded p-3">
          <span>
            {framedScenes.length} frames à générer · {formatCost(estimatedImageCost)} estimé
          </span>
          <span>
            {plan.scenes.length} vidéos à générer · {formatCost(estimatedVideoCost)} estimé
          </span>
        </div>
        <p className="text-[11px] text-ink-secondary mt-3">
          Estimation avant génération — le coût réel peut varier légèrement selon les régénérations.
        </p>
      </Card>

      <div className="space-y-6">
        {beatGroups.map(({ label, scenes }) => {
          const beatDuration = scenes.reduce((sum, s) => sum + s.durationSeconds, 0);
          return (
            <div key={label} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs uppercase tracking-wide text-gold-light">{label}</h3>
                <span className="text-xs text-ink-secondary">
                  {scenes.length} frame{scenes.length > 1 ? "s" : ""} · {formatDuration(beatDuration)}
                </span>
              </div>
              <div className="space-y-3">
                {scenes.map((scene) => (
                  <SceneEditor key={scene.id} scene={scene} />
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => addSceneToBeat(label)}>
                  <Plus className="w-3.5 h-3.5" /> Ajouter une frame
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeScene(scenes[scenes.length - 1].id)}
                  disabled={scenes.length <= 1}
                >
                  <Minus className="w-3.5 h-3.5" /> Retirer la dernière
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={() => setStatus("characters")}>Valider le plan</Button>
      </div>
    </div>
  );
}
