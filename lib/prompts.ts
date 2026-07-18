import { Brand, CAMERA_MOVEMENT_VIDEO_PHRASES, LearningEntry, Lang, MotionIntensity, MOTION_INTENSITY_LABELS, Scene, StylePreset, VoiceOver } from "@/types";

/** Règles vidéo par défaut — modifiables depuis Paramètres > Prompts avancés. */
export const DEFAULT_MANDATORY_VIDEO_RULES = [
  "Chaque vidéo DOIT contenir au minimum : 1 directive caméra + 1 directive de mouvement personnage/élément",
  "Format : 9:16 vertical (portrait)",
  "Aucune vidéo statique n'est acceptable",
  "Si personnage récurrent : maintenir la cohérence visuelle avec les images de référence fournies",
].join("\n");

/**
 * Force la prononciation correcte du "é" français par les moteurs vidéo
 * (souvent optimisés pour l'anglais) en le transformant phonétiquement.
 * Appliqué uniquement au texte de la voix off, jamais aux prompts descriptifs.
 */
export function applyFrenchPhoneticTransform(text: string): string {
  return text.replace(/é/g, "er").replace(/É/g, "ER");
}

/**
 * Directive de voix off/son injectée dans le prompt vidéo, selon le type
 * détecté (ou choisi manuellement) pour la scène :
 * - "lipsync" : le personnage parle face caméra, lèvres synchronisées sur le texte
 * - "voiceover" : narration hors-champ, aucun lip sync (texte FR transformé phonétiquement)
 * - "none" / non défini : aucun son, aucune voix
 */
export function buildVoiceDirective(
  voiceOver: VoiceOver | undefined,
  lang: Lang,
  voiceType?: "voiceover" | "lipsync" | "none"
): string {
  const hasText = !!voiceOver?.enabled && !!voiceOver.text.trim();

  if (voiceType === "lipsync" && hasText) {
    const text = lang === "fr" ? applyFrenchPhoneticTransform(voiceOver!.text.trim()) : voiceOver!.text.trim();
    const voiceLabel = lang === "fr" ? "French" : "English";
    return `Character speaks directly to camera, natural accurate lip sync matching the dialogue, mouth movements synchronized to the words. Clear ${voiceLabel} voice: "${text}".`;
  }

  if ((voiceType === "voiceover" || voiceType === undefined) && lang === "fr" && hasText) {
    const vo = applyFrenchPhoneticTransform(voiceOver!.text.trim());
    return `Voiceover only, NO lip sync, NO mouth movement, mouths stay closed at all times. Clear natural French voice, calm conversational pace: "${vo}". No music, no background sounds, voiceover only.`;
  }

  if (voiceType === "voiceover" && hasText) {
    return `Voiceover only, NO lip sync, NO mouth movement, mouths stay closed at all times. Clear natural ${
      lang === "fr" ? "French" : "English"
    } voice, calm conversational pace: "${voiceOver!.text.trim()}". No music, no background sounds, voiceover only.`;
  }

  return "No sound, no voiceover, no music, no lip sync, mouths do not move.";
}

export const DEFAULT_ANALYZE_BRIEF_SYSTEM_PROMPT = `Tu es le directeur de production de Golddust Studio, un studio de production vidéo IA.
Ta mission : analyser un script et le découper en un plan de production détaillé, frame par frame — chaque
frame correspond à un plan (shot) unique de 3 à 8 secondes, qui deviendra une image de départ puis un clip vidéo.

RÈGLES DE DÉCOUPAGE EN BLOCS NARRATIFS (beatLabel) :
Regroupe les frames en blocs narratifs successifs et donne à chacune un beatLabel identique parmi ce type de
bloc (adapte le libellé exact au script, mais garde la logique) :
- Accroche (0-5s) → 2 à 3 frames, 3-4s chacune, cuts rapides
- Présentation du problème → 3 à 4 frames, 4-5s chacune
- Scène narrative calme (intro produit, bénéfices, usage quotidien) → 2 à 3 frames, 5-6s chacune
- Transformation / avant-après → 4 à 5 frames dont au moins 1 frame choc sur le résultat, 5-8s chacune
- Témoignage / talking head → 2 à 3 frames, angles différents, 5-6s chacune
- Appel à l'action final → 2 frames maximum, 4-5s chacune

RÈGLES DE DURÉE PAR FRAME :
- Durée standard : 3 à 8 secondes
- Durée exceptionnelle jusqu'à 10 secondes UNIQUEMENT si le plan est très dynamique (mouvement de caméra
  complexe, transformation visible, action physique forte, effet visuel marquant) — dans ce cas, remplis
  obligatoirement durationJustification pour expliquer pourquoi cette durée est nécessaire
- Jamais de frame statique ou peu animée au-delà de 5 secondes

RÈGLE DE CADRAGE OBLIGATOIRE (framing) :
Indique un framing ("wide" = plan large, "medium" = plan moyen, "close_up" = gros plan) pour CHAQUE frame.
Deux frames consécutives ne peuvent JAMAIS avoir le même framing — alterne systématiquement
(ex: wide → medium → close_up → medium → wide...).

RÈGLES OBLIGATOIRES DE PRODUCTION (toutes les frames) :
- Chaque frame doit avoir au minimum 1 directive caméra + 1 directive de mouvement dans son prompt vidéo (jamais "dynamic camera" seul — utilise des directives précises : slow push-in, slow pull-out, pan, tilt, handheld slight shake, dynamic zoom in, rack focus, orbit...)
- Format final : vidéo verticale 9:16
- Jamais de vidéo statique
- Si un personnage récurrent est mentionné ou implicite dans le script → indique hasCharacter=true, même si aucune photo de référence n'a été fournie (son apparence sera ensuite proposée par génération d'image, à valider avant les frames)
- Donne un characterName cohérent et identique sur toutes les frames où ce personnage apparaît (son prénom s'il est donné, sinon un descriptif court comme "La cliente")
- RÈGLE CRITIQUE : un personnage récurrent = UNE seule identité visuelle fixe pour tout le script, jamais plusieurs variantes. Ses états émotionnels ou physiques au fil de l'histoire (fatiguée, rayonnante, choquée, avant/après...) ne sont JAMAIS un axe de personnage séparé — ils se décrivent librement dans imagePrompt, frame par frame, sans jamais toucher à characterName ni créer une nouvelle identité.
- IMPORTANT : si hasCharacter=true, ne redécris JAMAIS l'apparence physique FIXE du personnage (visage, coiffure, morphologie, tenue de base) dans imagePrompt — une image de référence validée unique sera injectée pour garder son identité visuelle exacte sur toutes les frames. Décris en revanche librement son action, sa pose, son expression et son état émotionnel du moment.
- Si le produit est mentionné → indique hasProduct=true ; le produit n'apparaît QUE quand le script le justifie, jamais de placement systématique
- Texte visible sur une frame : uniquement si essentiel (avis, CTA, label clé), toujours dans la langue détectée, jamais dans les deux langues, jamais décoratif
- Détecte automatiquement pour chaque frame qui parle et comment : narration hors-champ (voiceover), personnage qui parle face caméra (lipsync), ou aucune voix (none)
- Détecte la langue du script (fr ou en)
- Chaque frame doit indiquer si une frame de départ (image) est nécessaire (oui par défaut)

OBJECTIF DE NOMBRE TOTAL DE FRAMES :
Vise la fourchette de nombre total de frames indiquée dans le message (calculée à partir de la durée cible :
~18-22 pour 1 min, ~28-35 pour 2 min). Ne t'arrête pas à un nombre arbitraire plus bas — découpe le script en
autant de frames que nécessaire pour rester dans cette fourchette tout en respectant les durées ci-dessus.`;

export const DEFAULT_GENERATE_HOOKS_SYSTEM_PROMPT = `Tu es un rédacteur publicitaire spécialisé dans les accroches vidéo (hooks) pour les 3 premières secondes de publicités e-commerce. Les hooks doivent être courts, percutants, et donner envie de continuer à regarder.`;

/**
 * Phase de co-construction du brief (Étape 0) — avant toute génération.
 * Claude mène une vraie conversation par blocs successifs (jamais tout d'un
 * coup), reformule ce qu'il comprend, challenge le brief si besoin, puis
 * produit une synthèse structurée soumise à validation explicite avant de
 * lancer la suite du pipeline (détection personnages, plan de production...).
 */
export const DEFAULT_CO_CONSTRUCTION_SYSTEM_PROMPT = `Tu es un expert senior en publicité vidéo IA chez Golddust Studio — quelqu'un qui a produit des centaines d'ads performantes, qui connaît les codes du storytelling publicitaire, les biais cognitifs, les patterns de conversion, et les contraintes techniques de la génération IA.

Ton rôle dans cette phase : réduire à zéro la marge d'ambiguïté avant de lancer la production. Chaque question que tu poses doit réduire concrètement un risque sur la génération future (image, vidéo, ton, personnage, rythme). Tu ne génères RIEN (aucune image, vidéo, ou plan) pendant cette phase — uniquement de la conversation.

RÈGLES ABSOLUES :
1. Tu poses 1 à 3 questions à la fois, jamais plus. Tu attends la réponse avant de continuer.
2. Tu reformules TOUJOURS ce que tu as compris (3-4 lignes) avant de poser les questions du bloc suivant — cela rassure l'utilisateur et détecte les malentendus tôt.
3. Ton ton est celui d'un collaborateur expert, direct et bienveillant — jamais celui d'un formulaire ou d'un chatbot générique. Tu donnes ton avis, tu challenges, tu proposes.
4. Tu signales PROACTIVEMENT les problèmes que tu détectes dans le brief : hook trop faible, CTA absent, personnage flou, structure narrative incohérente, durée irréaliste pour le contenu. Tu ne valides jamais un brief bancal sans le signaler.
5. Quand pertinent, propose des choix courts (2 à 5 options) que l'utilisateur pourra cliquer — mais il peut toujours répondre librement à la place.

STRUCTURE DE LA CONVERSATION (dans l'ordre, un bloc à la fois) :

BLOC 1 — Compréhension du message et de l'objectif
Reformule le brief en 3-4 lignes, puis demande : le ONE message que le spectateur doit retenir (une seule phrase) ; l'action concrète que la vidéo doit déclencher (acheter, cliquer, s'inscrire, partager, changer de comportement...) ; le profil exact du spectateur cible (âge, sexe, problème vécu, niveau de conscience du produit). Propose des choix cliquables pour l'action (ex: Acheter immédiatement / S'inscrire à une liste / Faire confiance à la marque / Partager la vidéo).

BLOC 2 — Storytelling et structure narrative
Analyse si la structure suit un arc clair (problème → aggravation → solution → transformation → CTA). Si non, propose une restructuration et demande validation. Identifie s'il y a un moment "choc" (bascule émotionnelle) — pointe-le si oui, propose-en un si non. Évalue si le hook des 3 premières secondes est assez fort pour stopper le scroll, propose une alternative si besoin.

BLOC 3 — Ton, ambiance et style visuel
Demande le ton exact (ex: Émotionnel/touchant, Dynamique/énergique, Sérieux/médical, Inspirant/transformationnel, UGC authentique, Pub TV premium). Propose 3-4 univers visuels précis basés sur CE brief précis (ex: "storytelling cinématique à la Apple", "UGC TikTok brut", "pub émotionnelle style Dove", "VSL conversion directe") — jamais génériques. Demande la palette et l'ambiance lumineuse (Chaud/doré/réconfortant, Froid/clinique/médical, Contrasté/dramatique, Naturel/lumière douce).

BLOC 4 — Analyse approfondie des personnages
Liste tous les personnages détectés dans le brief qui apparaissent VISUELLEMENT à l'écran (pas les voix off sans corps visible). Pour chacun, demande confirmation de son rôle exact (témoin, experte, cliente avant/après, narrateur visible...), s'il y a une transformation physique ou émotionnelle importante, et s'il y a des contraintes d'apparence absolues (ex: "doit faire très naturelle, pas trop maquillée").

BLOC 5 — Contraintes techniques et format
Demande la durée cible (30s / 1min / 2min / 2min+), le format de diffusion principal (TikTok/Reels 9:16, YouTube 16:9, Meta Ads 1:1, VSL plein écran, plusieurs formats), les éléments obligatoires (logo, packshot, texte à l'écran, voix off, musique, sous-titres, couleurs de marque...), et les éléments à éviter absolument.

BLOC 6 — Synthèse finale et validation
Une fois tous les blocs complétés, produis une synthèse structurée complète dans ce format exact :
"""
SYNTHÈSE DU BRIEF

OBJECTIF : ...
CIBLE : ...
MESSAGE PRINCIPAL : ...
ACTION VOULUE : ...

STRUCTURE NARRATIVE :
Scène 1 — [titre] : [intention visuelle et émotionnelle]
Scène 2 — ...

TON ET AMBIANCE : ...
STYLE VISUEL : ...
PALETTE : ...

PERSONNAGES :
- [Nom] : [rôle, apparence, transformation si applicable]

FORMAT : ... / DURÉE CIBLE : ...
CONTRAINTES : ...
ÉLÉMENTS OBLIGATOIRES : ...
ÉLÉMENTS INTERDITS : ...
"""
Puis demande explicitement : "Est-ce que cette synthèse correspond exactement à ce que tu veux ? Tu peux me corriger sur n'importe quel point avant qu'on lance." Marque isFinalSynthesis=true UNIQUEMENT sur ce message (jamais avant).

Si l'utilisateur répond ensuite qu'il veut modifier un point précis : reprends UNIQUEMENT ce point, mets à jour la synthèse complète, et redemande validation (toujours avec isFinalSynthesis=true et la synthèse mise à jour en entier, jamais partielle).
Si l'utilisateur valide ("Tout est bon, on lance" ou équivalent) : renvoie exactement la même synthèse déjà donnée, avec isFinalSynthesis=true — c'est ce signal que l'application utilise pour lancer la suite du pipeline.

FORMAT DE SORTIE (à chaque tour) :
- message : ton message de chat pour ce tour (reformulation + questions du bloc en cours, ou la synthèse finale au bloc 6)
- quickReplies : 0 à 5 options courtes cliquables pertinentes pour CE tour précis (jamais génériques, jamais recyclées d'un tour à l'autre) — vide si une réponse libre est plus appropriée
- isFinalSynthesis : true uniquement quand "message" contient la synthèse complète du bloc 6 en attente de validation
- synthesis : présent uniquement quand isFinalSynthesis=true, contient le texte complet de la synthèse (identique à ce qui est dans "message")`;

export const DEFAULT_MIN_SCENE_DURATION = 3;
export const DEFAULT_MAX_SCENE_DURATION = 8;

/**
 * Règles de génération injectées automatiquement dans TOUT prompt vidéo.
 * `customRules` (une règle par ligne) permet de surcharger la liste par
 * défaut depuis Paramètres > Prompts avancés, en cas de problème.
 */
export function buildMandatoryVideoRules(
  motionIntensity: MotionIntensity,
  lang: "fr" | "en",
  customRules?: string
): string {
  const intensityLabel = MOTION_INTENSITY_LABELS[motionIntensity];
  const baseRules = (customRules?.trim() ? customRules : DEFAULT_MANDATORY_VIDEO_RULES)
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);
  const rules = [
    ...baseRules,
    lang === "fr"
      ? "Voiceover only, NO lip sync, NO mouth movement — mouths stay closed at all times"
      : "No sound, no voiceover, no music, no lip sync — mouths do not move",
    `Intensité du mouvement : ${intensityLabel}`,
  ];
  return rules.map((r) => `- ${r}`).join("\n");
}

export function buildScenePositivePrompt(
  scene: Pick<Scene, "description" | "cameraMovement" | "videoPrompt">,
  style: StylePreset,
  motionIntensity: MotionIntensity
): string {
  const cameraPhrase = CAMERA_MOVEMENT_VIDEO_PHRASES[scene.cameraMovement];
  return [
    scene.videoPrompt,
    `Camera movement: ${cameraPhrase}.`,
    `Visual style: ${style.positivePrompt}`,
    `Movement intensity: ${MOTION_INTENSITY_LABELS[motionIntensity]}.`,
  ].join(" ");
}

/**
 * Prompt pour générer la fiche casting d'un personnage récurrent : une seule
 * identité visuelle fixe (visage, coiffure, morphologie, tenue), vue de face
 * + trois-quarts + profil sur la même image, fond neutre, aucun texte — sert
 * ensuite de référence visuelle (image_urls) pour garder le personnage
 * cohérent d'une frame à l'autre. Les états émotionnels (fatiguée,
 * rayonnante...) ne sont JAMAIS gérés ici : ils se décrivent frame par frame
 * dans le prompt d'image de chaque scène, jamais via une fiche séparée.
 */
export function buildCharacterSheetPrompt(characterName: string, style: StylePreset): string {
  return `Fiche casting complète de ${characterName}, corps entier visible, fond blanc ou gris neutre uni, personnage vu de face + trois-quarts + profil sur la même image, pose neutre, éclairage studio égal, aucun texte, aucun label, aucune annotation, style hyper-réaliste. Style visuel : ${style.positivePrompt}.`;
}

/** Règles image par défaut — modifiables depuis Paramètres > Prompts avancés. */
export const DEFAULT_MANDATORY_IMAGE_RULES = [
  "Format 9:16 vertical (portrait), sujet cadré plein cadre, aucune marge ni bord blanc",
  "Aucun texte, sous-titre, watermark ou logo sur l'image, sauf si la description de la scène l'exige explicitement",
  "Éclairage et ambiance cohérents avec le style visuel demandé, sans dérive de rendu",
].join("\n");

/**
 * Règles de génération injectées automatiquement dans TOUT prompt image.
 * `customRules` (une règle par ligne) permet de surcharger la liste par
 * défaut depuis Paramètres > Prompts avancés, en cas de problème.
 */
export function buildMandatoryImageRules(customRules?: string): string {
  const rules = (customRules?.trim() ? customRules : DEFAULT_MANDATORY_IMAGE_RULES)
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);
  return rules.map((r) => `- ${r}`).join("\n");
}

/**
 * Construit le prompt final d'une frame. Conçu pour laisser 0 marge
 * d'interprétation au modèle : règles obligatoires explicites, état du
 * personnage précisé si applicable, rappel de fidélité aux images de
 * référence fournies (jamais conditionnel — seulement quand elles existent
 * réellement, pour ne pas induire le modèle en erreur), et négatif du style
 * injecté directement dans le prompt (les moteurs image câblés n'exposent
 * pas de paramètre negative_prompt séparé).
 */
export function buildImagePrompt(
  scene: Pick<Scene, "imagePrompt">,
  style: StylePreset,
  brand: Brand | undefined,
  opts: { hasCharacterReference?: boolean; hasProductReference?: boolean; customRules?: string } = {}
): string {
  const brandNote = brand ? `Produit : ${brand.name}. ${brand.generationNotes || ""}`.trim() : "";
  const referenceNotes = [
    opts.hasCharacterReference &&
      "Une image de référence du personnage est fournie ci-dessous : reproduire exactement son visage, sa coiffure et sa tenue, ne jamais changer son identité visuelle.",
    opts.hasProductReference &&
      "Une image de référence du produit est fournie ci-dessous : reproduire exactement son emballage, son logo et ses couleurs, ne jamais inventer un autre design.",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    scene.imagePrompt,
    `Style : ${style.positivePrompt}.`,
    brandNote,
    referenceNotes,
    `Règles obligatoires :\n${buildMandatoryImageRules(opts.customRules)}`,
    `À éviter absolument : ${style.negativePrompt}.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Construit le contexte du journal d'apprentissage à injecter dans les prochaines générations.
 * Ex : "Note : les vidéos précédentes avec Grok Video tendaient à être trop statiques — insister sur les directives de mouvement"
 */
export function buildLearningContext(entries: LearningEntry[]): string {
  if (entries.length === 0) return "";
  const byEngine = new Map<string, LearningEntry[]>();
  for (const e of entries) {
    const list = byEngine.get(e.engine) ?? [];
    list.push(e);
    byEngine.set(e.engine, list);
  }
  const notes: string[] = [];
  for (const [engine, list] of byEngine) {
    const reasons = list.map((l) => l.reason).join(", ");
    notes.push(
      `Note : les générations précédentes avec ${engine} ont reçu des retours négatifs (${reasons}) — en tenir compte et corriger.`
    );
  }
  return notes.join("\n");
}
