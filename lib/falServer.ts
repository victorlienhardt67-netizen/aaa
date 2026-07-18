// Client serveur pour l'API fal.ai (file d'attente / queue) — utilisé uniquement
// dans les routes API Next.js, jamais côté navigateur (protection de la clé).

const FAL_QUEUE_URL = "https://queue.fal.run";

export async function submitFalJob(
  modelId: string,
  apiKey: string,
  input: Record<string, unknown>
): Promise<{ request_id: string; status: string }> {
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

export async function getFalStatus(
  modelId: string,
  apiKey: string,
  requestId: string
): Promise<{ status: string; logs?: unknown[] }> {
  const res = await fetch(`${FAL_QUEUE_URL}/${modelId}/requests/${requestId}/status`, {
    headers: { Authorization: `Key ${apiKey}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal.ai status error ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

export async function getFalResult(
  modelId: string,
  apiKey: string,
  requestId: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${FAL_QUEUE_URL}/${modelId}/requests/${requestId}`, {
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
 * Kling 3.0 et Grok Video sont câblés — Wan 2.6 et Seedance 2.0 restent
 * simulés tant que leur schéma exact n'est pas confirmé.
 */
export const WIRED_VIDEO_MODELS: Record<string, VideoModelConfig> = {
  kling_3_0: {
    modelId: "fal-ai/kling-video/o3/pro/image-to-video",
    buildInput: ({ prompt, imageUrl, durationSeconds }) => {
      const clamped = Math.min(15, Math.max(3, Math.round(durationSeconds)));
      return {
        prompt,
        image_url: imageUrl,
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
