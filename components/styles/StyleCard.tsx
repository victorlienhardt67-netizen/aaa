"use client";

import * as Icons from "lucide-react";
import { LucideIcon, Pencil, Sparkles } from "lucide-react";
import { StylePreset, IMAGE_ENGINE_LABELS, VIDEO_ENGINE_LABELS } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function StyleCard({
  style,
  onLaunch,
  onEdit,
}: {
  style: StylePreset;
  /** Corps de la carte cliqué — lance une nouvelle production avec ce style présélectionné. */
  onLaunch?: () => void;
  /** Icône crayon (visible au survol) — ouvre l'édition des prompts sans quitter la page. */
  onEdit?: () => void;
}) {
  const Icon = ((Icons as unknown as Record<string, LucideIcon>)[style.icon] ?? Sparkles) as LucideIcon;

  return (
    <Card
      onClick={onLaunch}
      className="p-0 overflow-hidden cursor-pointer hover:border-gold/50 transition-colors group"
    >
      <div className="aspect-[16/10] bg-surface2 border-b border-border flex items-center justify-center relative overflow-hidden">
        {style.illustrationImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={style.illustrationImageUrl} alt={style.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-gold/30 via-transparent to-transparent" />
            <Icon className="w-9 h-9 text-gold group-hover:text-gold-light transition-colors" />
          </>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {style.bestFor.includes("fr") && <Badge tone="gold">Best FR</Badge>}
          {style.bestFor.includes("en") && <Badge tone="gold">Best EN</Badge>}
        </div>
        {style.isCustom && (
          <div className="absolute top-2 left-2">
            <Badge tone="neutral">Custom</Badge>
          </div>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Modifier les prompts"
            className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white/80 opacity-0 group-hover:opacity-100 hover:!text-gold-light hover:!bg-black/80 transition-opacity"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-bold text-sm text-ink mb-1 group-hover:text-gold-light transition-colors">
          {style.name}
        </h3>
        <p className="text-xs text-ink-secondary mb-3 line-clamp-2">{style.shortDescription}</p>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
          <Badge tone="neutral">{IMAGE_ENGINE_LABELS[style.recommendedImageEngine]}</Badge>
          <Badge tone="neutral">{VIDEO_ENGINE_LABELS[style.recommendedVideoEngine]}</Badge>
        </div>
      </div>
    </Card>
  );
}
