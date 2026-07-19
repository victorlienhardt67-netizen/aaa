import { NextRequest, NextResponse } from "next/server";
import { callClaudeTool } from "@/lib/anthropicServer";
import { DEFAULT_CO_CONSTRUCTION_SYSTEM_PROMPT } from "@/lib/prompts";

const CO_CONSTRUCTION_TOOL = {
  name: "provide_conversation_turn",
  description: "Retourne le prochain tour de la conversation de co-construction du brief.",
  input_schema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description:
          "Message de chat pour ce tour : reformulation de ce qui a été compris + questions du bloc en cours (1 à 3 questions max), ou la synthèse finale complète au bloc 6.",
      },
      quickReplies: {
        type: "array",
        items: { type: "string" },
        description:
          "0 à 5 options courtes cliquables pertinentes pour CE tour précis uniquement (jamais génériques, jamais recyclées). Vide si une réponse libre est plus appropriée.",
      },
      isFinalSynthesis: {
        type: "boolean",
        description: "true uniquement quand 'message' contient la synthèse complète du bloc 6, en attente de validation.",
      },
      synthesis: {
        type: "string",
        description: "Présent uniquement quand isFinalSynthesis=true — texte complet de la synthèse.",
      },
    },
    required: ["message", "isFinalSynthesis"],
  },
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.apiKey || !body?.brief) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const { apiKey, brief, history, systemPromptOverride, styleName } = body;

  const system = systemPromptOverride?.trim() || DEFAULT_CO_CONSTRUCTION_SYSTEM_PROMPT;
  const conversationHistory: { role: "user" | "assistant"; content: string }[] = Array.isArray(history)
    ? history
    : [];

  const userMessage =
    conversationHistory.length === 0
      ? `Style visuel déjà choisi par l'utilisateur (ne jamais le remettre en question ni le redemander) : ${
          styleName ?? "non spécifié"
        }\n\nScript à analyser pour démarrer la co-construction :\n"""\n${brief}\n"""`
      : "Continue la conversation avec ton prochain tour, en respectant strictement le bloc en cours et les règles du system prompt.";

  try {
    const result = await callClaudeTool({
      apiKey,
      system,
      userMessage,
      tool: CO_CONSTRUCTION_TOOL,
      history: conversationHistory,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
