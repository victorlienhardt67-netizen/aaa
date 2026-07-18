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

let idCounter = 0;
export function generateId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
