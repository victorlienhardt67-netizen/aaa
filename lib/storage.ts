// Helpers localStorage — aucune donnée n'est envoyée à un serveur.

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
