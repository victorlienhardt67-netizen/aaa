import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m <= 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatCost(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Slug stable utilisé comme identifiant de personnage quand aucune photo n'est fournie. */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "personnage"
  );
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/**
 * Cible de nombre de frames total pour la vidéo, interpolée linéairement
 * entre les repères du cahier des charges : 18-22 frames pour 1 min,
 * 28-35 frames pour 2 min. Sert de guide pour le mode simulé et l'indicateur
 * affiché à l'utilisateur — Claude vise directement cette fourchette en mode API réel.
 */
export function estimateFrameCountForDuration(targetDurationSeconds: number): { min: number; max: number } {
  const minutes = targetDurationSeconds / 60;
  const min = Math.round(18 + (minutes - 1) * ((28 - 18) / (2 - 1)));
  const max = Math.round(22 + (minutes - 1) * ((35 - 22) / (2 - 1)));
  return { min: Math.max(4, min), max: Math.max(Math.max(4, min) + 1, max) };
}

let idCounter = 0;
export function generateId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
