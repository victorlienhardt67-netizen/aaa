"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Mic, Package, Users } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useBrandStore } from "@/store/brandStore";
import { useSettingsStore } from "@/store/settingsStore";
import { CAMERA_MOVEMENT_LABELS, CameraMovement, Lang, Scene } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Label, Textarea, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { CameraPresetPicker } from "@/components/studio/CameraPresetPicker";
import { AVAILABLE_VOICES } from "@/lib/higgsfield";
import { formatDuration } from "@/lib/utils";

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
              <label className="flex items-center gap-2 text-xs text-ink-secondary mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!scene.voiceOver?.enabled}
                  onChange={(e) =>
                    updateScene(scene.id, {
                      voiceOver: {
                        enabled: e.target.checked,
                        text: scene.voiceOver?.text ?? "",
                        voiceId: scene.voiceOver?.voiceId ?? voicesForLang[0]?.id,
                        lang: scene.dialogueLang ?? "fr",
                      },
                    })
                  }
                  className="accent-gold"
                />
                <Mic className="w-3.5 h-3.5" /> Ajouter une voix off
              </label>
              {scene.voiceOver?.enabled && (
                <div className="space-y-2">
                  <Textarea
                    rows={2}
                    placeholder="Texte du dialogue..."
                    value={scene.voiceOver.text}
                    onChange={(e) =>
                      updateScene(scene.id, { voiceOver: { ...scene.voiceOver!, text: e.target.value } })
                    }
                  />
                  <Select
                    value={scene.voiceOver.voiceId ?? ""}
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
  const motionIntensity = useSettingsStore((s) => s.generationDefaults.motionIntensity);

  const plan = currentProject?.plan;
  if (!plan) return null;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink mb-1">Plan de production</h1>
        <p className="text-sm text-ink-secondary">
          {plan.scenes.length} scènes détectées · langue confirmée : {plan.detectedLang.toUpperCase()} · intensité
          de mouvement : {motionIntensity}
        </p>
      </div>

      <div className="space-y-3">
        {plan.scenes.map((scene) => (
          <SceneEditor key={scene.id} scene={scene} />
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={() => setStatus("frames")}>Valider le plan</Button>
      </div>
    </div>
  );
}
