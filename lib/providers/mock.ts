// ============================================================
// Adaptateur MOCK — rend l'app entièrement fonctionnelle sans
// aucune clé API. Génère des placeholders visuels crédibles
// (SVG data-URI) et simule coûts + latence.
// Remplacer par les adaptateurs réels (KIE, HeyGen…) une fois
// les docs providers fournies.
// ============================================================
import type {
  Providers, ImageParams, VideoParams, TTSParams, LipSyncParams,
  AnalyzeParams, AnalyzeResult, AnalyzedScene, GenResult,
} from "./types";
import type { NarrativeTag } from "../types";
import { FRAMINGS, MOCK_COSTS } from "../seed";

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// ---- Placeholder visuel d'une frame (9:16) ----
function frameSVG(opts: { label: string; framing: string; accent: string; tag: string; seed: number }): string {
  const { label, framing, accent, seed } = opts;
  const a = accent || "#c9a24b";
  const dots = Array.from({ length: 26 }, (_, i) => {
    const x = (hash(`${seed}x${i}`) % 900) / 10;
    const y = (hash(`${seed}y${i}`) % 1600) / 10;
    const r = 0.4 + (hash(`${seed}r${i}`) % 12) / 10;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="0.05"/>`;
  }).join("");
  const cx = 45, by = 108;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640" viewBox="0 0 90 160">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="${a}" stop-opacity="0.34"/>
        <stop offset="0.55" stop-color="#141210" stop-opacity="1"/>
        <stop offset="1" stop-color="#0b0b0d"/>
      </linearGradient>
      <radialGradient id="v" cx="0.5" cy="0.42" r="0.7">
        <stop offset="0" stop-color="${a}" stop-opacity="0.22"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="90" height="160" fill="#100e0c"/>
    <rect width="90" height="160" fill="url(#g)"/>
    <rect width="90" height="160" fill="url(#v)"/>
    ${dots}
    <g transform="translate(${cx},${by})" opacity="0.9">
      <rect x="-6" y="-2" width="12" height="26" rx="3" fill="#1c1712" stroke="${a}" stroke-opacity="0.5" stroke-width="0.5"/>
      <rect x="-3.5" y="-7" width="7" height="6" rx="1.2" fill="#241d16"/>
      <rect x="-2" y="-13" width="4" height="7" rx="1" fill="${a}" opacity="0.55"/>
      <rect x="-4" y="4" width="8" height="14" rx="1.5" fill="${a}" opacity="0.14"/>
    </g>
    <text x="6" y="14" font-family="monospace" font-size="4.4" fill="#ffffff" opacity="0.55" letter-spacing="0.4">${label}</text>
    <text x="6" y="150" font-family="monospace" font-size="3.6" fill="${a}" opacity="0.85" letter-spacing="0.3">${framing.slice(0, 22)}</text>
    <rect x="0" y="0" width="90" height="160" fill="none" stroke="${a}" stroke-opacity="0.12" stroke-width="0.5"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function detectTag(text: string, i: number, n: number): NarrativeTag {
  const t = text.toLowerCase();
  if (/(\-?\d+\s?%|rembours|garantie|command|clique|maintenant|offre|profite)/.test(t)) return "cta";
  if (/(en deux semaines|remarque|résultat|preuve|avant|après|témoign|note)/.test(t)) return "preuve";
  if (/(en liquide|pipette|solution|c'est|voici|la différence|au lieu)/.test(t) && i > n * 0.35) return "solution";
  if (/(problème|marche pas|inefficace|agress|au fond du placard|jamais)/.test(t)) return "probleme";
  if (/(lourd|bouffi|gonfl|retien|fatig|honte|marre|frustr)/.test(t)) return "agitation";
  if (i === 0) return "hook";
  const cycle: NarrativeTag[] = ["hook", "probleme", "agitation", "solution", "preuve", "cta"];
  return cycle[Math.min(cycle.length - 1, Math.floor((i / Math.max(1, n)) * cycle.length))];
}

function detectDialogue(text: string): { isDialogue: boolean; speaker?: string; line?: string } {
  const q = text.match(/[«"“]([^»"”]{3,})[»"”]/);
  const dash = /^\s*[—–-]\s+/.test(text);
  const saidMatch = text.match(/([A-ZÉÈÀ][\wÀ-ÿ' ]{2,30})\s*(?:dit|répond|lance|murmure|s'exclame)\s*[:,]/i);
  if (saidMatch) return { isDialogue: true, speaker: saidMatch[1].trim(), line: q ? q[1] : text };
  if (q) return { isDialogue: true, line: q[1] };
  if (dash) return { isDialogue: true, line: text.replace(/^\s*[—–-]\s+/, "") };
  return { isDialogue: false };
}

function splitScript(script: string): string[] {
  return script
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?…»"”])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

export const mockProviders: Providers = {
  async analyze(p: AnalyzeParams): Promise<AnalyzeResult> {
    await wait(700);
    const sentences = splitScript(p.script);
    const n = sentences.length || 1;
    const totalVo = p.voDuration ?? Math.max(20, n * 4.2);
    const perWord = 0.36;
    const characters = new Map<string, { name: string }>();
    const scenes: AnalyzedScene[] = sentences.map((text, i) => {
      const words = text.split(/\s+/).length;
      const duration = Math.max(2.2, Math.min(9, words * perWord));
      const tag = detectTag(text, i, n);
      const dlg = p.mode === "vo" ? { isDialogue: false } : detectDialogue(text);
      if (dlg.isDialogue && dlg.speaker) characters.set(dlg.speaker, { name: dlg.speaker });
      return {
        tag,
        framing: FRAMINGS[i % FRAMINGS.length],
        voLine: text,
        duration: Math.round(duration * 100) / 100,
        isDialogue: !!dlg.isDialogue,
        speaker: dlg.speaker,
        line: dlg.line,
      };
    });
    if (characters.size === 0) {
      ["La Goutte Miel", "La Légèreté"].forEach((name) => characters.set(name, { name }));
    }
    return {
      scenes,
      characters: Array.from(characters.values()).map((c) => ({ name: c.name })),
      voDuration: Math.round(totalVo * 100) / 100,
    };
  },

  async image(p: ImageParams): Promise<GenResult> {
    await wait(600 + (hash(p.prompt) % 500));
    const seed = p.seed ?? hash(p.prompt + p.label);
    const url = frameSVG({
      label: p.label ?? "SC",
      framing: p.prompt.slice(0, 24),
      accent: p.accent ?? "#c9a24b",
      tag: "",
      seed,
    });
    return { url, provider: "mock", model: p.model, costCredits: MOCK_COSTS.frame, seed };
  },

  async video(p: VideoParams): Promise<GenResult> {
    await wait(900 + (hash(p.frameUrl) % 700));
    return {
      url: p.frameUrl,
      provider: "mock",
      model: p.model,
      costCredits: MOCK_COSTS.clip,
      duration: p.duration,
    };
  },

  async tts(p: TTSParams): Promise<GenResult> {
    await wait(400);
    const words = p.text.split(/\s+/).length;
    const duration = Math.max(1.2, Math.round(words * 0.36 * 100) / 100);
    return { url: `mock-tts://${p.voiceId}`, provider: "mock", model: "tts-mock", costCredits: MOCK_COSTS.tts, duration };
  },

  async lipsync(p: LipSyncParams): Promise<GenResult> {
    await wait(800);
    return { url: p.frameUrl, provider: "mock", model: "lipsync-mock", costCredits: MOCK_COSTS.lipsync };
  },
};
