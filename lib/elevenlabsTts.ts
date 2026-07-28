// Client ElevenLabs — synthèse vocale (texte → audio), utilisé uniquement par
// le moteur vidéo "kling_ai_avatar" (test) : contrairement à Grok/Kling qui
// doivent "deviner" une voix à partir du prompt, ce moteur anime la bouche à
// partir d'un vrai fichier audio, dont la prononciation est fiable (modèle
// multilingue ElevenLabs) au lieu d'être approximée par le modèle vidéo.

export interface ElevenLabsTtsResult {
  audioUrl: string;
  voiceId: string;
}

/**
 * Génère l'audio d'une réplique via /api/elevenlabs/tts (voix choisie
 * automatiquement et de façon stable par personnage, cf. `characterKey`) et
 * renvoie une URL hébergée sur le stockage fal.ai, utilisable directement
 * comme `audio_url` par Kling AI Avatar.
 */
export async function generateVoiceoverAudio(
  text: string,
  characterKey: string,
  elevenLabsApiKey?: string,
  falApiKey?: string
): Promise<ElevenLabsTtsResult> {
  if (!elevenLabsApiKey) {
    throw new Error("Clé API ElevenLabs manquante — ajoute-la dans Réglages avant de générer une vidéo Kling AI Avatar.");
  }
  if (!falApiKey) {
    throw new Error("Clé API fal.ai manquante — ajoute-la dans Réglages avant de générer une vidéo.");
  }

  const res = await fetch("/api/elevenlabs/tts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ elevenLabsApiKey, falApiKey, text, characterKey }),
  });
  const data = await res.json();
  if (!res.ok) {
    const detail = typeof data?.detail === "string" ? ` — ${data.detail}` : "";
    throw new Error(data?.error ? `${data.error}${detail}` : `Erreur génération audio ElevenLabs (${res.status})`);
  }
  return { audioUrl: data.audioUrl, voiceId: data.voiceId };
}
