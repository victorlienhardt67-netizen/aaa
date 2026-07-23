import { NextRequest, NextResponse } from "next/server";
import { buildWizperInput, submitFalJob, uploadFileToFalStorage, WIZPER_MODEL_ID } from "@/lib/falServer";

// Route dédiée (plutôt que /api/fal/submit) : un fichier audio ne peut pas
// être envoyé en base64 dans un corps JSON sans risquer de dépasser la
// taille de requête acceptée — il est uploadé ici en multipart/form-data,
// puis transmis au stockage fal.ai pour obtenir une URL avant de soumettre
// la transcription Wizper.

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const apiKey = formData?.get("apiKey");
  const audio = formData?.get("audio");

  if (!formData || typeof apiKey !== "string" || !apiKey || !(audio instanceof Blob)) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  try {
    const audioUrl = await uploadFileToFalStorage(audio, apiKey);
    const input = buildWizperInput({ audioUrl });
    const result = await submitFalJob(WIZPER_MODEL_ID, apiKey, input);
    return NextResponse.json({
      requestId: result.request_id,
      modelId: WIZPER_MODEL_ID,
      statusUrl: result.status_url,
      resultUrl: result.response_url,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
