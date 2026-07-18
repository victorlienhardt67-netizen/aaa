"use client";

import { Brand, BRAND_TONE_LABELS } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { initials, formatDate } from "@/lib/utils";
import { ImageIcon, Users } from "lucide-react";

export function BrandCard({ brand, onClick }: { brand: Brand; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="p-5 cursor-pointer hover:border-gold/50 transition-colors group"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center font-display font-bold text-lg text-background"
          style={{ backgroundColor: brand.colors.primary || "#C9A84C" }}
        >
          {initials(brand.name)}
        </div>
        <Badge tone="gold">{brand.defaultLang.toUpperCase()}</Badge>
      </div>

      <h3 className="font-display font-bold text-ink mb-1 group-hover:text-gold-light transition-colors">
        {brand.name}
      </h3>
      <p className="text-xs text-ink-secondary mb-4">{BRAND_TONE_LABELS[brand.tone]}</p>

      <div className="flex items-center gap-4 text-xs text-ink-secondary font-mono">
        <span className="flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5" /> {brand.productPhotos.length}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> {brand.characterPhotos.length}
        </span>
      </div>

      <div className="mt-4 pt-3 border-t border-border text-[11px] text-ink-secondary">
        {brand.lastUsedAt ? `Utilisée le ${formatDate(brand.lastUsedAt)}` : "Jamais utilisée"}
      </div>
    </Card>
  );
}
