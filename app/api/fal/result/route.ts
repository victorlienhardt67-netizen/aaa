import { NextRequest, NextResponse } from "next/server";
import { getFalResult } from "@/lib/falServer";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = req.headers.get("x-fal-key");
  const modelId = searchParams.get("modelId");
  const requestId = searchParams.get("requestId");
  const resultUrl = searchParams.get("resultUrl") ?? undefined;

  if (!apiKey || !modelId || !requestId) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  try {
    const result = await getFalResult(apiKey, { resultUrl, modelId, requestId });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
