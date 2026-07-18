import { NextRequest, NextResponse } from "next/server";
import { callClaudeTool } from "@/lib/anthropicServer";

const EXTRACT_STYLE_TOOL = {
  name: "provide_visual_style",
  description:
    "Retourne le DNA visuel extrait des images de référence fournies, sous forme de style de génération réutilisable.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nom court pour ce style (ex: 'Pixar chaleureux', '2D flat pastel')." },
      shortDescription: { type: "string", description: "Description en une phrase du style détecté." },
      renderType: {
        type: "string",
        description: "Type de rendu détecté : 2D cartoon / Pixar 3D / flat design / réaliste / semi-réaliste / aquarelle / etc.",
      },
      colorPalette: { type: "string", description: "Palette dominante : couleurs chaudes/froides, saturées/désaturées." },
      detailLevel: { type: "string", description: "Niveau de détail : minimaliste / moyen / très détaillé." },
      lineStyle: { type: "string", description: "Type de trait : épais/fin, net/flou, avec/sans ombres." },
      lightingMood: { type: "string", description: "Ambiance lumière : studio propre / naturel chaud / néon / sombre / pastel." },
      characterStyle: { type: "string", description: "Style des personnages : réaliste / exagéré / chibi / stylisé / etc." },
      positivePrompt: {
        type: "string",
        description:
          "Prompt positif complet et détaillé synthétisant tous les éléments du DNA visuel, prêt à être injecté dans les générations d'images et de vidéos.",
      },
      negativePrompt: {
        type: "string",
        description: "Prompt négatif — éléments visuels à éviter pour rester cohérent avec ce DNA visuel.",
      },
    },
    required: [
      "name",
      "shortDescription",
      "renderType",
      "colorPalette",
      "detailLevel",
      "lineStyle",
      "lightingMood",
      "characterStyle",
      "positivePrompt",
      "negativePrompt",
    ],
  },
};

const SYSTEM_PROMPT = `Tu es un directeur artistique expert en analyse visuelle pour la production vidéo IA.
On te fournit une ou plusieurs images de référence (frame de départ souhaitée et/ou exemples de style/design).
Ta mission : extraire le "DNA visuel" exact de ces images — jamais un style générique inventé, toujours ce qui est réellement observable dans les images fournies.

Analyse précisément :
- Type de rendu (2D cartoon, Pixar 3D, flat design, réaliste, semi-réaliste, aquarelle, etc.)
- Palette dominante (couleurs chaudes/froides, saturées/désaturées)
- Niveau de détail (minimaliste / moyen / très détaillé)
- Type de trait (épais/fin, net/flou, avec/sans ombres)
- Ambiance lumière (studio propre / naturel chaud / néon / sombre / pastel)
- Style des personnages si présents (réaliste / exagéré / chibi / stylisé)

Synthétise tout ceci en un prompt positif détaillé et un prompt négatif, réutilisables tels quels dans des générations d'images et de vidéos ultérieures pour garder une cohérence visuelle totale.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.apiKey || !Array.isArray(body?.images) || body.images.length === 0) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const { apiKey, images, lang } = body;

  const userMessage = `Analyse les images ci-jointes et extrais leur DNA visuel complet. Langue du projet : ${lang}.`;

  try {
    const result = await callClaudeTool({
      apiKey,
      system: SYSTEM_PROMPT,
      userMessage,
      tool: EXTRACT_STYLE_TOOL,
      images,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
