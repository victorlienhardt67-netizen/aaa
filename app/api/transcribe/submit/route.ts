import { NextRequest, NextResponse } from "next/server";

// Point d'entrée unique de soumission de transcription, quel que soit le
// provider actif — le choix se fait ici, côté serveur (jamais côté client),
// via TRANSCRIPTION_PROVIDER. Whisper reste le défaut si la variable est
// absente ou a une valeur inconnue.
const PROVIDER = (process.env.TRANSCRIPTION_PROVIDER || "whisper").toLowerCase();

// Backend WhisperX auto-hébergé (voir voiceover_sync_backend/) — service
// maison, son URL et sa clé restent des secrets serveur, jamais exposés au client.
const BACKEND_URL = process.env.VOICEOVER_SYNC_BACKEND_URL;
const BACKEND_API_KEY = process.env.VOICEOVER_SYNC_API_KEY;

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

/** Implémenté à l'étape 3 — branchement de l'appel réel à ElevenLabs Scribe. */
async function submitElevenLabs(_formData: FormData): Promise<NextResponse> {
  return NextResponse.json({ error: "elevenlabs_provider_not_implemented_yet" }, { status: 501 });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }
  return PROVIDER === "elevenlabs" ? submitElevenLabs(formData) : submitWhisper(formData);
}
