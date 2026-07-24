// Client pour le backend WhisperX auto-hébergé (voir voiceover_sync_backend/
// et app/api/voiceover-sync/*) — alternative à falTranscribeAudio (Wizper/
// fal.ai) qui ne dépend pas d'un solde fal.ai payant pour la transcription de
// la voix off : le service tourne sur une infra dédiée, configurée via
// VOICEOVER_SYNC_BACKEND_URL côté serveur Next.js.

import { FalTranscriptWord, FalTranscriptionResult } from "./fal";

const POLL_INTERVAL_MS = 2000;
// La transcription CPU peut prendre plusieurs dizaines de secondes sur un
// fichier long — budget large (~5 minutes) avant d'abandonner le polling.
const MAX_POLL_ATTEMPTS = 150;

interface WhisperxAnalysisResult {
  total_duration: number;
  detected_language: string;
  segments: { index: number; text: string; start: number; end: number; duration: number }[];
  words: { text: string; start: number; end: number }[];
}

/**
 * Transcrit un fichier audio (voix off) via le backend WhisperX auto-hébergé,
 * avec un timestamp par mot — même forme de retour que falTranscribeAudio,
 * pour rester un remplacement direct côté appelant (alignScenesToTranscriptWords
 * consomme cette forme sans modification).
 */
export async function whisperxTranscribeAudio(
  audioFile: File,
  language: "fr" | "en"
): Promise<FalTranscriptionResult> {
  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("language", language);

  const submitRes = await fetch("/api/voiceover-sync/submit", {
    method: "POST",
    body: formData,
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok) {
    throw new Error(submitData?.error ?? `Erreur soumission voiceover-sync (${submitRes.status})`);
  }

  const jobId = submitData.jobId as string;
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const statusRes = await fetch(`/api/voiceover-sync/status?jobId=${encodeURIComponent(jobId)}`, {
      cache: "no-store",
    });
    const statusData = await statusRes.json();
    if (!statusRes.ok) {
      throw new Error(statusData?.error ?? `Erreur statut voiceover-sync (${statusRes.status})`);
    }

    if (statusData.status === "error") {
      throw new Error(statusData.error ?? "Analyse voiceover-sync en échec");
    }

    if (statusData.status === "done") {
      const result = statusData.result as WhisperxAnalysisResult;
      const words: FalTranscriptWord[] = result.words.map((w) => ({
        text: w.text,
        startSeconds: w.start,
        endSeconds: w.end,
      }));
      return { text: result.segments.map((s) => s.text).join(" "), words };
    }
  }

  throw new Error("Délai dépassé en attendant la transcription voiceover-sync.");
}
