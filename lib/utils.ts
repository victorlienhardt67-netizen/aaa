import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Clé composite pour identifier un character sheet par personnage + état
 * (ex: "asset123::avant" / "asset123::après"). Sans état, la clé est juste
 * l'id de l'asset (état par défaut unique).
 */
export function characterReferenceKey(assetId: string, state?: string): string {
  return state ? `${assetId}::${state}` : assetId;
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

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function estimateSceneCount(durationSeconds: number): number {
  // Une scène dure en moyenne 4 à 6 secondes
  return Math.max(4, Math.round(durationSeconds / 5));
}

/**
 * Détecte dans le script/brief combien de plans (frames de départ) sont
 * nécessaires pour que la vidéo reste dynamique, plutôt que de se baser
 * uniquement sur la durée cible.
 *
 * - Compte les "beats" narratifs (phrases/idées) présents dans le brief.
 * - Borne le résultat pour qu'aucun plan ne dépasse ~7s (sinon ça devient
 *   statique) ni ne descende sous ~3s (sinon le montage devient illisible).
 */
export function estimateSceneCountFromBrief(
  brief: string,
  targetDurationSeconds: number,
  minSceneDuration = 3,
  maxSceneDuration = 7
): number {
  const beats = brief
    .split(/[.!?\n]+/)
    .map((b) => b.trim())
    .filter((b) => b.length > 8);
  const beatsCount = beats.length;

  const lowerBound = Math.max(4, Math.ceil(targetDurationSeconds / maxSceneDuration));
  const upperBound = Math.max(lowerBound, Math.floor(targetDurationSeconds / minSceneDuration));

  if (beatsCount >= lowerBound && beatsCount <= upperBound) return beatsCount;
  return Math.min(Math.max(beatsCount, lowerBound), upperBound);
}

let idCounter = 0;
export function generateId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
