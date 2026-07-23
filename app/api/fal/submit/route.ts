import { NextRequest, NextResponse } from "next/server";
import {
  buildNanoBananaEditInput,
  buildNanoBananaInput,
  buildWizperInput,
  NANO_BANANA_EDIT_MODEL_ID,
  submitFalJob,
  WIRED_IMAGE_MODELS,
  WIRED_VIDEO_MODELS,
  WIZPER_MODEL_ID,
} from "@/lib/falServer";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.apiKey || !body?.kind) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }
  if (body.kind !== "audio" && !body?.prompt) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const { apiKey, engine, prompt, imageUrl, imageUrls, durationSeconds, kind, audioUrl } = body;

  try {
    if (kind === "audio") {
      if (!audioUrl) {
        return NextResponse.json({ error: "missing_params" }, { status: 400 });
      }
      const input = buildWizperInput({ audioUrl });
      const result = await submitFalJob(WIZPER_MODEL_ID, apiKey, input);
      return NextResponse.json({
        requestId: result.request_id,
        modelId: WIZPER_MODEL_ID,
        statusUrl: result.status_url,
        resultUrl: result.response_url,
      });
    }

    if (kind === "video") {
      const model = WIRED_VIDEO_MODELS[engine];
      if (!model || !imageUrl) {
        return NextResponse.json({ error: "engine_not_wired" }, { status: 501 });
      }
      const input = model.buildInput({ prompt, imageUrl, durationSeconds: durationSeconds ?? 5 });
      const result = await submitFalJob(model.modelId, apiKey, input);
      return NextResponse.json({
        requestId: result.request_id,
        modelId: model.modelId,
        statusUrl: result.status_url,
        resultUrl: result.response_url,
      });
    }

    if (kind === "image") {
      // Si des images de référence sont fournies (character sheet validé), on
      // passe par la variante "edit" pour garder le personnage cohérent.
      if (Array.isArray(imageUrls) && imageUrls.length > 0) {
        const input = buildNanoBananaEditInput({ prompt, imageUrls });
        const result = await submitFalJob(NANO_BANANA_EDIT_MODEL_ID, apiKey, input);
        return NextResponse.json({
          requestId: result.request_id,
          modelId: NANO_BANANA_EDIT_MODEL_ID,
          statusUrl: result.status_url,
          resultUrl: result.response_url,
        });
      }

      const modelId = WIRED_IMAGE_MODELS[engine];
      if (!modelId) {
        return NextResponse.json({ error: "engine_not_wired" }, { status: 501 });
      }
      const input = buildNanoBananaInput({ prompt });
      const result = await submitFalJob(modelId, apiKey, input);
      return NextResponse.json({
        requestId: result.request_id,
        modelId,
        statusUrl: result.status_url,
        resultUrl: result.response_url,
      });
    }

    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
