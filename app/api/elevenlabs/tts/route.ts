import { NextRequest, NextResponse } from "next/server";
import { uploadFileToFalStorage } from "@/lib/falServer";
import { VoiceArchetype } from "@/types";

// Modèle multilingue (FR/EN/...) — nécessaire ici car un même projet peut
// mélanger des scènes françaises et anglaises (Lynae en FR, T-men/Venalys en EN).
const ELEVENLABS_TTS_MODEL_ID = "eleven_multilingual_v2";
const ELEVENLABS_VOICES_URL = "https://api.elevenlabs.io/v1/voices";
const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

interface ElevenLabsVoice {
  voice_id: string;
  name?: string;
  description?: string;
  labels?: Record<string, string>;
}

/**
 * Critères de filtrage par archétype — genre ET/OU mots-clés cherchés dans les
 * métadonnées de la voix (labels ElevenLabs : gender, age, description,
 * use_case... + le nom/la description libre de la voix, en repli si les labels
 * sont absents). Jamais de voice_id en dur : uniquement des critères appliqués
 * à la vraie liste de voix du compte, pour ne jamais dépendre d'un identifiant
 * qui pourrait ne pas exister chez l'utilisateur.
 */
const ARCHETYPE_CRITERIA: Partial<Record<VoiceArchetype, { genders?: string[]; keywords?: string[] }>> = {
  young_woman: { genders: ["female"], keywords: ["young"] },
  mature_woman: { genders: ["female"], keywords: ["middle_aged", "old", "mature"] },
  young_man: { genders: ["male"], keywords: ["young"] },
  mature_man: { genders: ["male"], keywords: ["middle_aged", "old", "mature"] },
  villain: { keywords: ["villain", "intense", "deep", "sinister", "dark", "menacing", "evil", "raspy"] },
  narrator: { keywords: ["narration", "narrator", "documentary", "calm", "neutral"] },
  energetic: { keywords: ["energetic", "upbeat", "excited", "enthusiastic", "hype"] },
  warm_friendly: { keywords: ["warm", "friendly", "soft", "gentle", "kind"] },
};

function hashKey(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function voiceGender(v: ElevenLabsVoice): string {
  return (v.labels?.gender ?? "").toLowerCase();
}

function voiceText(v: ElevenLabsVoice): string {
  const labels = v.labels ?? {};
  return [labels.description, labels.age, labels.use_case, labels.accent, v.description, v.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Réduit la liste de voix aux candidates correspondant à l'archétype choisi
 * (ou, en "auto", au genre déduit de la description de voix générée par
 * Claude pour ce personnage) — ne réduit jamais à une liste vide : si un
 * critère ne matche rien, on relâche progressivement (genre seul, puis
 * aucun filtre) plutôt que d'échouer.
 */
function filterVoices(voices: ElevenLabsVoice[], archetype: VoiceArchetype | undefined, voiceHintText: string): ElevenLabsVoice[] {
  const criteria = archetype ? ARCHETYPE_CRITERIA[archetype] : undefined;
  if (criteria) {
    let candidates = voices;
    if (criteria.genders?.length) {
      const byGender = candidates.filter((v) => criteria.genders!.includes(voiceGender(v)));
      if (byGender.length > 0) candidates = byGender;
    }
    if (criteria.keywords?.length) {
      const byKeyword = candidates.filter((v) => criteria.keywords!.some((k) => voiceText(v).includes(k)));
      if (byKeyword.length > 0) candidates = byKeyword;
    }
    return candidates;
  }

  // "auto" (ou archétype inconnu) : déduit le genre depuis la description de
  // voix du personnage (voiceDescription généré par Claude), sinon aucun filtre.
  const hint = voiceHintText.toLowerCase();
  const impliesFemale = /\bfemme\b|\bfemale\b|\bwoman\b|\bwomen\b|\bgirl\b|\belle\b|\bshe\b|\bher\b/.test(hint);
  const impliesMale = /\bhomme\b|\bmale\b|\bman\b|\bmen\b|\bboy\b|\bhe\b|\bhis\b/.test(hint);
  if (impliesFemale && !impliesMale) {
    const byGender = voices.filter((v) => voiceGender(v) === "female");
    if (byGender.length > 0) return byGender;
  }
  if (impliesMale && !impliesFemale) {
    const byGender = voices.filter((v) => voiceGender(v) === "male");
    if (byGender.length > 0) return byGender;
  }
  return voices;
}

/**
 * Choisit une voix ElevenLabs de façon déterministe à partir de la clé du
 * personnage (son assetId), parmi les candidates déjà filtrées — garantit une
 * voix stable et différente d'un personnage à l'autre.
 * Limite connue (acceptable pour ce test) : si la liste de voix du compte
 * change (ajout/suppression), le mapping peut glisser d'un personnage à l'autre.
 */
function pickVoiceId(voices: ElevenLabsVoice[], characterKey: string): string {
  const index = hashKey(characterKey || "default") % voices.length;
  return voices[index].voice_id;
}

/**
 * Génère l'audio d'une réplique via ElevenLabs (TTS, voix choisie
 * automatiquement par personnage — filtrée par archétype/genre) puis
 * l'héberge sur le stockage fal.ai pour obtenir une URL utilisable comme
 * `audio_url` par Kling AI Avatar — sert uniquement au moteur vidéo
 * "kling_ai_avatar" (test), les autres moteurs (Kling 3.0, Grok Video) ne
 * passent pas par cette route.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.elevenLabsApiKey || !body?.falApiKey || !body?.text) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }
  const { elevenLabsApiKey, falApiKey, text, characterKey, voiceArchetype, voiceHintText } = body as {
    elevenLabsApiKey: string;
    falApiKey: string;
    text: string;
    characterKey?: string;
    voiceArchetype?: VoiceArchetype;
    voiceHintText?: string;
  };

  try {
    const voicesRes = await fetch(ELEVENLABS_VOICES_URL, {
      headers: { "xi-api-key": elevenLabsApiKey },
    });
    if (!voicesRes.ok) {
      const detail = await voicesRes.text().catch(() => "");
      return NextResponse.json(
        { error: `elevenlabs_voices_error_${voicesRes.status}`, detail: detail.slice(0, 300) },
        { status: voicesRes.status }
      );
    }
    const voicesData = await voicesRes.json();
    const voices: ElevenLabsVoice[] = Array.isArray(voicesData?.voices) ? voicesData.voices : [];
    if (voices.length === 0) {
      return NextResponse.json({ error: "elevenlabs_no_voice_available" }, { status: 422 });
    }
    const candidates = filterVoices(voices, voiceArchetype, voiceHintText ?? "");
    const voiceId = pickVoiceId(candidates.length > 0 ? candidates : voices, characterKey ?? "");

    const ttsRes = await fetch(`${ELEVENLABS_TTS_URL}/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({ text, model_id: ELEVENLABS_TTS_MODEL_ID }),
    });
    if (!ttsRes.ok) {
      const detail = await ttsRes.text().catch(() => "");
      return NextResponse.json(
        { error: `elevenlabs_tts_error_${ttsRes.status}`, detail: detail.slice(0, 300) },
        { status: ttsRes.status }
      );
    }
    const audioBuffer = await ttsRes.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
    const audioUrl = await uploadFileToFalStorage(audioBlob, falApiKey);

    return NextResponse.json({ audioUrl, voiceId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
