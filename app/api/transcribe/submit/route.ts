import { NextRequest, NextResponse } from "next/server";

// Point d'entrée unique de soumission de transcription, quel que soit le
// provider actif — le choix se fait ici, côté serveur (jamais côté client),
// via TRANSCRIPTION_PROVIDER. Whisper reste le défaut si la variable est
// absente ou a une valeur inconnue.
const PROVIDER = (process.env.TRANSCRIPTION_PROVIDER || "whisper").toLowerCase();

// ElevenLabs Scribe répond de façon synchrone (pas de job à interroger) — la
// route peut donc tourner plus longtemps qu'une requête classique sur les
// fichiers voix off longs (nécessite un plan Vercel supportant ce maxDuration).
export const maxDuration = 300;

// Backend WhisperX auto-hébergé (voir voiceover_sync_backend/) — service
// maison, son URL et sa clé restent des secrets serveur, jamais exposés au client.
const BACKEND_URL = process.env.VOICEOVER_SYNC_BACKEND_URL;
const BACKEND_API_KEY = process.env.VOICEOVER_SYNC_API_KEY;

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_SCRIBE_URL = "https://api.elevenlabs.io/v1/speech-to-text";
// Termes clés (marques) pour aider la reconnaissance — configurable via env,
// séparés par des virgules ; 100 termes max acceptés par l'API Scribe.
const ELEVENLABS_KEYTERMS = (process.env.ELEVENLABS_KEYTERMS || "Lynae,Lyveen,T-men,Venalys")
  .split(",")
  .map((term) => term.trim())
  .filter(Boolean)
  .slice(0, 100);
const ELEVENLABS_MAX_ATTEMPTS = 3;
const ELEVENLABS_TIMEOUT_MS = 120_000;

interface ElevenLabsScribeWord {
  text: string;
  start: number;
  end: number;
  type: "word" | "spacing" | "audio_event";
  speaker_id?: string;
}

interface ElevenLabsScribeResponse {
  text: string;
  language_code: string;
  language_probability: number;
  words: ElevenLabsScribeWord[];
}

async function submitWhisper(formData: FormData): Promise<NextResponse> {
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "voiceover_sync_backend_not_configured" }, { status: 501 });
  }

  const audio = formData.get("audio");
  const language = formData.get("language");
  const referenceText = formData.get("referenceText");

  if (!(audio instanceof Blob) || typeof language !== "string" || !language) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const backendFormData = new FormData();
  backendFormData.append("file", audio, audio instanceof File ? audio.name : "voiceover.mp3");
  backendFormData.append("language", language);
  if (typeof referenceText === "string" && referenceText) {
    backendFormData.append("reference_text", referenceText);
  }

  try {
    const res = await fetch(`${BACKEND_URL}/analyze-voiceover`, {
      method: "POST",
      headers: BACKEND_API_KEY ? { "X-API-Key": BACKEND_API_KEY } : undefined,
      body: backendFormData,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `voiceover_sync_backend_error_${res.status}`, detail: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ jobId: data.job_id, status: data.status, provider: "whisper" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * Appelle Scribe avec retry sur 429/5xx (backoff 1s/2s/4s) et un timeout par
 * tentative — les erreurs client (401/422) ne sont pas retentées.
 */
async function callElevenLabsScribe(body: FormData): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < ELEVENLABS_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ELEVENLABS_TIMEOUT_MS);
    try {
      const res = await fetch(ELEVENLABS_SCRIBE_URL, {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY! },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok || (res.status !== 429 && res.status < 500)) {
        return res;
      }
      lastResponse = res;
    } catch (e) {
      clearTimeout(timeoutId);
      if (attempt === ELEVENLABS_MAX_ATTEMPTS - 1) throw e;
    }
  }

  return lastResponse ?? new Response(null, { status: 502 });
}

async function submitElevenLabs(formData: FormData): Promise<NextResponse> {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "elevenlabs_api_key_not_configured" }, { status: 501 });
  }

  const audio = formData.get("audio");
  const language = formData.get("language");

  if (!(audio instanceof Blob) || typeof language !== "string" || !language) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const backendFormData = new FormData();
  backendFormData.append("file", audio, audio instanceof File ? audio.name : "voiceover.mp3");
  backendFormData.append("model_id", "scribe_v2");
  backendFormData.append("language_code", language);
  backendFormData.append("timestamps_granularity", "word");
  // Pas de no_verbatim : on veut la transcription verbatim exacte, comme avec Whisper.
  for (const term of ELEVENLABS_KEYTERMS) {
    backendFormData.append("keyterms", term);
  }

  try {
    const res = await callElevenLabsScribe(backendFormData);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `elevenlabs_scribe_error_${res.status}`, detail: text.slice(0, 500) },
        { status: res.status }
      );
    }

    const data: ElevenLabsScribeResponse = await res.json();
    // Seuls les mots réellement prononcés (type "word") entrent dans l'alignement
    // scènes/transcript — on écarte les espaces et événements audio (rires, etc.).
    const words = data.words
      .filter((w) => w.type === "word")
      .map((w) => ({ text: w.text, start: w.start, end: w.end }));
    const totalDuration = words.length ? words[words.length - 1].end : 0;

    return NextResponse.json({
      status: "done",
      provider: "elevenlabs",
      result: {
        total_duration: totalDuration,
        detected_language: data.language_code,
        segments: [{ index: 0, text: data.text, start: 0, end: totalDuration, duration: totalDuration }],
        words,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }
  return PROVIDER === "elevenlabs" ? submitElevenLabs(formData) : submitWhisper(formData);
}
