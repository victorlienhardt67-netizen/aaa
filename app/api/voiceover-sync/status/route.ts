import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.VOICEOVER_SYNC_BACKEND_URL;
const BACKEND_API_KEY = process.env.VOICEOVER_SYNC_API_KEY;

export async function GET(req: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "voiceover_sync_backend_not_configured" }, { status: 501 });
  }

  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
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
