import { NextRequest, NextResponse } from "next/server";

// Contrairement à fal.ai (clé BYOK envoyée par le client à chaque appel), le
// backend voiceover-sync est un service Python maison (WhisperX + FastAPI)
// hébergé par nous : son URL et sa clé restent des secrets serveur, jamais
// exposés au client.
const BACKEND_URL = process.env.VOICEOVER_SYNC_BACKEND_URL;
const BACKEND_API_KEY = process.env.VOICEOVER_SYNC_API_KEY;

export async function POST(req: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "voiceover_sync_backend_not_configured" }, { status: 501 });
  }

  const formData = await req.formData().catch(() => null);
  const audio = formData?.get("audio");
  const language = formData?.get("language");
  const referenceText = formData?.get("referenceText");

  if (!formData || !(audio instanceof Blob) || typeof language !== "string" || !language) {
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
    return NextResponse.json({ jobId: data.job_id, status: data.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
