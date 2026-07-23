// Client serveur pour l'API fal.ai (file d'attente / queue) — utilisé uniquement
// dans les routes API Next.js, jamais côté navigateur (protection de la clé).

const FAL_QUEUE_URL = "https://queue.fal.run";

interface FalSubmitResponse {
  request_id: string;
  status: string;
  /** URLs exactes fournies par fal.ai pour ce job précis — toujours préférées à une reconstruction manuelle,
   * qui ne correspond pas au routage réel pour les modèles multi-segments (ex: "fal-ai/nano-banana-pro/edit"). */
  status_url?: string;
  response_url?: string;
}

export async function submitFalJob(
  modelId: string,
  apiKey: string,
  input: Record<string, unknown>
): Promise<FalSubmitResponse> {
  const res = await fetch(`${FAL_QUEUE_URL}/${modelId}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal.ai submit error ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

/**
 * Interroge le statut d'un job. `statusUrl` (renvoyé par submitFalJob) est
 * toujours utilisé quand disponible ; à défaut, reconstruit l'URL à partir
 * du modelId (repli best-effort, peut échouer pour les modèles multi-segments).
 */
export async function getFalStatus(
  apiKey: string,
  params: { statusUrl?: string; modelId: string; requestId: string }
): Promise<{ status: string; logs?: unknown[] }> {
  const url = params.statusUrl ?? `${FAL_QUEUE_URL}/${params.modelId}/requests/${params.requestId}/status`;
  const res = await fetch(url, {
    headers: { Authorization: `Key ${apiKey}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal.ai status error ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

export async function getFalResult(
  apiKey: string,
  params: { resultUrl?: string; modelId: string; requestId: string }
): Promise<Record<string, unknown>> {
  const url = params.resultUrl ?? `${FAL_QUEUE_URL}/${params.modelId}/requests/${params.requestId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Key ${apiKey}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal.ai result error ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

interface VideoModelConfig {
  modelId: string;
  buildInput: (params: { prompt: string; imageUrl: string; durationSeconds: number }) => Record<string, unknown>;
}

/**
 * Moteurs vidéo réellement branchés à un modèle fal.ai + leur mapping d'input.
 * Kling 3.0 et Grok Video sont câblés — Seedance 2.0 reste simulé tant
 * que son schéma exact n'est pas confirmé.
 */
export const WIRED_VIDEO_MODELS: Record<string, VideoModelConfig> = {
  kling_3_0: {
    // Schéma confirmé via la doc officielle fal.ai (2026) : le champ image
    // s'appelle `start_image_url` (pas `image_url`), et ce endpoint n'a
    // PAS de paramètre `aspect_ratio` — l'ancien modelId "o3/pro" et les
    // champs "image_url"/"aspect_ratio" faisaient échouer chaque appel.
    modelId: "fal-ai/kling-video/v3/standard/image-to-video",
    buildInput: ({ prompt, imageUrl, durationSeconds }) => {
      const clamped = Math.min(15, Math.max(3, Math.round(durationSeconds)));
      return {
        prompt,
        start_image_url: imageUrl,
        duration: String(clamped),
        generate_audio: false,
        shot_type: "customize",
      };
    },
  },
  grok_video: {
    modelId: "xai/grok-imagine-video/image-to-video",
    buildInput: ({ prompt, imageUrl, durationSeconds }) => {
      const clamped = Math.min(10, Math.max(1, Math.round(durationSeconds)));
      return {
        prompt,
        image_url: imageUrl,
        duration: clamped,
        resolution: "720p",
        aspect_ratio: "9:16",
      };
    },
  },
};

/**
 * Moteurs image réellement branchés à un modèle fal.ai + leur mapping d'input.
 * Seul Nano Banana 2 est câblé pour l'instant.
 */
export const WIRED_IMAGE_MODELS: Record<string, string> = {
  nano_banana: "fal-ai/nano-banana-2",
};

export function buildNanoBananaInput(params: { prompt: string }) {
  return {
    prompt: params.prompt,
    num_images: 1,
    aspect_ratio: "9:16",
    output_format: "jpeg",
    resolution: "1K",
  };
}

/**
 * Wizper = Whisper v3 optimisé par fal.ai (même modèle, inférence plus
 * rapide) — utilisé pour transcrire la voix off uploadée avec des timestamps
 * mot par mot (chunk_level: "word"), afin de caler chaque scène sur sa durée
 * réelle exacte plutôt qu'une estimation par nombre de mots.
 * Schéma vérifié via la documentation fal.ai (2026) : audio_url, task,
 * chunk_level, language ; sortie = { text, chunks: [{ text, timestamp: [start, end] }] }.
 */
export const WIZPER_MODEL_ID = "fal-ai/wizper";

export function buildWizperInput(params: { audioUrl: string }) {
  return {
    audio_url: params.audioUrl,
    task: "transcribe",
    chunk_level: "word",
    language: null,
  };
}

/**
 * Variante "edit" standard de Nano Banana (jamais la version pro) — prend des
 * images de référence (image_urls) en plus du prompt, pour garder un
 * personnage visuellement cohérent d'une frame à l'autre.
 */
export const NANO_BANANA_EDIT_MODEL_ID = "fal-ai/nano-banana/edit";

export function buildNanoBananaEditInput(params: { prompt: string; imageUrls: string[] }) {
  return {
    prompt: params.prompt,
    image_urls: params.imageUrls,
    num_images: 1,
    aspect_ratio: "9:16",
    output_format: "jpeg",
    resolution: "1K",
  };
}
