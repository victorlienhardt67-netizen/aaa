// Transcription voix off — ElevenLabs Scribe (seul provider, réponse
// synchrone). Même forme de retour que l'ancien falTranscribeAudio, pour
// rester un remplacement direct côté appelant (alignScenesToTranscriptWords
// consomme cette forme sans modification).

import { FalTranscriptWord, FalTranscriptionResult } from "./fal";

export type TranscriptionResult = FalTranscriptionResult;
export type TranscriptionWord = FalTranscriptWord;

interface RawTranscriptionResult {
  total_duration: number;
  detected_language: string;
  segments: { index: number; text: string; start: number; end: number; duration: number }[];
  words: { text: string; start: number; end: number }[];
}

export async function transcribeAudio(
  audioFile: File,
  language: "fr" | "en",
  apiKey: string
): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("language", language);
  formData.append("apiKey", apiKey);

  const submitRes = await fetch("/api/transcribe/submit", {
    method: "POST",
    body: formData,
  });
  const result = (await submitRes.json()) as RawTranscriptionResult & { error?: string };
  if (!submitRes.ok) {
    throw new Error(result?.error ?? `Erreur transcription (${submitRes.status})`);
  }

  const words: TranscriptionWord[] = result.words.map((w) => ({
    text: w.text,
    startSeconds: w.start,
    endSeconds: w.end,
  }));
  return { text: result.segments.map((s) => s.text).join(" "), words };
}
