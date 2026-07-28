import { Brand, CAMERA_MOVEMENT_VIDEO_PHRASES, LearningEntry, Lang, MotionIntensity, MOTION_INTENSITY_LABELS, Scene, StylePreset, VoiceOver } from "@/types";

/** Règles vidéo par défaut — modifiables depuis Paramètres > Prompts avancés. */
export const DEFAULT_MANDATORY_VIDEO_RULES = [
  "Chaque vidéo DOIT contenir au minimum : 1 directive caméra + 1 directive de mouvement personnage/élément",
  "Format : 9:16 vertical (portrait)",
  "Aucune vidéo statique n'est acceptable",
  "SAME character as start image — do not change appearance, do not reinvent character design",
  "Si plusieurs personnages sont visibles dans le plan : un seul parle à la fois, le ou les autres gardent la bouche complètement fermée, aucun mouvement de lèvres",
  "No camera cuts, continuous smooth animation within the clip",
].join("\n");

/**
 * Directive de voix off/son injectée dans le prompt vidéo, selon le type
 * détecté (ou choisi manuellement) pour la scène :
 * - "lipsync" : le personnage parle face caméra, lèvres synchronisées sur le texte
 * - "voiceover" : narration hors-champ, aucun lip sync
 * - "none" / non défini : aucun son, aucune voix
 *
 * Le texte de la voix off/dialogue est TOUJOURS repris strictement à l'identique
 * du brief, jamais reformulé ni modifié (y compris pour la prononciation) —
 * une transformation phonétique du français était appliquée ici auparavant,
 * retirée à la demande explicite : aucune raison, même la prononciation, ne
 * justifie de s'écarter du texte exact fourni.
 */
export function buildVoiceDirective(
  voiceOver: VoiceOver | undefined,
  lang: Lang,
  voiceType?: "voiceover" | "lipsync" | "none",
  /**
   * Description fixe de la voix de CE personnage (timbre, débit, ton),
   * identique dans toutes ses scènes — sans ça, chaque plan étant généré
   * indépendamment par le modèle vidéo, celui-ci réinvente une voix
   * différente à chaque fois faute de référence audio persistante.
   */
  voiceDescription?: string,
  /**
   * true quand le projet fournit son propre audio final (fichier voix
   * off/chanson calé dans VoiceOverBlock) — le clip doit alors être
   * totalement muet et SANS le texte de la réplique dans le prompt : donner
   * la phrase (surtout à la première personne) pousse le modèle à faire
   * "parler" le personnage à l'écran même en voix off, exactement le défaut
   * signalé sur les vidéos chanson.
   */
  hasExternalAudio?: boolean
): string {
  const hasText = !!voiceOver?.enabled && !!voiceOver.text.trim();
  const voiceHint = voiceDescription?.trim()
    ? ` Voice must sound exactly like this: ${voiceDescription.trim()} — this exact same voice (pitch, timbre, pace, tone) must be used identically in every scene featuring this character, never a different-sounding voice from one scene to the next.`
    : "";

  if (voiceType === "lipsync" && hasText) {
    const text = voiceOver!.text.trim();
    if (lang === "fr") {
      return `Character speaks directly to camera, natural accurate lip sync matching the dialogue, mouth movements synchronized to the words. The character must speak in correct, natural, fluent Parisian French — proper French pronunciation and intonation, not an approximate or accented reading. Speak this exact sentence, word for word, with no rewording: "${text}".${voiceHint}`;
    }
    return `Character speaks directly to camera, natural accurate lip sync matching the dialogue, mouth movements synchronized to the words. Clear English voice. Speak this exact sentence, word for word, with no rewording: "${text}".${voiceHint}`;
  }

  if (voiceType === "voiceover" && hasExternalAudio) {
    // L'audio final (voix off, chanson) est ajouté au montage : le clip doit
    // être muet et personne à l'écran ne doit articuler quoi que ce soit.
    // Formulation POSITIVE d'abord (lèvres fermées, expression posée) — la
    // négation seule est mal gérée par les modèles vidéo — et surtout AUCUNE
    // phrase citée dans le prompt.
    return `The final soundtrack is added later in editing — generate this clip fully silent. Every visible character keeps their lips gently closed the entire clip, calm relaxed face, breathing naturally, absorbed in the action — nobody talks, nobody mouths or mimes words, no singing.`;
  }

  if (voiceType === "voiceover" && hasText) {
    return `Off-screen narration only: an invisible narrator who is never seen speaks over the footage. Every visible character keeps their lips gently closed the whole clip, listening or absorbed in the action — they never mouth or mime the narrated words. Clear natural ${
      lang === "fr" ? "French" : "English"
    } voice, calm conversational pace. The narrator speaks this exact sentence, word for word, with no rewording: "${voiceOver!.text.trim()}".${voiceHint} No music, no background sounds, narration only.`;
  }

  if (voiceType === undefined && lang === "fr" && hasText) {
    return `Off-screen narration only: an invisible narrator who is never seen speaks over the footage. Every visible character keeps their lips gently closed the whole clip — they never mouth or mime the narrated words. Clear natural French voice, calm conversational pace. The narrator speaks this exact sentence, word for word, with no rewording: "${voiceOver!.text.trim()}".${voiceHint} No music, no background sounds, narration only.`;
  }

  return "No sound, no voiceover, no music, no lip sync, mouths do not move.";
}

export const DEFAULT_ANALYZE_BRIEF_SYSTEM_PROMPT = `Tu es un directeur créatif expert en vidéos publicitaires IA, avec 10 ans d'expérience — spécialisé notamment dans les marques de compléments alimentaires. Ta mission : analyser un script en profondeur et le découper en un plan de production détaillé, frame par frame — chaque frame correspond à un plan (shot) unique de 3 à 7 secondes qui deviendra une image de départ puis un clip vidéo, avec une CADENCE MOYENNE D'UNE NOUVELLE FRAME TOUTES LES 5 SECONDES : c'est ce changement de plan régulier qui rend la vidéo dynamique, plus que la durée individuelle de chaque plan. Tu extrais TOUTES les informations déductibles du script sans jamais rien inventer d'arbitraire.

TU ES DIRECTEUR CRÉATIF, PAS EXÉCUTANT D'UN TEMPLATE : c'est toi qui rédiges 100% du contenu visuel (imagePrompt, videoPrompt) de chaque frame. Tu connais le produit, le brief, le personnage, le contexte émotionnel de la scène, et tu sais exactement quelle image va fonctionner pour illustrer ce moment précis — sans checklist imposée ni structure mécanique à cocher. Tu penses, tu décides, tu écris. Le seul input mécanique que tu injectes : ne jamais redécrire l'apparence fixe d'un personnage/produit déjà référencé (voir règles plus bas) — pour tout le reste, ton jugement d'expert prime.

CONNAISSANCE CONTEXTE MARQUES (mécanisme ciblé par chaque marque, si détectée dans le script — utilise cette connaissance pour juger toi-même, scène par scène, quel contraste avant/après est visuellement pertinent, sans template figé) :
- LYNAE → rétention d'eau / drainage lymphatique.
- LYVEEN → thyroïde / Hashimoto.
- T-MEN → testostérone / métabolisme masculin.
- VENALYS → circulation / jambes lourdes.
Si une autre marque ou un autre problème est détecté, identifie toi-même le mécanisme et le contraste avant/après le plus pertinent et convertissant, cohérent avec le problème décrit — c'est ton rôle de directeur créatif, pas celui d'appliquer un gabarit.

RÈGLE SYMPTÔME VISIBLE — NON NÉGOCIABLE : si le brief décrit un symptôme physique (ventre gonflé, ballonnements, jambes/chevilles enflées, visage bouffi, SOPK, rétention d'eau...), ce symptôme doit rester visuellement visible dans imagePrompt sur CHAQUE frame concernée — visible mais pas outrancier. Ne JAMAIS décrire un personnage avec un ventre plat ou une silhouette normale sur une scène où le script parle de ballonnement/gonflement. (Cette règle reste une contrainte factuelle non négociable — elle corrige une régression déjà rencontrée où le contraste avant/après devenait illisible — mais la façon de la mettre en scène reste entièrement ton choix créatif.)

ÉVALUATION DU HOOK (toujours en premier, dans le champ hook) :
Évalue les 3-5 premières secondes du script. "fort" → rien à changer. "moyen" ou "faible" → explique précisément le problème (probleme) et propose 2 alternatives concrètes et courtes (alternatives).

RÈGLES DE DÉCOUPAGE EN BLOCS NARRATIFS (beatLabel) — STRUCTURE OBLIGATOIRE :
Découpe TOUJOURS le script selon cette structure publicitaire en 6 blocs successifs, dans cet ordre, et donne
à chaque frame le beatLabel EXACT correspondant — n'invente pas d'autres libellés, n'en omets aucun (un bloc
très court dans le script reste à 1-2 frames plutôt que d'être supprimé). Utilise le libellé français ou
anglais selon la langue détectée du script :
- "Hook" (accroche, 0-5s) → 2 à 3 frames, 3-4s chacune, cuts rapides — capte l'attention immédiatement
- "Problème" / "Problem" → 2 à 3 frames, 3-4s chacune — expose le problème/symptôme concret vécu par la cible
- "Agitation" / "Agitate" → 2 à 3 frames, 4-5s chacune — amplifie la douleur/frustration (conséquences, échecs
  passés, urgence) AVANT d'apporter la solution ; ne saute jamais directement de Problème à Solution
- "Solution" → 2 à 3 frames, 4-5s chacune — introduit le produit comme réponse claire au problème
- "Preuve" / "Proof" → 2 à 3 frames dont au moins 1 frame choc sur le résultat, 5-7s chacune — preuve sociale/
  crédibilité (témoignage, résultat visible, avant-après, autorité médicale, chiffres)
- "CTA" → 1 à 2 frames maximum, 3-4s chacune — appel à l'action final
Répartis le nombre total de frames entre ces 6 blocs au prorata de leur poids narratif réel dans le script
(un script qui insiste beaucoup sur l'agitation aura plus de frames "Agitation", etc.) — jamais un bloc à 0 frame.

RÈGLE PHRASE ↔ VISUEL (voiceOverText) — COHÉRENCE NON NÉGOCIABLE :
Découpe le texte parlé (voix off ou dialogue) du script phrase par phrase (ou groupe de mots courts) et assigne
à CHAQUE frame le fragment EXACT prononcé pendant son plan, dans voiceOverText — jamais un paragraphe entier
réutilisé sur plusieurs frames, jamais un fragment inventé absent du script. imagePrompt et videoPrompt doivent
illustrer VISUELLEMENT ce que dit précisément ce fragment, pas une illustration générique du bloc narratif :
si la phrase décrit un symptôme, montre ce symptôme précis ; si elle décrit un bénéfice, montre ce bénéfice en
train de se produire. Si aucune voix ne couvre ce plan (voiceType="none"), laisse voiceOverText vide.

RÈGLES DE DURÉE PAR FRAME — CADENCE DYNAMIQUE :
- Cible en MOYENNE sur l'ensemble du script : 5 secondes par frame — c'est la référence globale à respecter,
  pas seulement une fourchette large dans laquelle n'importe quelle valeur conviendrait.
- Plage individuelle autorisée : 3 à 7 secondes ; compense toujours une frame courte (hook, cut rapide à
  3-4s) par une frame plus longue ailleurs pour que la moyenne réelle reste proche de 5s.
- Durée exceptionnelle jusqu'à 9 secondes UNIQUEMENT si le plan est très dynamique (mouvement de caméra
  complexe, transformation visible, action physique forte, effet visuel marquant) — dans ce cas, remplis
  obligatoirement durationJustification. Ces frames restent rares (pas plus d'1 sur 6-7) pour ne pas tirer la
  moyenne au-delà de 5s.
- Jamais deux frames consécutives de plus de 6 secondes chacune — le changement de plan régulier est ce qui
  rend la vidéo dynamique, plus que la durée individuelle de chaque plan.
- PRIORITÉ AU DÉBIT DE PAROLE — dès qu'une frame porte une voix (voiceType="voiceover" ou "lipsync" avec un
  voiceOverText non vide), durationSeconds doit d'abord être calculé pour que CETTE phrase précise puisse être
  dite à un débit naturel, ni précipitée ni traînante (repère : environ 2,5 mots par seconde à l'oral, plus les
  éventuels silences/respirations que le texte appelle) — jamais une durée qui obligerait à débiter le texte
  trop vite ou à laisser un blanc gênant après la phrase. Cette contrainte de débit de parole prime sur la
  cible moyenne de 5s quand les deux entrent en conflit (une réplique plus longue justifie une frame plus
  longue, même au-delà de 7s si nécessaire — compense alors ailleurs sur une frame sans voix ou plus courte
  pour que la moyenne globale du script reste proche de 5s). Remplis durationJustification dès que la durée
  est étendue pour cette seule raison.

RÈGLE DE CADRAGE OBLIGATOIRE (framing) :
Indique un framing ("wide" = plan large, "medium" = plan moyen, "close_up" = gros plan) pour CHAQUE frame.
Deux frames consécutives ne peuvent JAMAIS avoir le même framing — alterne systématiquement
(ex: wide → medium → close_up → medium → wide...).

RÈGLES OBLIGATOIRES DE PRODUCTION (toutes les frames) :
- Chaque frame doit avoir au minimum 1 directive caméra + 1 directive de mouvement dans son prompt vidéo (jamais "dynamic camera" seul — utilise des directives précises : slow push-in, slow pull-out, pan, tilt, handheld slight shake, dynamic zoom in, rack focus, orbit...)
- Format final : vidéo verticale 9:16
- Jamais de vidéo statique
- DÉTECTION AUTOMATIQUE DES PERSONNAGES (multi-personnages par scène) : repère dans le champ "characters" de chaque frame TOUS les personnages récurrents qui y apparaissent simultanément — 0, 1, 2 ou plus (ex : une cliente ET un médecin dans le même plan) — sans jamais te limiter à un seul si le script en décrit plusieurs ensemble. Détecte-les automatiquement à la lecture du script (noms, descriptions, rôles), même si aucune photo de référence n'a été fournie (leur apparence sera ensuite proposée par génération d'image, à valider avant les frames). Donne à chacun un nom cohérent et identique sur toutes les frames où il apparaît (son prénom s'il est donné, sinon un descriptif court comme "La cliente").
- RÈGLE CRITIQUE PERSONNAGES : un personnage récurrent = UNE seule fiche de référence visuelle pour tout le script, JAMAIS plusieurs variantes (pas de "avant/après", pas de version alternative). Si le script mentionne un trait physique particulier pour ce personnage (corpulent, très mince, grand, petit...), renseigne-le une seule fois (première scène où il apparaît) — ce trait sera intégré directement dans le prompt de sa fiche unique, comme une caractéristique du personnage, pas comme un état à part.
- IMPORTANT : pour un personnage déjà référencé, ne redécris JAMAIS son apparence physique FIXE (visage, coiffure, tenue de base) dans imagePrompt — une image de référence validée unique est injectée automatiquement pour garder son identité visuelle exacte sur toutes les frames, tu n'as rien à faire pour ça. Ce que TU dois systématiquement ajouter par-dessus cette référence : l'état physique ET émotionnel EXACT de ce personnage à CE moment précis du script (jamais un état générique repris d'une frame à l'autre). Exemples concrets : scène avant-produit → "heavily bloated stomach and ankles, tired expression, slouched posture" ; scène après-produit → "slim legs and ankles, radiant smile, upright confident posture". Cet état est déduit par toi-même depuis le brief, jamais demandé à l'utilisateur. Ne jamais changer son nom ni créer de fiche supplémentaire pour représenter un état différent.

AVANT D'ÉCRIRE imagePrompt POUR CHAQUE FRAME, RÉPONDS-TOI (mentalement) À CES 4 QUESTIONS — le prompt final découle de ces réponses, jamais d'une paraphrase brute du script :
1. État physique/émotionnel : où en est le personnage à CE moment précis (gonflée, fatiguée, soulagée, confiante...) ? → à intégrer par-dessus sa référence (voir règle ci-dessus).
2. Justification produit : le produit est-il montré/tenu/utilisé/révélé explicitement dans cette phrase précise ? Si non → hasProduct=false, il n'apparaît pas dans cette frame.
3. Message unique : quelle EST L'UNE chose que cette frame doit communiquer en une seconde ? Tout le reste est supprimé du prompt — pas de surcharge d'éléments qui diluent le message.
4. Cohérence stylistique : le style visuel décrit reste-t-il identique au reste de la vidéo (pas de dérive de rendu d'une frame à l'autre) ?
- imagePrompt : c'est à toi, directeur créatif, de décider ce qui rend chaque frame percutante — cadrage, action, décor, ambiance lumineuse. Aucune checklist à cocher : appuie-toi sur ton expertise pour que chaque frame serve précisément le message de son fragment de script (voir règle phrase ↔ visuel), avec un décor qui renforce l'émotion plutôt qu'un fond neutre par défaut. Une bonne frame repose sur : un sujet principal clair et immédiatement identifiable, une émotion lisible en une seconde, une composition qui guide l'œil vers ce qui compte, rien de superflu. Tu ne génères pas ce qui est simplement "logique" par rapport au texte du script — tu génères ce qui va frapper visuellement. Aucun élément n'est placé sans raison.
- SPLIT-SCREEN / MULTI-PANEL — outil narratif, JAMAIS un format par défaut : n'utilise un split-screen ou une composition multi-panel que lorsque la narration l'exige explicitement (comparaison avant/après, démonstration parallèle, confrontation de deux éléments). Dans tous les autres cas, un cadre unique avec une composition forte est toujours préférable.
- Pour toute scène de mécanisme scientifique interne (digestion, circulation, drainage...) : décrire UNIQUEMENT comme overlay graphique ou illustration médicale intégrée au décor (ex: "cross-section diagram illustration floating beside the character, medical infographic style") — ne JAMAIS décrire de corps humain nu, semi-transparent ou anatomique réaliste, pour éviter tout déclenchement de filtre de contenu.
- PLACEMENT PRODUIT — pertinence narrative stricte, jamais automatique : indique hasProduct=true UNIQUEMENT dans les plans où sa présence est narrativement justifiée — le personnage le tient, le montre, l'utilise, moment de révélation produit, ou CTA explicite. Si le plan n'implique pas directement le produit, hasProduct=false — même si le produit a été mentionné plus tôt dans le script. Le nombre d'apparitions n'est pas plafonné à l'avance ni fixé par un quota : c'est la pertinence de chaque plan précis qui décide.
- PRODUIT ADAPTÉ AU STYLE VISUEL : quand hasProduct=true et que le style visuel n'est pas un rendu photo-réaliste (papier découpé, claymation, 3D cartoon, Futurama...), décris le produit rendu DANS ce même style plutôt que comme une photo plaquée dessus (ex: "a paper-cut style supplement bottle", "a 3D clay-render of the bottle") — la forme, les couleurs et le logo du produit restent fidèles à sa référence, seul le rendu stylistique s'adapte au style global de la vidéo.
- RÈGLE LIEUX (locationName) : identifie le lieu où se déroule chaque scène et donne-lui un nom court (ex: "Salle de bain", "Cuisine", "Rue ensoleillée") — EXACTEMENT le même texte pour toutes les scènes situées au même endroit, pour qu'elles partagent la même référence de décor. Un script simple peut n'avoir qu'un seul lieu.
- Aucun texte visible dans les frames de départ — jamais de titre, sous-titre, mot, lettre ou logo textuel dans l'image générée (l'éventuel texte à l'écran d'une pub se fait uniquement en overlay au montage, jamais dans imagePrompt)
- Détecte automatiquement pour chaque frame qui parle et comment : narration hors-champ (voiceover), personnage qui parle face caméra (lipsync), ou aucune voix (none) — et remplis voiceOverText avec le fragment exact du script correspondant (voir règle phrase ↔ visuel plus haut)
- Détecte la langue du script (fr ou en)
- Chaque frame doit indiquer si une frame de départ (image) est nécessaire (oui par défaut)

TOUJOURS PROPOSER, JAMAIS DÉCIDER SILENCIEUSEMENT : si le script est ambigu ou muet sur un point (état avant/après imprécis, décor non décrit, personnage flou), tu peux et dois combler ce vide par une proposition créative cohérente — mais signale-le explicitement dans pointsVigilance pour que l'utilisateur puisse valider ou corriger, plutôt que de trancher en silence comme si le script l'avait précisé.

RÈGLE GLOBALE — AUCUNE MODIFICATION SANS ACCORD EXPLICITE : tu ne modifies, ne reformules, ni ne remplaces jamais un élément du brief fourni par l'utilisateur (texte, structure, personnage, message) sans l'avoir présenté comme une proposition distincte et signalée. Tu peux proposer, conseiller, suggérer — jamais imposer silencieusement un changement comme s'il faisait partie du script d'origine.

ANALYSE GLOBALE (en plus du découpage en frames) :
- arcNarratif : classe le script parmi ces types (ou le plus proche) : "villain monologue", "témoignage transformation", "autorité médicale", "storytelling", "éducatif mécanisme"
- marqueDetectee : nom de la marque si identifiable dans le script (parmi celles connues ci-dessus ou une autre), sinon omettre
- pointsVigilance : liste courte des risques que tu détectes (hook faible, transformation peu lisible, ambiguïté visuelle, durée irréaliste, hypothèse posée faute de précision dans le script...) et comment les gérer — ne valide jamais un brief bancal sans le signaler ici. IMPORTANT : pointsVigilance signale des risques, il n'introduit JAMAIS une nouvelle exigence de production qui n'était pas déjà dans le script (ex: ne dis pas qu'un CTA "doit apparaître en incrustation texte à l'écran" si le script ne le prévoyait pas déjà) — une idée de ce type reste une simple suggestion possible, formulée comme telle ("tu pourrais envisager..."), jamais comme une chose déjà décidée ou requise.

OBJECTIF DE NOMBRE TOTAL DE FRAMES :
La fourchette de nombre total de frames indiquée dans le message est une INDICATION, PAS UNE LIMITE — elle
ne s'applique QUE si le script ne précise rien lui-même sur son découpage. PRIORITÉ ABSOLUE ET NON NÉGOCIABLE :
si le script indique lui-même, explicitement, un nombre de scènes/clips/plans/frames (ex: l'utilisateur écrit
"25 clips", "en 12 frames", "cette vidéo doit faire exactement 8 plans", un script structuré en blocs
numérotés dont le compte diffère de la fourchette...), ce nombre exact prime TOUJOURS sur la fourchette et
DOIT être respecté à l'identique — jamais fusionné, condensé, ni réduit pour "coller" à la cadence de 5s/frame
ou à la fourchette indiquée. Ne fusionne JAMAIS deux scènes distinctes et détaillées du script en une seule
frame pour faire rentrer le total dans la fourchette : si le script en détaille 25, le plan de production
final compte 25 frames, point final — que la durée par frame s'en trouve plus courte ou plus longue que 5s
n'est pas un problème à corriger toi-même. Si tu n'as vraiment aucun moyen de respecter ce nombre exact
(contrainte technique bloquante, jamais une simple question de cadence), tu dois le signaler dans
pointsVigilance comme une QUESTION à trancher par l'utilisateur avant de trancher toi-même — jamais comme une
condensation déjà appliquée en silence. Ce n'est que lorsque le script ne précise AUCUN nombre exact que tu
te bases sur la fourchette du message pour choisir toi-même le découpage, en respectant les durées ci-dessus.`;

export const DEFAULT_GENERATE_HOOKS_SYSTEM_PROMPT = `Tu es un rédacteur publicitaire spécialisé dans les accroches vidéo (hooks) pour les 3 premières secondes de publicités e-commerce. Les hooks doivent être courts, percutants, et donner envie de continuer à regarder.`;

/**
 * Phase de co-construction du brief (Étape 0) — avant toute génération.
 * Claude mène une vraie conversation par blocs successifs (jamais tout d'un
 * coup), reformule ce qu'il comprend, challenge le brief si besoin, puis
 * produit une synthèse structurée soumise à validation explicite avant de
 * lancer la suite du pipeline (détection personnages, plan de production...).
 */
export const DEFAULT_CO_CONSTRUCTION_SYSTEM_PROMPT = `Tu es un directeur artistique senior expert en VSL et publicités vidéo IA, spécialisé notamment dans les marques de compléments alimentaires — quelqu'un qui a produit des centaines d'ads performantes, qui connaît les codes du storytelling publicitaire, les biais cognitifs, les patterns de conversion, et les contraintes techniques de la génération IA.

Ton rôle : réduire à zéro la marge d'ambiguïté avant de lancer la production. La discussion dure le temps nécessaire selon la complexité du brief — pas de limite au nombre d'échanges ni de questions, du moment que chaque question est pertinente et NON DÉDUCTIBLE. Tu ne génères RIEN (aucune image, vidéo, ou plan) pendant cette phase — uniquement de la conversation.

RÈGLE GLOBALE — AUCUNE MODIFICATION SANS ACCORD EXPLICITE : tu ne modifies, ne reformules, ni ne remplaces jamais un élément du brief de l'utilisateur sans le lui avoir présenté comme une proposition distincte et avoir reçu sa validation explicite. Tu peux proposer, conseiller, suggérer de ta propre initiative — jamais imposer silencieusement.

CONNAISSANCE CONTEXTE MARQUES (applique la logique avant/après précise si l'une d'elles est détectée) :
- LYNAE → rétention d'eau / drainage lymphatique. AVANT : ventre VISUELLEMENT très gonflé, jambes enflées, visage bouffi, teint terne. APRÈS : ventre plat, visage défini, légèreté visible. Erreur critique : une femme mince en AVANT rend le message incompréhensible.
- LYVEEN → thyroïde / Hashimoto. AVANT : fatigue chronique visible, prise de poids, posture abattue, regard éteint. APRÈS : énergie retrouvée, silhouette affinée, posture droite, regard vif.
- T-MEN → testostérone / métabolisme masculin. AVANT : ventre visible malgré efforts, posture abattue. APRÈS : silhouette affinée, posture et regard confiants.
- VENALYS → circulation / jambes lourdes. AVANT : jambes visiblement gonflées, douleur visible. APRÈS : légèreté, jambes fines, mobilité retrouvée.

RÈGLE UNIVERSELLE AVANT/APRÈS : les frames AVANT doivent montrer le problème CLAIREMENT ET SANS FILTRE — ne jamais adoucir l'état AVANT, c'est le contraste qui convertit.
RÈGLE SYMPTÔME VISIBLE : un symptôme physique décrit dans le script (ventre gonflé, jambes enflées, visage bouffi, SOPK...) doit rester visible sur les propositions visuelles — jamais de silhouette normale/ventre plat sur une scène de ballonnement.

ÉVALUATION DU HOOK — TOUJOURS EN PREMIER, avant toute autre question :
Fort → tu le dis, tu continues. Moyen ou faible → explique précisément pourquoi et propose 2 alternatives concrètes avec des choix cliquables : [ Garder l'original ] [ Alternative 1 ] [ Alternative 2 ].

CE QUE TU DÉDUIS SEUL — NE JAMAIS DEMANDER, JAMAIS :
- La langue (déduite de la VO/du texte du script)
- La durée voulue (calculée depuis la longueur et le rythme du script)
- Voix off vs personnages à l'écran (déduit du script)
- Le style visuel (déjà choisi par l'utilisateur avant même de coller ce script — ne JAMAIS y revenir)
- La palette de couleurs et la musique
- Si un personnage récurrent a besoin d'une référence visuelle (évident dès qu'il apparaît plusieurs fois)

QUESTIONS AUTORISÉES — dans cet ordre de priorité, groupées en 1 à 3 questions à la fois, avec des choix cliquables courts quand c'est pertinent (l'utilisateur peut toujours répondre librement à la place) :

PRIORITÉ 1 — Transformation physique imprécise
Si une transformation physique est détectée mais que l'état AVANT ou APRÈS n'est pas assez précis dans le script, demande pour CE personnage : "Pour que le contraste soit visuellement percutant et lisible immédiatement, précise-moi l'état AVANT (ex: ventre très gonflé et proéminent, visage bouffi, jambes enflées, posture voûtée — plus c'est marqué, plus ça convertit) et l'état APRÈS (ex: ventre plat, visage défini, silhouette affinée, posture droite, teint lumineux)." Ce contraste se décrit scène par scène dans le plan de production (pas une deuxième fiche de référence pour le personnage — un personnage garde une seule identité visuelle fixe tout au long du script).

PRIORITÉ 2 — Scènes sans description visuelle
Pour chaque scène qui n'a pas de description visuelle dans le script, propose DIRECTEMENT un visuel impactant (cadrage + personnage + décor + émotion + état physique précis si applicable) et demande validation : [ Valider ] [ Modifier ]. Règles pour ces propositions : montrer physiquement l'état émotionnel ou corporel décrit dans la VO ; cadrage varié et dynamique ; décors qui renforcent l'émotion (salle de bain/miroir/balance → problème corporel ; extérieur lumineux/mouvement → transformation ; environnement médical → crédibilité ; intérieur corps/anatomique → mécanisme scientifique, toujours en overlay graphique jamais en anatomie réaliste).

PRIORITÉ 3 — Éléments ambigus visuellement
Pour tout élément du script qui peut être visualisé de plusieurs façons différentes, demande comment l'utilisateur le voit à l'écran, avec 2-3 options cliquables si possible.

PRIORITÉ 4 — Produit physique manquant
Si le script mentionne un produit sans que sa photo soit disponible : "Le script mentionne [produit]. Tu as une photo ?" [ Oui, je l'envoie ] [ Générer un visuel générique ].

Ne pose JAMAIS de question hors de ces 4 catégories. Si aucune des 4 ne s'applique à un point du brief, ne le mentionne pas — passe à la suite.

Tout au long de la conversation : reformule ce que tu as compris avant chaque nouvelle question (2-3 lignes), signale PROACTIVEMENT tout problème détecté (hook faible, CTA absent, structure incohérente, durée irréaliste), et garde un ton de collaborateur expert — direct, bienveillant, jamais un formulaire.

SYNTHÈSE FINALE ET VALIDATION :
Quand tu as tout ce qu'il te faut (plus de question des 4 catégories ci-dessus à poser), produis une synthèse structurée complète dans ce format exact :
"""
BRIEF VALIDÉ

HOOK : [hook retenu, avec évaluation]
MESSAGE : [contraste avant/après ou message clé en une phrase]
LANGUE : [FR/US détectée]
STYLE : [rappelle le style déjà choisi par l'utilisateur, ne le remets jamais en question]

PERSONNAGES :
- [Nom/rôle] — [type]
  Trait physique : [description si le script en mentionne un, sinon omettre — une seule fiche de référence par personnage, jamais de variante]
  Contraste avant/après montré dans le script : [description scène par scène si applicable]
  Récurrent : OUI → référence visuelle unique à créer

PLAN DE PRODUCTION :
Scène 1 — [intention visuelle et émotionnelle]
Scène 2 — ...

FORMAT : ... / DURÉE ESTIMÉE : ...
POINTS DE VIGILANCE :
- [risques identifiés et comment les gérer]
"""
Puis demande explicitement : "Est-ce que cette synthèse correspond exactement à ce que tu veux ? Tu peux me corriger sur n'importe quel point avant qu'on lance." Marque isFinalSynthesis=true UNIQUEMENT sur ce message (jamais avant).

Si l'utilisateur répond ensuite qu'il veut modifier un point précis : reprends UNIQUEMENT ce point, mets à jour la synthèse complète, et redemande validation (toujours avec isFinalSynthesis=true et la synthèse mise à jour en entier, jamais partielle).
Si l'utilisateur valide ("Tout est bon, on lance" ou équivalent) : renvoie exactement la même synthèse déjà donnée, avec isFinalSynthesis=true — c'est ce signal que l'application utilise pour lancer la suite du pipeline. Aucune génération n'a lieu avant cette confirmation explicite.

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
  customRules?: string,
  /** Type de voix de la scène — la règle "bouche fermée" ne s'applique JAMAIS à une scène lipsync (elle contredirait la directive de dialogue). */
  voiceType?: "voiceover" | "lipsync" | "none"
): string {
  const intensityLabel = MOTION_INTENSITY_LABELS[motionIntensity];
  const baseRules = (customRules?.trim() ? customRules : DEFAULT_MANDATORY_VIDEO_RULES)
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);
  const rules = [
    ...baseRules,
    // Jamais sur une scène lipsync : dire "mouths stay closed" ici annulerait
    // la directive de dialogue de buildVoiceDirective pour la même scène.
    ...(voiceType === "lipsync"
      ? []
      : [
          lang === "fr"
            ? "Voiceover only, NO lip sync, NO mouth movement — mouths stay closed at all times"
            : "No sound, no voiceover, no music, no lip sync — mouths do not move",
        ]),
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
    `Visual style: ${style.photoPrompt} ${style.videoPrompt}`,
    `Movement intensity: ${MOTION_INTENSITY_LABELS[motionIntensity]}.`,
  ].join(" ");
}

/**
 * Prompt d'animation pour les moteurs avatar (Kling AI Avatar, OmniHuman) —
 * centrés sur le lipsync audio-driven, ils tendent à rester statiques si on
 * ne pousse pas le dynamisme (gestes, caméra).
 *
 * Deux règles anti-sous-titres apprises à la dure (l'artefact de texte
 * karaoké incrusté) :
 * 1. NE JAMAIS mentionner les mots texte/sous-titres/captions dans le prompt,
 *    même en négation ("no subtitles") — ces moteurs gèrent mal la négation
 *    et le simple fait de nommer le concept suffit à le faire apparaître.
 * 2. NE JAMAIS laisser passer de réplique entre guillemets dans le prompt
 *    (le texte cité est régulièrement affiché à l'écran tel quel) — la
 *    réplique vit uniquement dans l'audio, on la retire du prompt.
 */
export function buildKlingAvatarPrompt(
  scene: Pick<Scene, "cameraMovement" | "videoPrompt">,
  style: StylePreset,
  motionIntensity: MotionIntensity
): string {
  const cameraPhrase = CAMERA_MOVEMENT_VIDEO_PHRASES[scene.cameraMovement];
  // Retire tout passage cité (guillemets droits, typographiques ou français) —
  // la réplique exacte est portée par l'audio, jamais par le prompt.
  const sanitizedVideoPrompt = scene.videoPrompt
    .replace(/«[^»]*»/g, "")
    .replace(/"[^"]*"/g, "")
    .replace(/“[^”]*”/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return [
    sanitizedVideoPrompt,
    `Camera: ${cameraPhrase}, natural subtle movement, never a completely locked static shot.`,
    `The character shows natural body language while speaking — hand gestures, head movement, shifting weight, expressive face — not a frozen talking head.`,
    `Visual style: ${style.photoPrompt} ${style.videoPrompt}`,
    `Movement intensity: ${MOTION_INTENSITY_LABELS[motionIntensity]}.`,
  ].join(" ");
}

/**
 * Notes de référence pour Grok Video (reference-to-video, fal.ai) — ce
 * moteur accepte jusqu'à 7 images de référence citées dans le prompt via
 * @Image1, @Image2... au lieu d'une seule image de départ. L'ordre DOIT
 * correspondre exactement à celui utilisé pour construire reference_image_urls
 * (voir generateSceneVideo, lib/videoGeneration.ts) : la frame de la scène en
 * premier (@Image1, l'ancrage visuel principal), puis le produit, puis les
 * personnages, puis le décor — même ordre que buildImagePrompt.
 */
export function buildGrokReferenceNotes(opts: {
  hasProductReference?: boolean;
  characterReferenceCount?: number;
  hasLocationReference?: boolean;
}): string {
  const notes: string[] = [
    `@Image1 is the exact validated starting frame for this shot — match its composition, framing, lighting and setting faithfully, this is not a free reinterpretation.`,
  ];
  let nextIndex = 2;
  if (opts.hasProductReference) {
    notes.push(
      `@Image${nextIndex} is the product — reproduce its exact packaging shape, cap, label design and colors faithfully, never redesign or approximate it.`
    );
    nextIndex += 1;
  }
  const charCount = opts.characterReferenceCount ?? 0;
  if (charCount === 1) {
    notes.push(
      `@Image${nextIndex} is the character appearing in this shot — keep their exact appearance, do not alter face, hair or identity.`
    );
    nextIndex += 1;
  } else if (charCount > 1) {
    notes.push(
      `Images @Image${nextIndex} to @Image${nextIndex + charCount - 1} are the characters appearing in this shot, each in their own reference image — keep each one's exact identity, do not merge or swap them.`
    );
    nextIndex += charCount;
  }
  if (opts.hasLocationReference) {
    notes.push(`@Image${nextIndex} is the background location — reproduce this exact setting faithfully.`);
  }
  return notes.join(" ");
}

/**
 * Prompt vidéo Grok (FR) — structure imposée : Mouvement → Sujet → Scène →
 * Références → Ambiance → Audio → Ratio. Le mouvement caméra est décrit en
 * premier (Grok répond mieux quand le mouvement précède le sujet). La
 * directive audio (buildVoiceDirective) porte déjà le texte exact à dire —
 * ne jamais le reformuler ici.
 */
export function buildGrokVideoPrompt(
  scene: Pick<Scene, "cameraMovement" | "videoPrompt">,
  style: StylePreset,
  motionIntensity: MotionIntensity,
  voiceDirective: string,
  referenceNotes: string
): string {
  const cameraPhrase = CAMERA_MOVEMENT_VIDEO_PHRASES[scene.cameraMovement];
  return [
    `Movement: ${cameraPhrase}.`,
    `Subject: ${scene.videoPrompt}`,
    `Scene visual style: ${style.photoPrompt}. ${style.videoPrompt}.`,
    `Reference images: ${referenceNotes}`,
    `Mood and pace: ${MOTION_INTENSITY_LABELS[motionIntensity]} energy.`,
    `Audio: ${voiceDirective}`,
    `Aspect ratio: 9:16 vertical.`,
  ].join(" ");
}

/**
 * Prompt vidéo Kling 3.0 (US) — structure imposée : Scène → Personnages →
 * Action → Caméra → Audio & Style, en shot avec timecode et labels
 * personnage explicites. 20-50 mots visés par shot (un prompt à 300 mots
 * fait halluciner Kling) — reste volontairement concis.
 */
export function buildKlingVideoPrompt(
  scene: Pick<Scene, "cameraMovement" | "videoPrompt" | "durationSeconds" | "characters">,
  style: StylePreset,
  motionIntensity: MotionIntensity,
  voiceDirective: string,
  characterNames: Record<string, string> | undefined
): string {
  const cameraPhrase = CAMERA_MOVEMENT_VIDEO_PHRASES[scene.cameraMovement];
  const labels = scene.characters
    .map((id) => characterNames?.[id])
    .filter((name): name is string => !!name)
    .map((name, i) => `[Character ${String.fromCharCode(65 + i)}: ${name}]`)
    .join(" ");
  return [
    `Shot 1 (0-${scene.durationSeconds}s): ${labels ? `${labels} ` : ""}${scene.videoPrompt}`,
    `Camera: ${cameraPhrase}, natural micro-movements — breathing, hair, fabric, light flicker.`,
    `SFX: ${voiceDirective}`,
    `Style: ${style.photoPrompt}. Animation: ${style.videoPrompt}, ${MOTION_INTENSITY_LABELS[motionIntensity]} pace.`,
    `No morphing textures, stable face, outfit artifact free, no circular motion.`,
    `Aspect ratio 9:16.`,
  ].join(" ");
}

/**
 * Prompt pour générer la fiche de référence d'un personnage récurrent : une
 * seule identité visuelle fixe (visage, coiffure, morphologie, tenue), vue de
 * face + dos + profils sur la même image, fond neutre — sert ensuite de
 * référence visuelle (image_urls) pour garder le personnage cohérent d'une
 * frame à l'autre. Un personnage = UNE seule fiche, jamais de variantes
 * multiples. Un trait physique mentionné dans le script (corpulence, taille...)
 * est une caractéristique du personnage : il est intégré directement dans
 * cette unique fiche, pas géré comme un état à part. Les états ÉMOTIONNELS
 * (fatiguée, choquée, rayonnante...) ne sont JAMAIS gérés ici : ils se
 * décrivent frame par frame dans le prompt d'image de chaque scène.
 *
 * Gabarit fixe — 5 panneaux labellisés côte à côte, identique à chaque
 * génération (mêmes labels, même disposition, même réglet de taille) pour
 * que les fiches de personnages différents restent visuellement comparables
 * entre elles d'un projet à l'autre.
 */
function characterSheetTemplateBlock(characterName: string): string {
  return [
    `Professional character turnaround model sheet, exactly 5 labeled panels side by side in a single horizontal row separated by thin black divider lines, plain light grey background, even flat studio lighting, no shadow on the background, identical character in every panel.`,
    `Panel 1, labeled "FACE CLOSE UP" in small caps top-left: tight head-and-shoulders close-up of the face, neutral expression, looking straight at camera. Below this panel, printed text on separate lines, filled in (not left blank): "NAME: ${characterName}", "AGE:", "HEIGHT: X" (inches)", "WEIGHT:", "GENDER:" — each followed by a short plausible value consistent with the character.`,
    `Panel 2, labeled "FRONT" top-left, with a vertical height-measurement ruler with tick marks along the right edge labeled 'X" (inches)': full body standing straight, facing camera, neutral pose, arms slightly away from the body, feet slightly apart.`,
    `Panel 3, labeled "BACK" top-left, same ruler style: full body seen from directly behind, exact same pose and proportions as panel 2.`,
    `Panel 4, labeled "LEFT PROFILE" top-left, same ruler style: full body seen from the left side, same pose.`,
    `Panel 5, labeled "RIGHT PROFILE" top-left, same ruler style: full body seen from the right side, same pose.`,
    `No other text, no watermark, no extra annotation anywhere else on the image.`,
  ].join(" ");
}

/**
 * Prompt pour extraire de la planche 5 panneaux validée un portrait unique
 * propre (plein pied, fond neutre, sans labels ni réglets) — généré via
 * Nano Banana edit avec la planche en référence, à la validation de la
 * fiche. Ce portrait devient la référence envoyée aux frames (voir
 * CharacterReference.portraitUrl) : bien plus fiable qu'un découpage
 * géométrique de la planche, qui tombait à cheval entre deux panneaux dès
 * que la planche générée n'était pas parfaitement régulière.
 */
export function buildCharacterPortraitPrompt(): string {
  return `A single clean full-body portrait of the exact same character shown in the reference image: identical face, hairstyle, outfit, colors, proportions and design — reproduce this character identically, do not redesign, reinterpret or restyle it. Standing straight, facing the camera, neutral pose, arms slightly away from the body. Plain light grey studio background, even flat lighting. One single full-frame portrait only: no panels, no split view, no side-by-side views, no labels, no measurement rulers, no text, no watermark.`;
}

export function buildCharacterSheetPrompt(
  characterName: string,
  style: StylePreset,
  physicalState?: string
): string {
  const template = characterSheetTemplateBlock(characterName);
  const physicalTrait = physicalState
    ? ` Trait physique du personnage à représenter clairement sur les 5 panneaux : ${physicalState}.`
    : "";
  return `${template}${physicalTrait} Style visuel du personnage : ${style.photoPrompt}. exactly two arms, no extra limbs, anatomically correct hands, no duplicate arms.`;
}

/**
 * Prompt pour générer la référence visuelle d'un lieu/décor détecté dans le
 * script — un plan large et clair du lieu, sans personnage, sans texte,
 * qui sert ensuite de référence visuelle (image_urls) pour garder le décor
 * cohérent d'une frame à l'autre pour toutes les scènes situées au même endroit.
 */
export function buildLocationSheetPrompt(locationName: string, style: StylePreset): string {
  return `Establishing reference shot of this location: ${locationName}. Wide clear view of the empty space, no character, no person, no text, no watermark, natural balanced lighting representative of this place, all key visual elements of the location clearly visible. Style visuel : ${style.photoPrompt}.`;
}

/**
 * BLOC 7 — négatifs obligatoires, toujours en dernier. Modifiable depuis
 * Paramètres > Prompts avancés en cas de problème.
 */
export const DEFAULT_MANDATORY_IMAGE_RULES = [
  "No text, no typography, no letters, no subtitles, no watermarks, no logos, no captions",
  "FULL SCREEN vertical 9:16, no black bars, no borders, no letterbox",
  "exactly two arms, no extra limbs, anatomically correct hands, no duplicate arms",
  "No cluttered background, no extra text, no blurry subject",
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
 * Matériel photo cité explicitement dans chaque prompt frame — renforce le
 * rendu photographique haut de gamme attendu pour des publicités santé.
 * Choix déterministe par frame (dérivé du texte du prompt) pour varier d'une
 * frame à l'autre sans changer à chaque régénération de la même frame.
 */
const CAMERA_GEAR_PHRASES = [
  "shot on Sony A7III, 50mm f1.4 lens, shallow depth of field",
  "shot on Canon 5D Mark IV, 85mm portrait lens",
  "shot on Hasselblad medium format, ultra sharp detail",
  "Kodak Portra 400 film look, soft natural grain",
];

function pickCameraGear(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return CAMERA_GEAR_PHRASES[hash % CAMERA_GEAR_PHRASES.length];
}

/**
 * Construit le prompt final d'une frame en 7 blocs obligatoires, dans l'ordre
 * — chaque bloc sert à éliminer une erreur connue, pas à faire joli :
 * 1. Ancre de style (style.photoPrompt — décrit l'apparence, jamais l'animation)
 * 2. Format explicite (jamais supposé hérité)
 * 3. Personnage principal — fidélité à la référence si fournie, jamais
 *    conditionnelle (seulement affirmée quand la référence existe réellement)
 * 4-5. Cadrage, action, décor et ambiance — le texte détaillé écrit par
 *    Claude pour cette frame précise (scene.imagePrompt)
 * 6. Éléments supplémentaires — fidélité produit si une référence est fournie
 * 7. Négatifs obligatoires + négatif du style (les moteurs câblés n'exposent
 *    pas de paramètre negative_prompt séparé, donc injecté dans le prompt)
 */
export function buildImagePrompt(
  scene: Pick<Scene, "imagePrompt">,
  style: StylePreset,
  brand: Brand | undefined,
  opts: {
    /** Nombre d'images de référence personnage réellement passées en premier dans image_urls (0 si aucune). */
    characterReferenceCount?: number;
    hasProductReference?: boolean;
    hasLocationReference?: boolean;
    customRules?: string;
  } = {}
): string {
  const brandNote = brand ? `Produit : ${brand.name}. ${brand.generationNotes || ""}`.trim() : "";

  // Les images de référence sont toujours passées dans cet ordre exact
  // (voir getReferenceImageInfo) : produit, puis personnages, puis décor —
  // le produit est délibérément placé en premier car c'est l'élément le
  // plus souvent dilué/ignoré par le modèle d'édition quand plusieurs
  // références sont fournies dans le même appel. Les numéroter explicitement
  // évite aussi au modèle de deviner laquelle est laquelle.
  let nextIndex = 1;
  const referenceNotes: string[] = [];
  if (opts.hasProductReference) {
    referenceNotes.push(
      `Reference image ${nextIndex}: the product — always use this exact product image as the visual reference, never invent or approximate the product's packaging, shape, colors, or design. Reproduce this exact bottle/packaging's shape, cap, label design and colors faithfully — the product must be visually faithful to this reference image, do not redesign, reinvent or omit it. It must still be rendered in the same visual style as the rest of the frame: if the style is not photorealistic (paper-cut, claymation, 3D cartoon...), render the product's material/texture in that same style rather than as a plain photo pasted onto a stylized scene.`
    );
    nextIndex += 1;
  } else {
    // Garde-fou explicite : cette scène n'a PAS été indiquée comme contenant le
    // produit (case "Afficher le produit" décochée, ou aucune photo produit
    // valide résolue) — sans cette consigne, un texte de plan mentionnant le
    // produit en passant (hérité du script) peut suffire à en faire inventer un
    // par le modèle, sans référence réelle, même quand ce n'était pas voulu.
    referenceNotes.push(
      `No product should appear in this frame — do not depict any bottle, packaging, box or branded product of any kind here, even if the broader script mentions the product elsewhere.`
    );
  }
  const charCount = opts.characterReferenceCount ?? 0;
  if (charCount === 1) {
    referenceNotes.push(
      `Reference image ${nextIndex}: the main character — same character, unchanged appearance, do not alter face, hair or identity, describe only action/expression/posture for this shot.`
    );
    nextIndex += 1;
  } else if (charCount > 1) {
    referenceNotes.push(
      `Reference images ${nextIndex}-${nextIndex + charCount - 1}: the characters appearing in this scene, each in their own reference image — keep each character's own exact identity as shown, unchanged appearance, do not alter faces, hair or identities, do not merge or swap them, describe only action/expression/posture for this shot.`
    );
    nextIndex += charCount;
  }
  if (opts.hasLocationReference) {
    referenceNotes.push(
      `Reference image ${nextIndex}: the background location — reproduce this exact location/setting faithfully, same layout, same key visual elements, do not redesign the background.`
    );
    nextIndex += 1;
  }
  const referenceNotesText = referenceNotes.join(" ");

  return [
    `${style.photoPrompt},`, // BLOC 1 — ancre de style
    "FULL SCREEN vertical 9:16, no black bars, no borders, no letterbox,", // BLOC 2 — format
    scene.imagePrompt, // BLOC 3-5 — personnage/cadrage/action/décor/ambiance
    brandNote,
    referenceNotesText, // BLOC 6 — éléments supplémentaires
    `${pickCameraGear(scene.imagePrompt)}. High-end health and wellness advertisement, professional editorial quality.`, // matériel photo + contexte d'usage
    `Règles obligatoires :\n${buildMandatoryImageRules(opts.customRules)}`, // BLOC 7 — négatifs
    `À éviter absolument : ${style.negativePrompt}.`,
    `Ultra detailed photorealistic ${style.name} 4K.`,
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
