// Couche d'abstraction transcription voix off — un seul point d'appel côté
// app (`transcribeAudio`), quel que soit le provider choisi côté serveur
// (variable d'env TRANSCRIPTION_PROVIDER, lue par app/api/transcribe/*).
// Whisper (auto-hébergé) reste le comportement par défaut à ce stade —
// aucun changement de comportement pour l'utilisateur tant que
// TRANSCRIPTION_PROVIDER n'est pas explicitement mis à "elevenlabs" (étape 3).

import { FalTranscriptWord, FalTranscriptionResult } from "./fal";

export type TranscriptionResult = FalTranscriptionResult;
export type TranscriptionWord = FalTranscriptWord;

const POLL_INTERVAL_MS = 2000;
// La transcription CPU (Whisper) peut prendre plusieurs dizaines de secondes
// sur un fichier long — budget large (~5 minutes) avant d'abandonner le polling.
const MAX_POLL_ATTEMPTS = 150;

interface RawTranscriptionResult {
  total_duration: number;
  detected_language: string;
  segments: { index: number; text: string; start: number; end: number; duration: number }[];
  words: { text: string; start: number; end: number }[];
}

/**
 * Transcrit un fichier audio (voix off) avec un timestamp par mot, quel que
 * soit le provider actif côté serveur — même forme de retour que
 * falTranscribeAudio/whisperxTranscribeAudio, pour rester un remplacement
 * direct côté appelant (alignScenesToTranscriptWords consomme cette forme
 * sans modification).
 */
export async function transcribeAudio(
  audioFile: File,
  language: "fr" | "en"
): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("language", language);

  const submitRes = await fetch("/api/transcribe/submit", {
    method: "POST",
    body: formData,
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok) {
    throw new Error(submitData?.error ?? `Erreur soumission transcription (${submitRes.status})`);
  }

  const jobId = submitData.jobId as string;
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const statusRes = await fetch(`/api/transcribe/status?jobId=${encodeURIComponent(jobId)}`, {
      cache: "no-store",
    });
    const statusData = await statusRes.json();
    if (!statusRes.ok) {
      throw new Error(statusData?.error ?? `Erreur statut transcription (${statusRes.status})`);
    }

    if (statusData.status === "error") {
      throw new Error(statusData.error ?? "Transcription en échec");
    }

    if (statusData.status === "done") {
      const result = statusData.result as RawTranscriptionResult;
      const words: TranscriptionWord[] = result.words.map((w) => ({
        text: w.text,
        startSeconds: w.start,
        endSeconds: w.end,
      }));
      return { text: result.segments.map((s) => s.text).join(" "), words };
    }
  }

  throw new Error("Délai dépassé en attendant la transcription.");
}
