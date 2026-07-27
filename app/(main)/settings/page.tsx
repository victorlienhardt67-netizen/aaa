"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, KeyRound, RotateCcw, Sparkles } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";
import { useStyleStore } from "@/store/styleStore";
import { useLearningStore } from "@/store/learningStore";
import {
  ImageEngine,
  IMAGE_ENGINE_LABELS,
  Lang,
  MotionIntensity,
  MOTION_INTENSITY_LABELS,
  VideoEngine,
  VIDEO_ENGINE_LABELS,
} from "@/types";
import { Card } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

const IMAGE_ENGINE_OPTIONS = (Object.keys(IMAGE_ENGINE_LABELS) as ImageEngine[]).map((v) => ({
  value: v,
  label: IMAGE_ENGINE_LABELS[v],
}));
const VIDEO_ENGINE_OPTIONS = (Object.keys(VIDEO_ENGINE_LABELS) as VideoEngine[]).map((v) => ({
  value: v,
  label: VIDEO_ENGINE_LABELS[v],
}));
const MOTION_LEVELS: MotionIntensity[] = ["doux", "equilibre", "dynamique", "extreme"];

function ApiKeyField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const setApiKeys = useSettingsStore((s) => s.setApiKeys);
  const generationDefaults = useSettingsStore((s) => s.generationDefaults);
  const setGenerationDefaults = useSettingsStore((s) => s.setGenerationDefaults);
  const advancedPrompts = useSettingsStore((s) => s.advancedPrompts);
  const setAdvancedPrompts = useSettingsStore((s) => s.setAdvancedPrompts);
  const resetAdvancedPrompts = useSettingsStore((s) => s.resetAdvancedPrompts);
  const styles = useStyleStore((s) => s.styles);
  const learningEntries = useLearningStore((s) => s.entries);
  const resetLearning = useLearningStore((s) => s.reset);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const motionIndex = MOTION_LEVELS.indexOf(generationDefaults.motionIntensity);

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink mb-1">Paramètres</h1>
        <p className="text-sm text-ink-secondary">
          Clés API, préférences de génération et journal d&apos;apprentissage — liés à ton compte, ils te suivent
          d&apos;un appareil à l&apos;autre.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-gold" />
          <h2 className="font-display font-bold text-sm text-ink">Clés API</h2>
        </div>
        <p className="text-xs text-ink-secondary">
          Propres à ton compte — jamais partagées avec les autres utilisateurs.
        </p>
        <ApiKeyField
          label="fal.ai API key"
          value={apiKeys.falApiKey}
          onChange={(v) => setApiKeys({ falApiKey: v })}
          placeholder="fal_..."
        />
        <ApiKeyField
          label="Higgsfield API key"
          value={apiKeys.higgsfieldApiKey}
          onChange={(v) => setApiKeys({ higgsfieldApiKey: v })}
          placeholder="hf_..."
        />
        <ApiKeyField
          label="Claude API key"
          value={apiKeys.claudeApiKey}
          onChange={(v) => setApiKeys({ claudeApiKey: v })}
          placeholder="sk-ant-..."
        />
        <ApiKeyField
          label="ElevenLabs API key"
          value={apiKeys.elevenLabsApiKey}
          onChange={(v) => setApiKeys({ elevenLabsApiKey: v })}
          placeholder="sk_..."
        />
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-display font-bold text-sm text-ink">Préférences de génération par défaut</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Moteur image par défaut</Label>
            <Select
              value={generationDefaults.imageEngine}
              onChange={(e) => setGenerationDefaults({ imageEngine: e.target.value as ImageEngine })}
              options={IMAGE_ENGINE_OPTIONS}
            />
          </div>
          <div>
            <Label>Moteur vidéo par défaut</Label>
            <Select
              value={generationDefaults.videoEngine}
              onChange={(e) => setGenerationDefaults({ videoEngine: e.target.value as VideoEngine })}
              options={VIDEO_ENGINE_OPTIONS}
            />
          </div>
          <div>
            <Label>Style par défaut</Label>
            <Select
              value={generationDefaults.defaultStyleId ?? ""}
              onChange={(e) => setGenerationDefaults({ defaultStyleId: e.target.value })}
              options={styles.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>
          <div>
            <Label>Langue par défaut</Label>
            <Toggle
              value={generationDefaults.defaultLang}
              onChange={(v: Lang) => setGenerationDefaults({ defaultLang: v })}
              options={[
                { value: "fr", label: "Français" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-display font-bold text-sm text-ink">Dynamisme vidéo</h2>
        <Slider
          label="Intensité des mouvements caméra"
          valueLabel={MOTION_INTENSITY_LABELS[generationDefaults.motionIntensity]}
          min={0}
          max={3}
          step={1}
          value={motionIndex}
          onChange={(e) => setGenerationDefaults({ motionIntensity: MOTION_LEVELS[Number(e.target.value)] })}
        />
        <p className="text-xs text-ink-secondary">
          Cette intensité est injectée automatiquement dans tous les prompts vidéo générés.
        </p>
      </Card>

      <Card className="p-5 space-y-4">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <h2 className="font-display font-bold text-sm text-ink">Prompts avancés (contrôle IA)</h2>
          </div>
          {advancedOpen ? (
            <ChevronUp className="w-4 h-4 text-ink-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-ink-secondary" />
          )}
        </button>
        <p className="text-xs text-ink-secondary">
          Contrôle total sur la manière dont l&apos;IA analyse le brief, découpe les scènes et génère les
          prompts vidéo — à ajuster en cas de problème, sans dépendre d&apos;une mise à jour du code.
        </p>

        {advancedOpen && (
          <div className="space-y-5 pt-2 border-t border-border">
            <div>
              <Label>Prompt système — Analyse de brief</Label>
              <Textarea
                rows={8}
                value={advancedPrompts.analyzeBriefSystemPrompt}
                onChange={(e) => setAdvancedPrompts({ analyzeBriefSystemPrompt: e.target.value })}
                className="font-mono text-xs"
              />
            </div>

            <div>
              <Label>Prompt système — Génération de hooks</Label>
              <Textarea
                rows={3}
                value={advancedPrompts.generateHooksSystemPrompt}
                onChange={(e) => setAdvancedPrompts({ generateHooksSystemPrompt: e.target.value })}
                className="font-mono text-xs"
              />
            </div>

            <div>
              <Label>Prompt système — Co-construction du brief (Étape 0)</Label>
              <Textarea
                rows={8}
                value={advancedPrompts.coConstructionSystemPrompt}
                onChange={(e) => setAdvancedPrompts({ coConstructionSystemPrompt: e.target.value })}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-ink-secondary mt-1">
                Contrôle la conversation guidée qui précède toute génération — structure en blocs, ton, règles de
                questionnement.
              </p>
            </div>

            <div>
              <Label>Règles vidéo obligatoires (une par ligne)</Label>
              <Textarea
                rows={5}
                value={advancedPrompts.mandatoryVideoRules}
                onChange={(e) => setAdvancedPrompts({ mandatoryVideoRules: e.target.value })}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-ink-secondary mt-1">
                Injectées automatiquement dans chaque prompt vidéo, en plus de l&apos;intensité de mouvement et
                de la note phonétique FR.
              </p>
            </div>

            <div>
              <Label>Règles image obligatoires (une par ligne)</Label>
              <Textarea
                rows={4}
                value={advancedPrompts.mandatoryImageRules}
                onChange={(e) => setAdvancedPrompts({ mandatoryImageRules: e.target.value })}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-ink-secondary mt-1">
                Injectées automatiquement dans chaque prompt de frame, avec le négatif du style et les rappels de
                fidélité aux images de référence (personnage/produit) quand elles sont fournies.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Durée min. par plan (s)</Label>
                <Input
                  type="number"
                  min={1}
                  value={advancedPrompts.minSceneDurationSeconds}
                  onChange={(e) => setAdvancedPrompts({ minSceneDurationSeconds: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Durée max. par plan (s)</Label>
                <Input
                  type="number"
                  min={1}
                  value={advancedPrompts.maxSceneDurationSeconds}
                  onChange={(e) => setAdvancedPrompts({ maxSceneDurationSeconds: Number(e.target.value) })}
                />
              </div>
            </div>
            <p className="text-[11px] text-ink-secondary -mt-2">
              Bornes utilisées pour détecter combien de plans découper depuis le script, afin que la vidéo
              reste dynamique.
            </p>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                size="sm"
                variant="danger"
                onClick={() => confirm("Réinitialiser tous les prompts avancés aux valeurs par défaut ?") && resetAdvancedPrompts()}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser aux valeurs par défaut
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-sm text-ink">Journal d&apos;apprentissage</h2>
          {learningEntries.length > 0 && (
            <Button size="sm" variant="danger" onClick={() => confirm("Réinitialiser le journal ?") && resetLearning()}>
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
            </Button>
          )}
        </div>
        <p className="text-xs text-ink-secondary">
          Retours qualité accumulés depuis les générations vidéo — injectés automatiquement dans les prochaines analyses.
        </p>
        {learningEntries.length === 0 ? (
          <p className="text-xs text-ink-secondary italic">Aucun retour enregistré pour le moment.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {learningEntries.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between bg-surface2 border border-border rounded p-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge tone="gold">{entry.engine}</Badge>
                    <span className="text-xs text-ink">{entry.reason}</span>
                  </div>
                  {entry.comment && <p className="text-[11px] text-ink-secondary truncate">{entry.comment}</p>}
                </div>
                <span className="text-[10px] font-mono text-ink-secondary shrink-0">{formatDate(entry.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
