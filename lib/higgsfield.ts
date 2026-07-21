// Client Higgsfield — Nano Banana (images) + voix (TTS)
// Intégration réelle à brancher ici. Pour l'instant, retourne des données mockées réalistes.

import { generatePlaceholderFrame, simulatedDelay } from "./mock";

export interface HiggsfieldImageResult {
  url: string;
  costEstimate: number;
}

export async function higgsfieldGenerateImage(
  prompt: string,
  apiKey?: string
): Promise<HiggsfieldImageResult> {
  // TODO: brancher l'appel réel à l'API Higgsfield (Nano Banana)
  await simulatedDelay(1000, 2200);
  return {
    url: generatePlaceholderFrame(prompt, "Nano Banana · Higgsfield"),
    costEstimate: 0.02,
  };
}

export interface Voice {
  id: string;
  name: string;
  lang: "fr" | "en";
  gender: "homme" | "femme";
}

export const AVAILABLE_VOICES: Voice[] = [
  { id: "voice_fr_claire", name: "Claire", lang: "fr", gender: "femme" },
  { id: "voice_fr_mathieu", name: "Mathieu", lang: "fr", gender: "homme" },
  { id: "voice_fr_lea", name: "Léa", lang: "fr", gender: "femme" },
  { id: "voice_en_olivia", name: "Olivia", lang: "en", gender: "femme" },
  { id: "voice_en_james", name: "James", lang: "en", gender: "homme" },
  { id: "voice_en_mia", name: "Mia", lang: "en", gender: "femme" },
];

export async function higgsfieldGenerateAudio(
  text: string,
  voiceId: string,
  apiKey?: string
): Promise<{ audioUrl: string; costEstimate: number }> {
  // TODO: brancher l'appel réel ElevenLabs / fal.ai TTS via Higgsfield
  await simulatedDelay(800, 1600);
  return {
    audioUrl: `data:audio/mp3;base64,`, // placeholder — pas de contenu audio réel en mock
    costEstimate: 0.01 * Math.max(1, Math.ceil(text.length / 100)),
  };
}
