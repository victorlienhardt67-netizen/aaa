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
      hook: {
        type: "object",
        description: "Évaluation du hook (3-5 premières secondes) — toujours renseignée en premier.",
        properties: {
          texte: { type: "string", description: "Le texte des 3-5 premières secondes." },
          evaluation: { type: "string", enum: ["fort", "moyen", "faible"] },
          probleme: { type: "string", description: "Pourquoi le hook est moyen/faible — omettre si fort." },
          alternatives: {
            type: "array",
            items: { type: "string" },
            description: "2 alternatives concrètes si le hook est moyen/faible.",
          },
        },
        required: ["texte", "evaluation"],
      },
      arcNarratif: {
        type: "string",
        description:
          "Type d'arc narratif détecté : 'villain monologue', 'témoignage transformation', 'autorité médicale', 'storytelling', 'éducatif mécanisme', ou le plus proche.",
      },
      marqueDetectee: {
        type: "string",
        description: "Marque détectée dans le script si identifiable (ex: Lynae, Lyveen, T-MEN, Venalys, ou autre).",
      },
      pointsVigilance: {
        type: "array",
        items: { type: "string" },
        description: "Risques détectés à surveiller (hook faible, transformation peu lisible, ambiguïté, durée irréaliste...) et comment les gérer.",
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
            characters: {
              type: "array",
              description:
                "TOUS les personnages récurrents détectés automatiquement à la lecture du brief qui apparaissent SIMULTANÉMENT dans ce plan (0, 1, 2 ou plus) — aucun signalement explicite de l'utilisateur n'est nécessaire, à toi de les repérer toi-même (noms, descriptions physiques, rôles). Tableau vide si aucun personnage dans ce plan.",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description:
                      "Nom du personnage récurrent (ex: le prénom mentionné dans le brief, ou un descriptif court comme 'La cliente' si aucun nom n'est donné). Doit être identique pour toutes les scènes montrant le même personnage.",
                  },
                  physicalState: {
                    type: "string",
                    description:
                      "Tout trait pertinent pour la cohérence visuelle de ce personnage, rédigé librement (pas de checklist imposée) — c'est une CARACTÉRISTIQUE du personnage, pas une variante : une seule image de référence sera générée pour ce personnage avec ce trait intégré, jamais une entrée séparée. Une seule fois suffit (première scène où il apparaît) ; omettre si rien de particulier n'est mentionné.",
                  },
                  voiceDescription: {
                    type: "string",
                    description:
                      "UNIQUEMENT si ce personnage parle à l'écran (voiceType='lipsync') dans au moins une scène : décris en une phrase libre la voix fixe de ce personnage (tessiture/pitch, timbre, débit, ton, accent éventuel — pas de nom de voix ni de technologie, une description audio pure, ex: 'voix grave et posée, débit lent, ton rassurant' ou 'voix féminine claire et dynamique, débit rapide, ton enjoué'). Cette même description sera injectée telle quelle dans TOUTES les scènes où ce personnage parle, pour que sa voix reste identique d'un plan à l'autre — ne varie jamais cette description d'une scène à l'autre pour un même personnage. Une seule fois suffit (première scène où il parle) ; omettre s'il ne parle jamais à l'écran.",
                  },
                },
                required: ["name"],
              },
            },
            locationName: {
              type: "string",
              description:
                "Nom court du lieu où se déroule cette scène (ex: 'Salle de bain', 'Cuisine', 'Rue ensoleillée'). Doit être IDENTIQUE (même texte exact) pour toutes les scènes se déroulant au même endroit, pour qu'elles partagent la même référence de décor.",
            },
            needsFrame: { type: "boolean", description: "Une frame de départ (image) est-elle nécessaire ?" },
            imagePrompt: {
              type: "string",
              description:
                "Prompt détaillé pour générer l'image de départ (frame). Ne jamais y décrire l'apparence physique FIXE d'un personnage récurrent listé dans 'characters' — visage, coiffure, morphologie, tenue de base restent définis une fois pour toutes par son image de référence validée. En revanche, décris librement son action, sa pose, son expression et son état émotionnel du moment (fatiguée, rayonnante, choquée...) : c'est ici, frame par frame, que les états visuels et émotionnels se gèrent, jamais via une entrée de personnage séparée.",
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
            voiceOverText: {
              type: "string",
              description:
                "Fragment EXACT du texte parlé (voix off ou dialogue) prononcé pendant ce plan précis — un court extrait tiré mot pour mot du script, jamais un paragraphe entier réutilisé sur plusieurs frames ni un texte inventé. Laisser vide si voiceType='none'. imagePrompt et videoPrompt doivent illustrer visuellement ce que dit ce fragment.",
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
                "Bloc narratif de cette frame — UNIQUEMENT l'une de ces 6 valeurs exactes, dans la langue du script : 'Hook' / 'Problème' / 'Agitation' / 'Solution' / 'Preuve' / 'CTA' en français, ou 'Hook' / 'Problem' / 'Agitate' / 'Solution' / 'Proof' / 'CTA' en anglais. Identique pour toutes les frames du même bloc, dans cet ordre.",
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
    narrationTypeOverride,
  } = body;

  const basePrompt = systemPromptOverride?.trim() || DEFAULT_ANALYZE_BRIEF_SYSTEM_PROMPT;
  const narrationInstruction =
    narrationTypeOverride === "voiceover"
      ? "\nContrainte utilisateur sur le type de narration : TOUTES les scènes de ce run doivent utiliser voiceType=\"voiceover\" (narration hors-champ, aucune synchronisation labiale) — jamais \"lipsync\", quel que soit le script."
      : narrationTypeOverride === "lipsync"
        ? "\nContrainte utilisateur sur le type de narration : TOUTES les scènes de ce run comportant un dialogue doivent utiliser voiceType=\"lipsync\" (personnage qui parle face caméra, synchronisation labiale) plutôt que \"voiceover\", quel que soit le script."
        : narrationTypeOverride === "hybrid"
          ? "\nContrainte utilisateur sur le type de narration : ce run mélange volontairement voix off ET personnages qui parlent à l'écran — détermine explicitement pour CHAQUE scène si elle est \"voiceover\" ou \"lipsync\" en te basant sur le script, sans choisir un seul mode uniforme pour tout le run."
          : "";
  const system = `${basePrompt}
- Intensité de mouvement souhaitée : ${motionIntensity ?? "equilibre"}
${learningContext ? `\nRetours qualité des générations précédentes à prendre en compte :\n${learningContext}` : ""}${narrationInstruction}`;

  const frameTarget = estimateFrameCountForDuration(Number(targetDuration) || 60);
  // Chaque scène génère plusieurs champs verbeux (imagePrompt, videoPrompt,
  // description, voiceOverText...) — avec un plan long (script + voix off
  // calée sur un audio de plusieurs minutes), le JSON dépasse largement les
  // 8192 tokens par défaut et Claude est coupé en plein milieu sans erreur
  // visible. On dimensionne le budget sur le nombre de scènes visé, avec une
  // marge de sécurité, plafonné très en dessous de la limite du modèle (128k).
  // Le script peut expliciter un nombre de scènes largement supérieur à la
  // fourchette calculée depuis la durée cible (ex: 25 clips détaillés pour une
  // durée cible pensée pour ~12) — sous-dimensionner le budget sur la seule
  // fourchette couperait la réponse en plein milieu, ce qui reviendrait de
  // facto à imposer une réduction silencieuse du nombre de frames.
  const tokenBudgetScenes = Math.max(frameTarget.max, 40);
  const maxTokens = Math.min(64000, Math.max(8192, 2500 + tokenBudgetScenes * 700));

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
Nombre total de frames visé (INDICATIF, seulement si le script ne précise rien lui-même) : entre ${frameTarget.min} et ${frameTarget.max}

Découpe ce script en frames cohérentes. Si le script précise lui-même un nombre exact de scènes/clips/plans, respecte ce nombre à l'identique (voir règle prioritaire à ce sujet). Sinon, vise le nombre de frames indiqué ci-dessus et une durée cible totale proche de ${targetDuration}s (somme des durationSeconds), en respectant les règles de durée par frame, l'alternance de cadrage et le regroupement en blocs narratifs (beatLabel).`;

  try {
    const result = await callClaudeTool({ apiKey, system, userMessage, tool: PRODUCTION_PLAN_TOOL, maxTokens });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
