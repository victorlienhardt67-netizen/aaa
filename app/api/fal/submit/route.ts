import { NextRequest, NextResponse } from "next/server";
import { buildNanoBananaInput, submitFalJob, WIRED_IMAGE_MODELS, WIRED_VIDEO_MODELS } from "@/lib/falServer";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.apiKey || !body?.engine || !body?.prompt || !body?.kind) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const { apiKey, engine, prompt, imageUrl, durationSeconds, kind } = body;

  try {
    if (kind === "video") {
      const model = WIRED_VIDEO_MODELS[engine];
      if (!model || !imageUrl) {
        return NextResponse.json({ error: "engine_not_wired" }, { status: 501 });
      }
      const input = model.buildInput({ prompt, imageUrl, durationSeconds: durationSeconds ?? 5 });
      const result = await submitFalJob(model.modelId, apiKey, input);
      return NextResponse.json({ requestId: result.request_id, modelId: model.modelId });
    }

    if (kind === "image") {
      const modelId = WIRED_IMAGE_MODELS[engine];
      if (!modelId) {
        return NextResponse.json({ error: "engine_not_wired" }, { status: 501 });
      }
      const input = buildNanoBananaInput({ prompt });
      const result = await submitFalJob(modelId, apiKey, input);
      return NextResponse.json({ requestId: result.request_id, modelId });
    }

    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
