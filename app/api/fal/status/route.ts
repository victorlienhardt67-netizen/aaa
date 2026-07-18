import { NextRequest, NextResponse } from "next/server";
import { getFalStatus } from "@/lib/falServer";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = req.headers.get("x-fal-key");
  const modelId = searchParams.get("modelId");
  const requestId = searchParams.get("requestId");

  if (!apiKey || !modelId || !requestId) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  try {
    const result = await getFalStatus(modelId, apiKey, requestId);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
