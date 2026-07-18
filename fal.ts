// Client fal.ai — Kling 3.0, Grok Video, Wan 2.6, Seedance 2.0
// Intégration réelle à brancher ici. Pour l'instant, retourne des données mockées réalistes.

import { ImageEngine, VideoEngine } from "@/types";
import { estimateImageCost, estimateVideoCost, generatePlaceholderFrame, generatePlaceholderVideoUrl, simulatedDelay } from "./mock";

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

export async function falGenerateImage(
  prompt: string,
  engine: ImageEngine,
  apiKey?: string
): Promise<FalImageResult> {
  // TODO: brancher l'appel réel à l'API fal.ai (endpoint image-to-image / text-to-image)
  await simulatedDelay(1200, 2600);
  return {
    url: generatePlaceholderFrame(prompt, `${engine} · fal.ai`),
    engine,
    costEstimate: estimateImageCost(engine),
  };
}

export async function falGenerateVideo(
  prompt: string,
  frameUrl: string | undefined,
  engine: VideoEngine,
  durationSeconds: number,
  apiKey?: string
): Promise<FalVideoResult> {
  // TODO: brancher l'appel réel fal.ai (Kling 3.0 / Grok Video / Wan 2.6 / Seedance 2.0)
  await simulatedDelay(2500, 5000);
  return {
    url: generatePlaceholderVideoUrl(prompt + (frameUrl ?? "")),
    engine,
    costEstimate: estimateVideoCost(engine, durationSeconds),
    durationSeconds,
  };
}

/** Routing automatique du moteur vidéo selon la langue du projet. */
export function autoRouteVideoEngine(lang: "fr" | "en"): VideoEngine {
  return lang === "en" ? "kling_3_0" : "grok_video";
}

export function autoRouteImageEngine(): ImageEngine {
  return "nano_banana";
}
