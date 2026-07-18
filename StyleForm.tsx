"use client";

import { useState } from "react";
import { useStyleStore } from "@/store/styleStore";
import { ImageEngine, IMAGE_ENGINE_LABELS, Lang, VideoEngine, VIDEO_ENGINE_LABELS } from "@/types";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const ICON_OPTIONS = [
  "Sparkles", "Blocks", "User", "Hand", "Leaf", "Zap", "Camera", "Smartphone",
  "Tv", "Palette", "Film", "Shapes", "Wand2", "Star", "Flame",
].map((v) => ({ value: v, label: v }));

const IMAGE_ENGINE_OPTIONS = (Object.keys(IMAGE_ENGINE_LABELS) as ImageEngine[])
  .filter((e) => e !== "auto")
  .map((v) => ({ value: v, label: IMAGE_ENGINE_LABELS[v] }));

const VIDEO_ENGINE_OPTIONS = (Object.keys(VIDEO_ENGINE_LABELS) as VideoEngine[])
  .filter((e) => e !== "auto")
  .map((v) => ({ value: v, label: VIDEO_ENGINE_LABELS[v] }));

export function StyleForm({ onClose }: { onClose: () => void }) {
  const addCustomStyle = useStyleStore((s) => s.addCustomStyle);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Sparkles");
  const [shortDescription, setShortDescription] = useState("");
  const [positivePrompt, setPositivePrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [recommendedImageEngine, setRecommendedImageEngine] = useState<ImageEngine>("nano_banana");
  const [recommendedVideoEngine, setRecommendedVideoEngine] = useState<VideoEngine>("kling_3_0");
  const [bestFor, setBestFor] = useState<Lang[]>(["fr", "en"]);

  function toggleBestFor(lang: Lang) {
    setBestFor((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  }

  function handleSave() {
    if (!name.trim()) return;
    addCustomStyle({
      name,
      icon,
      shortDescription,
      positivePrompt,
      negativePrompt,
      recommendedImageEngine,
      recommendedVideoEngine,
      bestFor,
    });
    onClose();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nom du style</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex : Néon Cyberpunk" />
        </div>
        <div>
          <Label>Icône</Label>
          <Select value={icon} onChange={(e) => setIcon(e.target.value)} options={ICON_OPTIONS} />
        </div>
      </div>

      <div>
        <Label>Description courte</Label>
        <Input
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Décrit le style en une phrase"
        />
      </div>

      <div>
        <Label>Prompt positif système (caché, injecté automatiquement)</Label>
        <Textarea rows={3} value={positivePrompt} onChange={(e) => setPositivePrompt(e.target.value)} />
      </div>

      <div>
        <Label>Prompt négatif système (caché, injecté automatiquement)</Label>
        <Textarea rows={2} value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Modèle image recommandé</Label>
          <Select
            value={recommendedImageEngine}
            onChange={(e) => setRecommendedImageEngine(e.target.value as ImageEngine)}
            options={IMAGE_ENGINE_OPTIONS}
          />
        </div>
        <div>
          <Label>Modèle vidéo recommandé</Label>
          <Select
            value={recommendedVideoEngine}
            onChange={(e) => setRecommendedVideoEngine(e.target.value as VideoEngine)}
            options={VIDEO_ENGINE_OPTIONS}
          />
        </div>
      </div>

      <div>
        <Label>Meilleur pour</Label>
        <div className="flex gap-2">
          {(["fr", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => toggleBestFor(l)}
              className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
                bestFor.includes(l)
                  ? "bg-gold/10 border-gold/50 text-gold-light"
                  : "border-border text-ink-secondary"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Créer le style
        </Button>
      </div>
    </div>
  );
}
