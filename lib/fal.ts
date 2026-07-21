// Client fal.ai — Kling 3.0, Grok Video, Wan 2.6, Seedance 2.0 (vidéo) + Nano Banana (image)
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
    if (!statusRes.ok) throw new Error(statusData?.error ?? `Erreur statut fal.ai (${statusRes.status})`);

    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(`/api/fal/result?${resultParams.toString()}`, {
        headers: { "x-fal-key": apiKey },
      });
      const resultData = await resultRes.json();
      if (!resultRes.ok) throw new Error(resultData?.error ?? `Erreur résultat fal.ai (${resultRes.status})`);
      return resultData;
    }

    if (statusData.status === "FAILED" || statusData.status === "ERROR") {
      throw new Error(`Génération fal.ai échouée (statut ${statusData.status})`);
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
  if (!submitRes.ok) throw new Error(submitData?.error ?? `Erreur soumission fal.ai (${submitRes.status})`);

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
  if (!submitRes.ok) throw new Error(submitData?.error ?? `Erreur soumission fal.ai (${submitRes.status})`);

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
