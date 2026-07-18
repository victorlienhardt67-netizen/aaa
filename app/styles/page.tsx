"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStyleStore } from "@/store/styleStore";
import { StylePreset } from "@/types";
import { StyleCard } from "@/components/styles/StyleCard";
import { StyleForm } from "@/components/styles/StyleForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

export default function StylesPage() {
  const styles = useStyleStore((s) => s.styles);
  const deleteStyle = useStyleStore((s) => s.deleteStyle);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<StylePreset | null>(null);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Bibliothèque de styles</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Presets de génération visuelle — prompts systèmes injectés automatiquement.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Style custom
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {styles.map((style) => (
          <StyleCard key={style.id} style={style} onClick={() => setDetail(style)} />
        ))}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Créer un style custom" size="lg">
        <StyleForm onClose={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} size="lg">
        {detail && (
          <div className="space-y-4">
            <p className="text-sm text-ink-secondary">{detail.shortDescription}</p>
            <div className="flex gap-2">
              {detail.bestFor.includes("fr") && <Badge tone="gold">Best for FR</Badge>}
              {detail.bestFor.includes("en") && <Badge tone="gold">Best for EN</Badge>}
              {detail.isCustom && <Badge tone="neutral">Custom</Badge>}
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-ink-secondary mb-1">Prompt positif système</p>
              <p className="text-sm text-ink bg-surface2 border border-border rounded p-3">
                {detail.positivePrompt}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-ink-secondary mb-1">Prompt négatif système</p>
              <p className="text-sm text-ink bg-surface2 border border-border rounded p-3">
                {detail.negativePrompt}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-surface2 border border-border rounded p-3">
                <p className="text-xs font-mono uppercase text-ink-secondary mb-1">Moteur image</p>
                {detail.recommendedImageEngine}
              </div>
              <div className="bg-surface2 border border-border rounded p-3">
                <p className="text-xs font-mono uppercase text-ink-secondary mb-1">Moteur vidéo</p>
                {detail.recommendedVideoEngine}
              </div>
            </div>
            <div className="aspect-[16/9] bg-surface2 border border-dashed border-border rounded flex items-center justify-center text-xs text-ink-secondary">
              Exemple visuel — {detail.name}
            </div>
            {detail.isCustom && (
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    deleteStyle(detail.id);
                    setDetail(null);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer ce style
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
