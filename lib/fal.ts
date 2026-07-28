// Client fal.ai — Kling 3.0, Grok Video, Seedance 2.0 (vidéo) + Nano Banana (image)
// Kling 3.0, Grok Video et Nano Banana sont branchés sur la vraie API fal.ai
// (voir /api/fal/*). Aucun repli simulé : sans clé, ou en cas d'échec réel,
// l'appel lève une erreur affichée telle quelle dans l'UI (jamais de frame
// ou de vidéo simulée en remplacement d'un échec).

import { ImageEngine, VideoEngine } from "@/types";
import { estimateImageCost, estimateVideoCost, simulatedDelay } from "./mock";

export interface FalImageResult {
  url: string;
  engine: ImageEngine;
  costEstimate: number;
}

export interface FalVideoResult {
  url: string;
  engine: VideoEngine;
  costEstimate: number;
  durationSeconds: number;
}

const WIRED_VIDEO_ENGINES: VideoEngine[] = ["kling_3_0", "grok_video"];
const WIRED_IMAGE_ENGINES: ImageEngine[] = ["nano_banana"];
const MAX_POLL_ATTEMPTS = 60; // ~5 minutes à 5s d'intervalle

interface FalSubmitData {
  modelId: string;
  requestId: string;
  /** URLs exactes renvoyées par fal.ai à la soumission — toujours préférées à une
   * reconstruction depuis modelId, qui casse pour les modèles multi-segments
   * (ex: "fal-ai/nano-banana-pro/edit" renvoyait un 405 avant ce correctif). */
  statusUrl?: string;
  resultUrl?: string;
}

// Mots-clés utilisés pour transformer une erreur brute fal.ai (souvent un
// jargon technique en anglais, parfois même absent du statut) en un message
// exploitable par l'utilisateur, avec une action corrective concrète — sans
// jamais cacher le détail technique brut (utile en debug, et fal.ai peut
// changer sa formulation exacte sans préavis, donc on ne s'appuie jamais
// uniquement sur le message reformulé).
const NSFW_ERROR_PATTERN = /nsfw|not safe for work|sensitive content|content polic|content moderat|flagged|inappropriate|explicit content|sexual content/i;
const LENGTH_ERROR_PATTERN = /too long|too many characters|max(?:imum)?\s*length|character limit|exceeds?[^.]{0,30}(length|characters|limit)|string.{0,20}too long/i;

function extractFalErrorDetail(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof d.error === "string") parts.push(d.error);
  if (typeof d.detail === "string") parts.push(d.detail);
  if (Array.isArray(d.detail)) {
    parts.push(
      d.detail
        .map((item) => (typeof item === "string" ? item : (item as { msg?: string })?.msg ?? JSON.stringify(item)))
        .join("; ")
    );
  }
  if (Array.isArray(d.logs)) {
    parts.push(
      d.logs
        .map((log) => (typeof log === "string" ? log : (log as { message?: string })?.message ?? ""))
        .filter(Boolean)
        .join("; ")
    );
  }
  if (typeof d.message === "string") parts.push(d.message);
  return parts.filter(Boolean).join(" | ");
}

function friendlyFalError(rawDetail: string, fallback: string): string {
  const detail = rawDetail.trim();
  if (detail && NSFW_ERROR_PATTERN.test(detail)) {
    return `Vidéo refusée par la modération de contenu (jugée sensible/NSFW). Adoucis la description dans le champ "Ta vision pour la vidéo" (retire toute nudité, violence ou contenu suggestif) puis clique sur "Réessayer". Détail technique : ${detail.slice(0, 300)}`;
  }
  if (detail && LENGTH_ERROR_PATTERN.test(detail)) {
    return `Le prompt vidéo dépasse la limite de caractères de ce moteur. Raccourcis la description dans le champ "Ta vision pour la vidéo" (ou simplifie le brief de la scène) puis clique sur "Réessayer". Détail technique : ${detail.slice(0, 300)}`;
  }
  return detail ? `${fallback} — ${detail.slice(0, 300)}` : fallback;
}

async function pollFalJob(submitData: FalSubmitData, apiKey: string): Promise<Record<string, unknown>> {
  const { modelId, requestId, statusUrl, resultUrl } = submitData;
  const statusParams = new URLSearchParams({ modelId, requestId });
  if (statusUrl) statusParams.set("statusUrl", statusUrl);
  const resultParams = new URLSearchParams({ modelId, requestId });
  if (resultUrl) resultParams.set("resultUrl", resultUrl);

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await simulatedDelay(4500, 5500);
    const statusRes = await fetch(`/api/fal/status?${statusParams.toString()}`, {
      headers: { "x-fal-key": apiKey },
    });
    const statusData = await statusRes.json();
    if (!statusRes.ok) {
      throw new Error(friendlyFalError(extractFalErrorDetail(statusData), `Erreur statut fal.ai (${statusRes.status})`));
    }

    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(`/api/fal/result?${resultParams.toString()}`, {
        headers: { "x-fal-key": apiKey },
      });
      const resultData = await resultRes.json();
      if (!resultRes.ok) {
        throw new Error(friendlyFalError(extractFalErrorDetail(resultData), `Erreur résultat fal.ai (${resultRes.status})`));
      }
      return resultData;
    }

    if (statusData.status === "FAILED" || statusData.status === "ERROR") {
      const detail = extractFalErrorDetail(statusData);
      throw new Error(friendlyFalError(detail, `Génération fal.ai échouée (statut ${statusData.status})`));
    }
  }
  throw new Error("Délai d'attente dépassé pour la génération fal.ai");
}

/**
 * Génère une image. Si `referenceImageUrls` est fourni (ex: character sheet
 * validé), passe par la variante "edit" de Nano Banana pour garder le
 * personnage visuellement cohérent d'une frame à l'autre.
 *
 * `apiKey` est lu par l'appelant depuis le store de réglages à CHAQUE appel
 * (jamais mis en cache) — voir components/studio-agent/MediaCanvas.tsx.
 */
export async function falGenerateImage(
  prompt: string,
  engine: ImageEngine,
  apiKey?: string,
  referenceImageUrls?: string[]
): Promise<FalImageResult> {
  if (!apiKey) {
    throw new Error("Clé API fal.ai manquante — ajoute-la dans Réglages avant de générer une frame.");
  }
  const hasReference = !!referenceImageUrls && referenceImageUrls.length > 0;
  if (!WIRED_IMAGE_ENGINES.includes(engine) && !hasReference) {
    throw new Error(`Le moteur "${engine}" n'est pas encore branché sur l'API fal.ai réelle.`);
  }

  const submitRes = await fetch("/api/fal/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      apiKey,
      engine,
      prompt,
      kind: "image",
      imageUrls: referenceImageUrls,
    }),
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok) {
    throw new Error(friendlyFalError(extractFalErrorDetail(submitData), `Erreur soumission fal.ai (${submitRes.status})`));
  }

  const result = await pollFalJob(submitData, apiKey);
  const imageUrl = (result?.images as Array<{ url?: string }> | undefined)?.[0]?.url;
  if (!imageUrl) throw new Error("fal.ai n'a pas retourné d'URL d'image");

  return { url: imageUrl, engine, costEstimate: estimateImageCost(engine) };
}

export async function falGenerateVideo(
  prompt: string,
  frameUrl: string | undefined,
  engine: VideoEngine,
  durationSeconds: number,
  apiKey?: string
): Promise<FalVideoResult> {
  if (!apiKey) {
    throw new Error("Clé API fal.ai manquante — ajoute-la dans Réglages avant de générer une vidéo.");
  }
  if (!frameUrl) {
    throw new Error("Aucune frame validée pour cette scène — génère d'abord la frame.");
  }
  if (!WIRED_VIDEO_ENGINES.includes(engine)) {
    throw new Error(`Le moteur "${engine}" n'est pas encore branché sur l'API fal.ai réelle.`);
  }

  const submitRes = await fetch("/api/fal/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ apiKey, engine, prompt, imageUrl: frameUrl, durationSeconds, kind: "video" }),
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok) {
    throw new Error(friendlyFalError(extractFalErrorDetail(submitData), `Erreur soumission fal.ai (${submitRes.status})`));
  }

  const result = await pollFalJob(submitData, apiKey);
  const videoUrl = (result?.video as { url?: string } | undefined)?.url;
  if (!videoUrl) throw new Error("fal.ai n'a pas retourné d'URL vidéo");

  return { url: videoUrl, engine, costEstimate: estimateVideoCost(engine, durationSeconds), durationSeconds };
}

/** Routing automatique du moteur vidéo selon la langue du projet. */
export function autoRouteVideoEngine(lang: "fr" | "en"): VideoEngine {
  return lang === "en" ? "kling_3_0" : "grok_video";
}

export function autoRouteImageEngine(): ImageEngine {
  return "nano_banana";
}

export interface FalTranscriptWord {
  text: string;
  startSeconds: number;
  endSeconds: number;
}

export interface FalTranscriptionResult {
  text: string;
  words: FalTranscriptWord[];
}

/**
 * Transcrit un fichier audio (voix off) via Wizper (Whisper v3, fal.ai) avec
 * un timestamp par mot — sert à caler la durée de chaque scène sur le rythme
 * réel de la voix enregistrée (pauses, débit variable), plutôt qu'une
 * estimation par nombre de mots ÷ débit moyen.
 *
 * Le fichier est envoyé en multipart/form-data (jamais en base64 dans un
 * corps JSON) : un MP3 de plusieurs minutes dépasse vite la taille de requête
 * acceptée une fois encodé en base64 (~+33% de volume), ce qui provoquait une
 * erreur "Request Entity Too Large" avant ce correctif.
 */
export async function falTranscribeAudio(audioFile: File, apiKey?: string): Promise<FalTranscriptionResult> {
  if (!apiKey) {
    throw new Error("Clé API fal.ai manquante — ajoute-la dans Réglages pour transcrire la voix off.");
  }
  const formData = new FormData();
  formData.append("apiKey", apiKey);
  formData.append("audio", audioFile);
  const submitRes = await fetch("/api/fal/transcribe", {
    method: "POST",
    body: formData,
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok) throw new Error(submitData?.error ?? `Erreur soumission fal.ai (${submitRes.status})`);

  const result = await pollFalJob(submitData, apiKey);
  const rawChunks =
    (result?.chunks as Array<{ text?: string; timestamp?: [number, number] }> | undefined) ?? [];
  const words: FalTranscriptWord[] = rawChunks
    .filter((c): c is { text: string; timestamp: [number, number] } => !!c.text?.trim() && Array.isArray(c.timestamp) && c.timestamp.length === 2)
    .map((c) => ({ text: c.text.trim(), startSeconds: c.timestamp[0], endSeconds: c.timestamp[1] }));

  return { text: (result?.text as string) ?? "", words };
}
