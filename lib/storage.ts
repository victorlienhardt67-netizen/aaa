// Helpers localStorage — aucune donnée n'est envoyée à un serveur.

import type { StateStorage } from "zustand/middleware";

/**
 * Adaptateur localStorage pour zustand/persist qui absorbe silencieusement
 * une QuotaExceededError au lieu de la laisser remonter. Par défaut, persist
 * appelle localStorage.setItem sans filet — un seul dépassement de quota (ex.
 * beaucoup d'images/projets accumulés) plante alors TOUT l'arbre React au
 * prochain rendu (exception non interceptée), pas seulement l'écriture
 * concernée. Utilisé par tous les stores persistés (styles, projets, marques,
 * templates, settings, learning).
 */
export const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(name, value);
    } catch (e) {
      console.error(`Échec de sauvegarde localStorage (${name}) :`, e);
    }
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignoré
    }
  },
};

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota dépassé ou stockage indisponible — ignoré silencieusement
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Comme fileToBase64, mais redimensionne et recompresse en JPEG avant
 * l'encodage — une photo brute (souvent plusieurs Mo) peut à elle seule
 * remplir le quota localStorage (~5-10 Mo/origine) au bout de 2-3 images,
 * faisant échouer silencieusement toutes les sauvegardes suivantes. Réservé
 * aux images purement illustratives (jamais envoyées aux moteurs de
 * génération) — ne pas utiliser pour des références produit/personnage où la
 * fidélité visuelle compte.
 */
export function fileToCompressedBase64(
  file: File,
  opts: { maxWidth?: number; quality?: number } = {}
): Promise<string> {
  const { maxWidth = 960, quality = 0.82 } = opts;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D non supporté"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de lire l'image"));
    };
    img.src = objectUrl;
  });
}

export const STORAGE_KEYS = {
  brands: "golddust:brands",
  activeBrandId: "golddust:activeBrandId",
  styles: "golddust:styles",
  projects: "golddust:projects",
  currentProject: "golddust:currentProject",
  templates: "golddust:templates",
  settings: "golddust:settings",
  learning: "golddust:learning",
} as const;
