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
  buildInput: (params: {
    prompt: string;
    imageUrl: string;
    imageUrls: string[];
    durationSeconds: number;
    /** Uniquement pour Kling AI Avatar (audio-driven) — absent pour les autres moteurs. */
    audioUrl?: string;
  }) => Record<string, unknown>;
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
    // Schéma confirmé via la doc officielle fal.ai (2026) : remplace l'ancien
    // endpoint image-to-video (une seule image de départ) par reference-to-video,
    // qui accepte jusqu'à 7 images de référence (`reference_image_urls`) citées
    // dans le prompt via @Image1, @Image2... — corrige la limite qui empêchait
    // de garder à la fois la frame de la scène, le produit, les personnages et
    // le décor cohérents sur ce moteur.
    modelId: "xai/grok-imagine-video/reference-to-video",
    buildInput: ({ prompt, imageUrls, durationSeconds }) => {
      const clamped = Math.min(10, Math.max(1, Math.round(durationSeconds)));
      return {
        prompt,
        reference_image_urls: imageUrls.slice(0, 7),
        duration: clamped,
        resolution: "720p",
        aspect_ratio: "9:16",
      };
    },
  },
  kling_ai_avatar: {
    // Schéma confirmé via la doc officielle fal.ai (2026) : image + audio +
    // prompt (direction d'animation — gestes, mouvement de caméra, ambiance)
    // → vidéo animée sur cet audio précis. `negative_prompt` est un vrai champ
    // dédié (pas juste une instruction dans le prompt positif) — utilisé ici
    // pour exclure le texte à l'écran, régulièrement halluciné par ce moteur
    // (artefact connu des modèles avatar audio-driven, entraînés en partie sur
    // des vidéos avec sous-titres/paroles incrustés). `duration` n'accepte que
    // "5" ou "10" (pas une valeur libre dérivée de l'audio) — on choisit la
    // plus proche de la durée réelle de la scène pour éviter une vidéo coupée
    // avant la fin de l'audio.
    // Moteur EN TEST : le support officiel de Kling AI Avatar liste chinois/
    // anglais/japonais/coréen/espagnol, PAS le français — à valider par
    // l'usage réel avant de le généraliser aux scènes françaises (Lynae).
    modelId: "fal-ai/kling-video/ai-avatar/v2/standard",
    buildInput: ({ prompt, imageUrl, audioUrl, durationSeconds }) => ({
      image_url: imageUrl,
      audio_url: audioUrl,
      prompt,
      negative_prompt:
        "text, subtitles, captions, on-screen writing, typography, letters, lyrics, watermark, blur, distort, low quality",
      duration: durationSeconds > 7 ? "10" : "5",
    }),
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
 * Upload un fichier (ex: le MP3 de voix off) vers le stockage fal.ai (CDN v3)
 * pour obtenir une URL hébergée courte, utilisable comme `audio_url`/`image_url`
 * par n'importe quel modèle fal.ai — indispensable pour l'audio : contrairement
 * aux petites images, injecter un fichier audio de plusieurs Mo entier en
 * base64 dans le corps JSON d'une requête dépasse vite la taille de requête
 * acceptée (observé en pratique : erreur "Request Entity Too Large" sur un
 * MP3 de ~3 minutes envoyé directement en `audio_url`).
 * Flux en 2 temps recoupé sur plusieurs sources tierces (SDK officiel
 * @fal-ai/client, documentation communautaire) — corrigé après un premier
 * test réel (voir historique) : l'endpoint auth/token exige un corps JSON
 * (l'appel échouait en 422 "Field required" sur "body" quand seul le
 * paramètre de requête était envoyé, sans corps du tout).
 */
export async function uploadFileToFalStorage(file: Blob, apiKey: string): Promise<string> {
  const tokenRes = await fetch("https://rest.alpha.fal.ai/storage/auth/token?storage_type=fal-cdn-v3", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ storage_type: "fal-cdn-v3" }),
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text().catch(() => "");
    throw new Error(`fal.ai storage auth error ${tokenRes.status}: ${text.slice(0, 300)}`);
  }
  const tokenData = await tokenRes.json();
  const token = tokenData?.token as string | undefined;
  const baseUrl = tokenData?.base_url as string | undefined;
  if (!token || !baseUrl) {
    throw new Error(`fal.ai storage auth: réponse inattendue (${JSON.stringify(tokenData).slice(0, 300)})`);
  }

  const uploadRes = await fetch(`${baseUrl}/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => "");
    throw new Error(`fal.ai storage upload error ${uploadRes.status}: ${text.slice(0, 300)}`);
  }
  const uploadData = await uploadRes.json();
  const url = (uploadData?.access_url ?? uploadData?.url ?? uploadData?.file_url) as string | undefined;
  if (!url) {
    throw new Error(`fal.ai storage upload: URL introuvable dans la réponse (${JSON.stringify(uploadData).slice(0, 300)})`);
  }
  return url;
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
