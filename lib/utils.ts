import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Un personnage = une seule fiche de référence — la clé est directement
 * l'assetId, jamais de variante composite (plus de dérive possible vers
 * plusieurs fiches pour un même personnage).
 */
export function characterReferenceKey(assetId: string): string {
  return assetId;
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
 * Cible de nombre de frames total pour la vidéo, calculée pour obtenir une
 * cadence moyenne d'une nouvelle frame toutes les ~5 secondes (c'est ce
 * changement de plan régulier qui rend la vidéo dynamique). Sert de guide
 * pour le mode simulé et l'indicateur affiché à l'utilisateur — Claude vise
 * directement cette fourchette en mode API réel.
 */
export function estimateFrameCountForDuration(targetDurationSeconds: number): { min: number; max: number } {
  const target = targetDurationSeconds / 5;
  const min = Math.max(4, Math.round(target * 0.85));
  const max = Math.max(min + 1, Math.round(target * 1.15));
  return { min, max };
}

/**
 * Durée de clip vidéo calculée depuis le nombre de mots du dialogue, à raison
 * de 2,5 mots/seconde — pour toujours fixer explicitement la durée envoyée au
 * modèle vidéo (jamais le laisser improviser un rythme de voix). Arrondie à
 * la seconde supérieure, avec un minimum de 3s même pour un texte très court.
 */
export function estimateDurationFromWordCount(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 3;
  return Math.max(3, Math.ceil(wordCount / 2.5));
}

/**
 * Aligne chaque scène ayant une voix off sur des timestamps mot-par-mot réels
 * (transcription Whisper/Wizper du fichier audio), en supposant que les mots
 * de chaque scène apparaissent dans le même ordre dans le fichier audio que
 * dans le texte du script — hypothèse raisonnable puisque la voix off est
 * censée être l'enregistrement de ce même script, mais qui reste une
 * heuristique (pas un alignement sémantique) : une transcription imparfaite
 * ou un texte de scène qui diverge du script réellement dit peut décaler
 * légèrement l'alignement des scènes suivantes.
 */
export function alignScenesToTranscriptWords<T extends { id: string; voiceOver?: { text: string } }>(
  scenes: T[],
  words: { text: string; startSeconds: number; endSeconds: number }[]
): { sceneId: string; startSeconds: number; endSeconds: number }[] {
  // Étape 1 — bornes brutes : premier/dernier mot réellement prononcé de
  // chaque scène (alignement séquentiel par nombre de mots).
  const raw: { sceneId: string; firstWordStart: number; lastWordEnd: number }[] = [];
  let cursor = 0;
  for (const scene of scenes) {
    const voText = scene.voiceOver?.text?.trim();
    if (!voText) continue;
    const sceneWordCount = voText.split(/\s+/).filter(Boolean).length;
    const consumed = words.slice(cursor, cursor + sceneWordCount);
    if (consumed.length === 0) continue;
    raw.push({
      sceneId: scene.id,
      firstWordStart: consumed[0].startSeconds,
      lastWordEnd: consumed[consumed.length - 1].endSeconds,
    });
    cursor += sceneWordCount;
  }

  // Étape 2 — couverture continue de la timeline : les silences/respirations
  // entre deux phrases sont attribués à la scène EN COURS (le plan reste à
  // l'écran pendant le blanc, jusqu'au début de la phrase suivante), et le
  // silence d'intro est attribué à la première scène. Sans ça, les blancs
  // n'appartenaient à personne : la somme des durées était inférieure à la
  // durée réelle de l'audio et tout se décalait progressivement au montage.
  return raw.map((r, i) => ({
    sceneId: r.sceneId,
    startSeconds: i === 0 ? 0 : r.firstWordStart,
    endSeconds: i < raw.length - 1 ? raw[i + 1].firstWordStart : r.lastWordEnd,
  }));
}

/**
 * Exécute `fn` sur chaque élément avec au maximum `limit` appels simultanés —
 * évite de saturer la file d'attente fal.ai quand on génère beaucoup de
 * frames en parallèle (ex: "Générer toutes les frames" sur un plan de 30 plans).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Télécharge une image (URL distante ou data URL) directement dans le
 * dossier téléchargements de l'utilisateur — sans popup ni confirmation.
 * Repli sur un nouvel onglet si le fetch échoue (ex: CORS bloqué par l'hébergeur).
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank");
  }
}

let idCounter = 0;
export function generateId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
