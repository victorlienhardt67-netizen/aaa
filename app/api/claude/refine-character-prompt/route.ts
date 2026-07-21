import { NextRequest, NextResponse } from "next/server";
import { callClaudeTool } from "@/lib/anthropicServer";

const REFINE_TOOL = {
  name: "provide_refined_prompt",
  description: "Retourne le prompt de fiche casting mis à jour selon la modification demandée.",
  input_schema: {
    type: "object",
    properties: {
      refinedPrompt: {
        type: "string",
        description:
          "Prompt complet de fiche casting (personnage vu de face + trois-quarts + profil sur la même image, fond neutre, éclairage studio, hyper-réaliste) intégrant la modification demandée, en conservant tout ce qui n'est pas concerné par la modification.",
      },
    },
    required: ["refinedPrompt"],
  },
};

const SYSTEM_PROMPT = `Tu affines un prompt de génération d'image de fiche casting (personnage vu de face + trois-quarts + profil sur la même image, fond blanc ou gris neutre, éclairage studio, style hyper-réaliste) selon la demande de modification de l'utilisateur.
Conserve la structure et tous les détails du prompt d'origine qui ne sont pas concernés par la modification — ne change que ce qui est explicitement demandé. Retourne uniquement le prompt final complet, prêt à être utilisé tel quel.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.apiKey || !body?.basePrompt || !body?.modification) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const { apiKey, basePrompt, modification } = body;

  const userMessage = `Prompt d'origine :
"""
${basePrompt}
"""

Modification demandée par l'utilisateur :
"""
${modification}
"""`;

  try {
    const result = await callClaudeTool({ apiKey, system: SYSTEM_PROMPT, userMessage, tool: REFINE_TOOL });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
