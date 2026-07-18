import { NextRequest, NextResponse } from "next/server";
import { callClaudeTool } from "@/lib/anthropicServer";
import { DEFAULT_ANALYZE_BRIEF_SYSTEM_PROMPT } from "@/lib/prompts";

const CAMERA_MOVEMENTS = [
  "push_in",
  "whip_pan",
  "orbit_360",
  "crane_up",
  "handheld_shake",
  "zoom_explosif",
  "tilt_reveal",
  "dolly_out",
  "rack_focus",
];

const PRODUCTION_PLAN_TOOL = {
  name: "provide_production_plan",
  description:
    "Retourne le plan de production détaillé de la vidéo, découpé scène par scène.",
  input_schema: {
    type: "object",
    properties: {
      briefAnalysis: {
        type: "string",
        description:
          "Synthèse de l'analyse du brief en 3-5 phrases : message clé, ton perçu, structure narrative choisie, et pourquoi ce découpage en scènes a été retenu. Écrite dans la langue du projet.",
      },
      detectedLang: {
        type: "string",
        enum: ["fr", "en"],
        description: "Langue détectée dans le brief.",
      },
      scenes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string", description: "Description courte de la scène." },
            durationSeconds: { type: "number", description: "Durée estimée du plan, en secondes." },
            cameraMovement: { type: "string", enum: CAMERA_MOVEMENTS },
            hasProduct: { type: "boolean", description: "Le produit de la marque apparaît-il dans ce plan ?" },
            hasCharacter: { type: "boolean", description: "Un personnage récurrent apparaît-il dans ce plan ?" },
            characterState: {
              type: "string",
              description:
                "État du personnage dans cette scène si plusieurs états existent (ex: 'avant', 'après', 'fatiguée', 'rayonnante'). Omettre si un seul état existe pour ce personnage.",
            },
            needsFrame: { type: "boolean", description: "Une frame de départ (image) est-elle nécessaire ?" },
            imagePrompt: { type: "string", description: "Prompt détaillé pour générer l'image de départ (frame)." },
            videoPrompt: {
              type: "string",
              description:
                "Prompt détaillé pour générer la vidéo du plan, incluant au moins 1 directive caméra + 1 directive de mouvement.",
            },
            dialogueLang: { type: "string", enum: ["fr", "en"] },
            voiceType: {
              type: "string",
              enum: ["voiceover", "lipsync", "none"],
              description:
                "Détecte automatiquement qui parle et comment : 'voiceover' si c'est une narration hors-champ (aucun personnage ne parle à l'écran), 'lipsync' si un personnage parle directement face caméra et doit synchroniser ses lèvres, 'none' s'il n'y a aucune voix dans ce plan.",
            },
          },
          required: [
            "description",
            "durationSeconds",
            "cameraMovement",
            "hasProduct",
            "hasCharacter",
            "needsFrame",
            "imagePrompt",
            "videoPrompt",
            "dialogueLang",
            "voiceType",
          ],
        },
      },
    },
    required: ["briefAnalysis", "detectedLang", "scenes"],
  },
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.apiKey || !body?.brief) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const {
    apiKey,
    brief,
    brandName,
    brandDescription,
    brandNotes,
    styleName,
    stylePositivePrompt,
    lang,
    targetDuration,
    motionIntensity,
    learningContext,
    systemPromptOverride,
  } = body;

  const basePrompt = systemPromptOverride?.trim() || DEFAULT_ANALYZE_BRIEF_SYSTEM_PROMPT;
  const system = `${basePrompt}
- Intensité de mouvement souhaitée : ${motionIntensity ?? "equilibre"}
${learningContext ? `\nRetours qualité des générations précédentes à prendre en compte :\n${learningContext}` : ""}`;

  const userMessage = `Brief à analyser :
"""
${brief}
"""

Marque : ${brandName ?? "non spécifiée"}
Description produit : ${brandDescription ?? ""}
Notes de génération permanentes de la marque : ${brandNotes ?? ""}
Style visuel : ${styleName ?? ""} — ${stylePositivePrompt ?? ""}
Langue cible du projet : ${lang}
Durée cible totale : ${targetDuration} secondes

Découpe ce brief en scènes cohérentes qui respectent la durée cible totale (somme des durationSeconds proche de ${targetDuration}s), en gardant chaque plan dynamique (idéalement entre 3 et 7 secondes).`;

  try {
    const result = await callClaudeTool({ apiKey, system, userMessage, tool: PRODUCTION_PLAN_TOOL });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
