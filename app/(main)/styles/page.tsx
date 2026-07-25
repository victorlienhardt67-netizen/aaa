"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { useStyleStore } from "@/store/styleStore";
import { ImageEngine, IMAGE_ENGINE_LABELS, StylePreset, VideoEngine, VIDEO_ENGINE_LABELS } from "@/types";
import { StyleCard } from "@/components/styles/StyleCard";
import { StyleForm } from "@/components/styles/StyleForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Label, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { fileToCompressedBase64 } from "@/lib/storage";

const IMAGE_ENGINE_OPTIONS = (Object.keys(IMAGE_ENGINE_LABELS) as ImageEngine[])
  .filter((e) => e !== "auto")
  .map((v) => ({ value: v, label: IMAGE_ENGINE_LABELS[v] }));

const VIDEO_ENGINE_OPTIONS = (Object.keys(VIDEO_ENGINE_LABELS) as VideoEngine[])
  .filter((e) => e !== "auto")
  .map((v) => ({ value: v, label: VIDEO_ENGINE_LABELS[v] }));

function StyleDetailForm({ style, onClose }: { style: StylePreset; onClose: () => void }) {
  const updateStyle = useStyleStore((s) => s.updateStyle);
  const deleteStyle = useStyleStore((s) => s.deleteStyle);

  const [photoPrompt, setPhotoPrompt] = useState(style.photoPrompt);
  const [videoPrompt, setVideoPrompt] = useState(style.videoPrompt);
  const [negativePrompt, setNegativePrompt] = useState(style.negativePrompt);
  const [recommendedImageEngine, setRecommendedImageEngine] = useState(style.recommendedImageEngine);
  const [recommendedVideoEngine, setRecommendedVideoEngine] = useState(style.recommendedVideoEngine);
  const [illustrationImageUrl, setIllustrationImageUrl] = useState(style.illustrationImageUrl);
  const [saved, setSaved] = useState(false);
  const illustrationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhotoPrompt(style.photoPrompt);
    setVideoPrompt(style.videoPrompt);
    setNegativePrompt(style.negativePrompt);
    setRecommendedImageEngine(style.recommendedImageEngine);
    setRecommendedVideoEngine(style.recommendedVideoEngine);
    setIllustrationImageUrl(style.illustrationImageUrl);
    setSaved(false);
  }, [style]);

  function handleSave() {
    updateStyle(style.id, { photoPrompt, videoPrompt, negativePrompt, recommendedImageEngine, recommendedVideoEngine, illustrationImageUrl });
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
        <Label>Prompt Photo (apparence/look — injecté dans les générations d&apos;images)</Label>
        <Textarea
          rows={4}
          value={photoPrompt}
          onChange={(e) => {
            setPhotoPrompt(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      <div>
        <Label>Prompt Vidéo (animation/mouvement spécifique à ce style — injecté dans les générations vidéo)</Label>
        <Textarea
          rows={3}
          value={videoPrompt}
          onChange={(e) => {
            setVideoPrompt(e.target.value);
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

      <div>
        <Label>Image d&apos;illustration (paysage)</Label>
        {illustrationImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={illustrationImageUrl} alt={style.name} className="w-full aspect-[16/9] object-cover rounded border border-border" />
        ) : (
          <button
            type="button"
            onClick={() => illustrationInputRef.current?.click()}
            className="w-full aspect-[16/9] flex flex-col items-center justify-center gap-1.5 rounded border border-dashed border-border text-ink-secondary hover:text-ink transition-colors"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-xs">Exemple visuel — {style.name}</span>
          </button>
        )}
        {illustrationImageUrl && (
          <button
            type="button"
            onClick={() => illustrationInputRef.current?.click()}
            className="mt-1.5 text-xs text-ink-secondary hover:text-ink"
          >
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
            if (f) {
              setIllustrationImageUrl(await fileToCompressedBase64(f));
              setSaved(false);
            }
            e.target.value = "";
          }}
        />
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
  const router = useRouter();
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
            Clique sur un style pour démarrer une production avec ce style — survole une carte pour
            ajuster ses prompts (icône crayon).
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Style custom
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {styles.map((style) => (
          <StyleCard
            key={style.id}
            style={style}
            onLaunch={() => router.push(`/studio?styleId=${style.id}`)}
            onEdit={() => setDetailId(style.id)}
          />
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
