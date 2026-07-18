import { NextRequest, NextResponse } from "next/server";
import { callClaudeTool } from "@/lib/anthropicServer";
import { DEFAULT_ANALYZE_BRIEF_SYSTEM_PROMPT } from "@/lib/prompts";
import { estimateFrameCountForDuration } from "@/lib/utils";

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
            characterName: {
              type: "string",
              description:
                "Nom du personnage récurrent si hasCharacter=true (ex: le prénom mentionné dans le brief, ou un descriptif court comme 'La cliente' si aucun nom n'est donné). Doit être identique pour toutes les scènes montrant le même personnage.",
            },
            needsFrame: { type: "boolean", description: "Une frame de départ (image) est-elle nécessaire ?" },
            imagePrompt: {
              type: "string",
              description:
                "Prompt détaillé pour générer l'image de départ (frame). Ne jamais y décrire l'apparence physique FIXE d'un personnage récurrent (hasCharacter=true) — visage, coiffure, morphologie, tenue de base restent définis une fois pour toutes par son image de référence validée. En revanche, décris librement son action, sa pose, son expression et son état émotionnel du moment (fatiguée, rayonnante, choquée...) : c'est ici, frame par frame, que les états visuels et émotionnels se gèrent, jamais via une entrée de personnage séparée.",
            },
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
            framing: {
              type: "string",
              enum: ["wide", "medium", "close_up"],
              description:
                "Cadrage de cette frame. Doit alterner d'une frame à l'autre — jamais deux fois de suite le même framing.",
            },
            beatLabel: {
              type: "string",
              description:
                "Nom du bloc narratif auquel appartient cette frame (ex: 'Accroche', 'Présentation du problème', 'Transformation', 'Témoignage', 'Appel à l'action'). Identique pour toutes les frames du même bloc, dans l'ordre du script.",
            },
            durationJustification: {
              type: "string",
              description:
                "Obligatoire uniquement si durationSeconds > 8 : explique pourquoi cette durée exceptionnelle est nécessaire (mouvement complexe, transformation, effet marquant...).",
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
            "framing",
            "beatLabel",
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

  const frameTarget = estimateFrameCountForDuration(Number(targetDuration) || 60);

  const userMessage = `Script à analyser :
"""
${brief}
"""

Marque : ${brandName ?? "non spécifiée"}
Description produit : ${brandDescription ?? ""}
Notes de génération permanentes de la marque : ${brandNotes ?? ""}
Style visuel : ${styleName ?? ""} — ${stylePositivePrompt ?? ""}
Langue cible du projet : ${lang}
Durée cible totale : ${targetDuration} secondes
Nombre total de frames visé : entre ${frameTarget.min} et ${frameTarget.max}

Découpe ce script en frames cohérentes qui respectent la durée cible totale (somme des durationSeconds proche de ${targetDuration}s) et le nombre total de frames visé ci-dessus, en respectant les règles de durée par frame, l'alternance de cadrage et le regroupement en blocs narratifs (beatLabel).`;

  try {
    const result = await callClaudeTool({ apiKey, system, userMessage, tool: PRODUCTION_PLAN_TOOL });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
