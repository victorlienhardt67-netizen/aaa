// Client fal.ai — Kling 3.0, Grok Video, Wan 2.6, Seedance 2.0 (vidéo) + Nano Banana (image)
// Kling 3.0, Grok Video et Nano Banana sont branchés sur la vraie API fal.ai
// (voir /api/fal/*) quand une clé est fournie. Wan 2.6 et Seedance 2.0 restent
// simulés tant que leur schéma exact n'est pas confirmé. En cas d'erreur ou
// d'absence de clé, repli automatique sur des données mockées réalistes.

import { ImageEngine, VideoEngine } from "@/types";
import { estimateImageCost, estimateVideoCost, generatePlaceholderFrame, generatePlaceholderVideoUrl, simulatedDelay } from "./mock";

export interface FalImageResult {
  url: string;
  engine: ImageEngine;
  costEstimate: number;
  /** true si `url` est une image simulée (pas de clé fournie, ou appel réel échoué). */
  isMock?: boolean;
  /** Présent uniquement si une clé était fournie mais que l'appel réel a échoué (jamais pour une simple absence de clé). */
  errorMessage?: string;
}

export interface FalVideoResult {
  url: string;
  engine: VideoEngine;
  costEstimate: number;
  durationSeconds: number;
  isMock?: boolean;
  errorMessage?: string;
}

const WIRED_VIDEO_ENGINES: VideoEngine[] = ["kling_3_0", "grok_video"];
const WIRED_IMAGE_ENGINES: ImageEngine[] = ["nano_banana"];
const MAX_POLL_ATTEMPTS = 60; // ~5 minutes à 5s d'intervalle

async function pollFalJob(modelId: string, requestId: string, apiKey: string): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await simulatedDelay(4500, 5500);
    const statusRes = await fetch(
      `/api/fal/status?modelId=${encodeURIComponent(modelId)}&requestId=${encodeURIComponent(requestId)}`,
      { headers: { "x-fal-key": apiKey } }
    );
    const statusData = await statusRes.json();
    if (!statusRes.ok) throw new Error(statusData?.error ?? `Erreur statut fal.ai (${statusRes.status})`);

    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(
        `/api/fal/result?modelId=${encodeURIComponent(modelId)}&requestId=${encodeURIComponent(requestId)}`,
        { headers: { "x-fal-key": apiKey } }
      );
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
 */
export async function falGenerateImage(
  prompt: string,
  engine: ImageEngine,
  apiKey?: string,
  referenceImageUrls?: string[]
): Promise<FalImageResult> {
  if (apiKey && (WIRED_IMAGE_ENGINES.includes(engine) || (referenceImageUrls && referenceImageUrls.length > 0))) {
    try {
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

      const result = await pollFalJob(submitData.modelId, submitData.requestId, apiKey);
      const imageUrl = (result?.images as Array<{ url?: string }> | undefined)?.[0]?.url;
      if (!imageUrl) throw new Error("fal.ai n'a pas retourné d'URL d'image");

      return { url: imageUrl, engine, costEstimate: estimateImageCost(engine) };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      console.error("Appel fal.ai (image) échoué, repli sur le mode simulé :", e);
      await simulatedDelay(1200, 2600);
      return {
        url: generatePlaceholderFrame(prompt, `${engine} · fal.ai`),
        engine,
        costEstimate: estimateImageCost(engine),
        isMock: true,
        errorMessage: message,
      };
    }
  }

  await simulatedDelay(1200, 2600);
  return {
    url: generatePlaceholderFrame(prompt, `${engine} · fal.ai`),
    engine,
    costEstimate: estimateImageCost(engine),
    isMock: true,
  };
}

export async function falGenerateVideo(
  prompt: string,
  frameUrl: string | undefined,
  engine: VideoEngine,
  durationSeconds: number,
  apiKey?: string
): Promise<FalVideoResult> {
  if (apiKey && frameUrl && WIRED_VIDEO_ENGINES.includes(engine)) {
    try {
      const submitRes = await fetch("/api/fal/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey, engine, prompt, imageUrl: frameUrl, durationSeconds, kind: "video" }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData?.error ?? `Erreur soumission fal.ai (${submitRes.status})`);

      const result = await pollFalJob(submitData.modelId, submitData.requestId, apiKey);
      const videoUrl = (result?.video as { url?: string } | undefined)?.url;
      if (!videoUrl) throw new Error("fal.ai n'a pas retourné d'URL vidéo");

      return { url: videoUrl, engine, costEstimate: estimateVideoCost(engine, durationSeconds), durationSeconds };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      console.error("Appel fal.ai (vidéo) échoué, repli sur le mode simulé :", e);
      await simulatedDelay(2500, 5000);
      return {
        url: generatePlaceholderVideoUrl(prompt + (frameUrl ?? "")),
        engine,
        costEstimate: estimateVideoCost(engine, durationSeconds),
        durationSeconds,
        isMock: true,
        errorMessage: message,
      };
    }
  }

  await simulatedDelay(2500, 5000);
  return {
    url: generatePlaceholderVideoUrl(prompt + (frameUrl ?? "")),
    engine,
    costEstimate: estimateVideoCost(engine, durationSeconds),
    durationSeconds,
    isMock: true,
  };
}

/** Routing automatique du moteur vidéo selon la langue du projet. */
export function autoRouteVideoEngine(lang: "fr" | "en"): VideoEngine {
  return lang === "en" ? "kling_3_0" : "grok_video";
}

export function autoRouteImageEngine(): ImageEngine {
  return "nano_banana";
}
