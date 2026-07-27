import { NextRequest, NextResponse } from "next/server";

const ENV_DEFAULT_PROVIDER = (process.env.TRANSCRIPTION_PROVIDER || "whisper").toLowerCase();
const BACKEND_URL = process.env.VOICEOVER_SYNC_BACKEND_URL;
const BACKEND_API_KEY = process.env.VOICEOVER_SYNC_API_KEY;

async function statusWhisper(jobId: string): Promise<NextResponse> {
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "voiceover_sync_backend_not_configured" }, { status: 501 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/analyze-voiceover/${encodeURIComponent(jobId)}`, {
      headers: BACKEND_API_KEY ? { "X-API-Key": BACKEND_API_KEY } : undefined,
      cache: "no-store",
    });

    if (res.status === 404) {
      return NextResponse.json({ error: "job_not_found" }, { status: 404 });
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `voiceover_sync_backend_error_${res.status}`, detail: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/** Implémenté à l'étape 3. */
async function statusElevenLabs(_jobId: string): Promise<NextResponse> {
  return NextResponse.json({ error: "elevenlabs_provider_not_implemented_yet" }, { status: 501 });
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }
  // Le provider effectivement utilisé au submit (transmis par le client) prime
  // sur le défaut serveur — un job Whisper doit toujours être interrogé via
  // statusWhisper même si TRANSCRIPTION_PROVIDER vaut "elevenlabs".
  const requestedProvider = req.nextUrl.searchParams.get("provider");
  const provider =
    requestedProvider === "whisper" || requestedProvider === "elevenlabs"
      ? requestedProvider
      : ENV_DEFAULT_PROVIDER;
  return provider === "elevenlabs" ? statusElevenLabs(jobId) : statusWhisper(jobId);
}
