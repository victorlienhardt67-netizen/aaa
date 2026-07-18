"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { useStyleStore } from "@/store/styleStore";
import { ImageEngine, IMAGE_ENGINE_LABELS, StylePreset, VideoEngine, VIDEO_ENGINE_LABELS } from "@/types";
import { StyleCard } from "@/components/styles/StyleCard";
import { StyleForm } from "@/components/styles/StyleForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Label, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const IMAGE_ENGINE_OPTIONS = (Object.keys(IMAGE_ENGINE_LABELS) as ImageEngine[])
  .filter((e) => e !== "auto")
  .map((v) => ({ value: v, label: IMAGE_ENGINE_LABELS[v] }));

const VIDEO_ENGINE_OPTIONS = (Object.keys(VIDEO_ENGINE_LABELS) as VideoEngine[])
  .filter((e) => e !== "auto")
  .map((v) => ({ value: v, label: VIDEO_ENGINE_LABELS[v] }));

function StyleDetailForm({ style, onClose }: { style: StylePreset; onClose: () => void }) {
  const updateStyle = useStyleStore((s) => s.updateStyle);
  const deleteStyle = useStyleStore((s) => s.deleteStyle);

  const [positivePrompt, setPositivePrompt] = useState(style.positivePrompt);
  const [negativePrompt, setNegativePrompt] = useState(style.negativePrompt);
  const [recommendedImageEngine, setRecommendedImageEngine] = useState(style.recommendedImageEngine);
  const [recommendedVideoEngine, setRecommendedVideoEngine] = useState(style.recommendedVideoEngine);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPositivePrompt(style.positivePrompt);
    setNegativePrompt(style.negativePrompt);
    setRecommendedImageEngine(style.recommendedImageEngine);
    setRecommendedVideoEngine(style.recommendedVideoEngine);
    setSaved(false);
  }, [style]);

  function handleSave() {
    updateStyle(style.id, { positivePrompt, negativePrompt, recommendedImageEngine, recommendedVideoEngine });
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-secondary">{style.shortDescription}</p>
      <div className="flex gap-2">
        {style.bestFor.includes("fr") && <Badge tone="gold">Best for FR</Badge>}
        {style.bestFor.includes("en") && <Badge tone="gold">Best for EN</Badge>}
        {style.isCustom && <Badge tone="neutral">Custom</Badge>}
      </div>

      <div>
        <Label>Prompt positif système (injecté automatiquement — modifiable pour ajuster le rendu)</Label>
        <Textarea
          rows={4}
          value={positivePrompt}
          onChange={(e) => {
            setPositivePrompt(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      <div>
        <Label>Prompt négatif système</Label>
        <Textarea
          rows={2}
          value={negativePrompt}
          onChange={(e) => {
            setNegativePrompt(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Moteur image recommandé</Label>
          <Select
            value={recommendedImageEngine}
            onChange={(e) => {
              setRecommendedImageEngine(e.target.value as ImageEngine);
              setSaved(false);
            }}
            options={IMAGE_ENGINE_OPTIONS}
          />
        </div>
        <div>
          <Label>Moteur vidéo recommandé</Label>
          <Select
            value={recommendedVideoEngine}
            onChange={(e) => {
              setRecommendedVideoEngine(e.target.value as VideoEngine);
              setSaved(false);
            }}
            options={VIDEO_ENGINE_OPTIONS}
          />
        </div>
      </div>

      <div className="aspect-[16/9] bg-surface2 border border-dashed border-border rounded flex items-center justify-center text-xs text-ink-secondary">
        Exemple visuel — {style.name}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        {style.isCustom ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              deleteStyle(style.id);
              onClose();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Supprimer ce style
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-emerald-400">Enregistré</span>}
          <Button size="sm" onClick={handleSave}>
            <Save className="w-3.5 h-3.5" /> Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function StylesPage() {
  const styles = useStyleStore((s) => s.styles);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const detail = styles.find((s) => s.id === detailId) ?? null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Bibliothèque de styles</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Presets de génération visuelle — clique sur un style pour ajuster ses prompts si le rendu ne
            convient pas.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Style custom
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {styles.map((style) => (
          <StyleCard key={style.id} style={style} onClick={() => setDetailId(style.id)} />
        ))}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Créer un style custom" size="lg">
        <StyleForm onClose={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={!!detail} onClose={() => setDetailId(null)} title={detail?.name} size="lg">
        {detail && <StyleDetailForm style={detail} onClose={() => setDetailId(null)} />}
      </Modal>
    </div>
  );
}
