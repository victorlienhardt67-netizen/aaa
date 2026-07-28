import { NextRequest, NextResponse } from "next/server";
import { uploadFileToFalStorage } from "@/lib/falServer";

// Modèle multilingue (FR/EN/...) — nécessaire ici car un même projet peut
// mélanger des scènes françaises et anglaises (Lynae en FR, T-men/Venalys en EN).
const ELEVENLABS_TTS_MODEL_ID = "eleven_multilingual_v2";
const ELEVENLABS_VOICES_URL = "https://api.elevenlabs.io/v1/voices";
const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

interface ElevenLabsVoice {
  voice_id: string;
  name?: string;
}

function hashKey(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Choisit une voix ElevenLabs de façon déterministe à partir de la clé du
 * personnage (son assetId) — garantit une voix stable et différente d'un
 * personnage à l'autre, sans avoir à stocker un mapping persistant côté app.
 * Limite connue (acceptable pour ce test) : si la liste de voix du compte
 * change (ajout/suppression), le mapping peut glisser d'un personnage à l'autre.
 */
function pickVoiceId(voices: ElevenLabsVoice[], characterKey: string): string {
  const index = hashKey(characterKey || "default") % voices.length;
  return voices[index].voice_id;
}

/**
 * Génère l'audio d'une réplique via ElevenLabs (TTS, voix choisie
 * automatiquement par personnage) puis l'héberge sur le stockage fal.ai pour
 * obtenir une URL utilisable comme `audio_url` par Kling AI Avatar — sert
 * uniquement au moteur vidéo "kling_ai_avatar" (test), les autres moteurs
 * (Kling 3.0, Grok Video) ne passent pas par cette route.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.elevenLabsApiKey || !body?.falApiKey || !body?.text) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }
  const { elevenLabsApiKey, falApiKey, text, characterKey } = body as {
    elevenLabsApiKey: string;
    falApiKey: string;
    text: string;
    characterKey?: string;
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
    const voiceId = pickVoiceId(voices, characterKey ?? "");

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
