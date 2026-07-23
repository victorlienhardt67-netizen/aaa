// Générateurs de données mockées réalistes — remplacés plus tard par les vraies intégrations API.

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const GOLD_PALETTE = ["#C9A84C", "#E8C96A", "#8A7233", "#3a3a2f", "#1a1a15"];

/**
 * Génère une image placeholder en SVG data URI (format 9:16), déterministe selon le seed.
 * Simule le retour d'une génération d'image IA (Nano Banana / Flux Pro / Ideogram).
 */
export function generatePlaceholderFrame(seed: string, label: string): string {
  const h = hashSeed(seed);
  const c1 = GOLD_PALETTE[h % GOLD_PALETTE.length];
  const c2 = GOLD_PALETTE[(h + 2) % GOLD_PALETTE.length];
  const angle = h % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="405" height="720" viewBox="0 0 405 720">
    <defs>
      <linearGradient id="g" gradientTransform="rotate(${angle})">
        <stop offset="0%" stop-color="#0A0A0A"/>
        <stop offset="55%" stop-color="${c2}22"/>
        <stop offset="100%" stop-color="${c1}33"/>
      </linearGradient>
    </defs>
    <rect width="405" height="720" fill="url(#g)"/>
    <rect x="0" y="0" width="405" height="720" fill="none" stroke="${c1}" stroke-opacity="0.35" stroke-width="2"/>
    <circle cx="${100 + (h % 200)}" cy="${150 + (h % 300)}" r="${60 + (h % 40)}" fill="${c1}" fill-opacity="0.12"/>
    <text x="24" y="660" font-family="monospace" font-size="13" fill="${c1}" opacity="0.85">FRAME PREVIEW</text>
    <text x="24" y="684" font-family="monospace" font-size="11" fill="#888880">${label.slice(0, 46)}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${toBase64(svg)}`;
}

function toBase64(input: string): string {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(unescape(encodeURIComponent(input)));
  }
  return Buffer.from(input, "utf-8").toString("base64");
}

/**
 * Placeholder vidéo — en attendant le branchement réel fal.ai / Higgsfield.
 * Utilise une vidéo d'exemple publique en 9:16-friendly comme aperçu factice.
 */
export function generatePlaceholderVideoUrl(seed: string): string {
  const samples = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  ];
  const h = hashSeed(seed);
  return samples[h % samples.length];
}

export function simulatedDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function estimateImageCost(engine: string): number {
  const costs: Record<string, number> = {
    nano_banana: 0.02,
    flux_pro: 0.05,
    ideogram_v3: 0.04,
    auto: 0.03,
  };
  return costs[engine] ?? 0.03;
}

export function estimateVideoCost(engine: string, durationSeconds: number): number {
  const perSecond: Record<string, number> = {
    kling_3_0: 0.45,
    grok_video: 0.4,
    seedance_2_0: 0.5,
    auto: 0.4,
  };
  return (perSecond[engine] ?? 0.4) * durationSeconds;
}
