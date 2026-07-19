"use client";

import { Download } from "lucide-react";
import { downloadImage } from "@/lib/utils";

/**
 * Petit bouton discret affiché sur TOUTE image du SaaS (frame de départ,
 * fiche casting, proposition, variante physique) — clic = téléchargement
 * immédiat en PNG/JPG, jamais de popup de confirmation.
 */
export function ImageDownloadButton({ url, filename }: { url: string; filename: string }) {
  return (
    <button
      type="button"
      title="Télécharger l'image"
      onClick={(e) => {
        e.stopPropagation();
        void downloadImage(url, filename);
      }}
      className="absolute top-1.5 right-1.5 p-1 rounded bg-black/50 text-white hover:bg-black/70 transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
    </button>
  );
}
