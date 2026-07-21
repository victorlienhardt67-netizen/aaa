import { NextRequest, NextResponse } from "next/server";
import { callClaudeTool } from "@/lib/anthropicServer";
import { DEFAULT_GENERATE_HOOKS_SYSTEM_PROMPT } from "@/lib/prompts";

const HOOKS_TOOL = {
  name: "provide_hooks",
  description: "Retourne 3 variantes d'accroche (hooks) pour la vidéo publicitaire.",
  input_schema: {
    type: "object",
    properties: {
      hooks: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description: "3 accroches courtes et percutantes, dans la langue demandée.",
      },
    },
    required: ["hooks"],
  },
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.apiKey) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const { apiKey, brandName, brandDescription, brandTone, lang, systemPromptOverride } = body;

  const system = systemPromptOverride?.trim() || DEFAULT_GENERATE_HOOKS_SYSTEM_PROMPT;

  const userMessage = `Génère 3 hooks différents en ${lang === "fr" ? "français" : "anglais"} pour :
Marque : ${brandName ?? "ce produit"}
Description : ${brandDescription ?? ""}
Ton de communication : ${brandTone ?? "non spécifié"}`;

  try {
    const result = await callClaudeTool({ apiKey, system, userMessage, tool: HOOKS_TOOL });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
