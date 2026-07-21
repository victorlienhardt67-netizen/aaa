"use client";
import { useParams, useRouter } from "next/navigation";
import { Play, Sparkles, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { VOICES } from "@/lib/seed";

const CONFIG: Record<string, { title: string; emoji: string; desc: string; styleKey?: string; ready?: boolean }> = {
  "create-avatar": { title: "Create Avatar", emoji: "✦", desc: "Génère un avatar UGC cohérent (femme + produit) réutilisable sur tout un run.", styleKey: "create-avatar", ready: true },
  "native-ads": { title: "Native Ads", emoji: "▤", desc: "Recrée un lot d'images publicitaires natives déclinées à l'identité de la marque active.", styleKey: "native-ads", ready: true },
  "adapt-crea": { title: "Adapt Créa", emoji: "✎", desc: "Reprend une créa performante et l'adapte au produit et à la marque active.", styleKey: "adapt-crea", ready: true },
  "visualiseur": { title: "Visualiseur", emoji: "▦", desc: "Prévisualise et compare tes plans générés côte à côte avant montage.", ready: false },
  "voices": { title: "Voix", emoji: "🎙", desc: "Bibliothèque de voix persistantes assignées aux personnages (mode dialogue).", ready: true },
  "scripts": { title: "Scripts", emoji: "📝", desc: "Rédige et structure tes scripts (Hook · Problème · Agitation · Solution · Preuve · CTA) avec Claude + Brand DNA.", ready: false },
  "copy-ads": { title: "Copy Ads", emoji: "🗂", desc: "Génère des variations de copy publicitaire à partir du Brand DNA.", ready: false },
};

export default function ToolPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { tool } = useParams<{ tool: string }>();
  const createRun = useStore((s) => s.createRun);
  const cfg = CONFIG[tool] ?? { title: tool, emoji: "◆", desc: "", ready: false };

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-ic">{cfg.emoji}</div>
        <h1>{cfg.title}</h1>
        <p className="desc">{cfg.desc}</p>

        {cfg.styleKey && cfg.ready && (
          <button className="btn-gold" onClick={() => { const id = createRun(cfg.styleKey!); router.push(`/run/${id}`); }}>
            <Sparkles size={15} /> Démarrer <ArrowRight size={14} />
          </button>
        )}

        {tool === "voices" && hydrated && (
          <div className="voices">
            {VOICES.map((v) => (
              <div key={v.id} className="voice">
                <button className="v-play"><Play size={12} /></button>
                <div><div className="v-name">{v.name}</div><div className="mono v-meta">{v.lang} · {v.gender === "f" ? "féminine" : v.gender === "m" ? "masculine" : "neutre"}</div></div>
                <span className="mono v-id">{v.id}</span>
              </div>
            ))}
          </div>
        )}

        {!cfg.ready && tool !== "voices" && (
          <div className="soon-note mono">⚙ Module en cours de câblage — le socle est prêt, la logique se branche avec les providers.</div>
        )}
      </div>

      <style jsx>{`
        .page { padding: 40px 30px; display: grid; place-items: start center; }
        .hero { max-width: 560px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; padding-top: 30px; }
        .hero-ic { width: 68px; height: 68px; border-radius: 16px; display: grid; place-items: center; font-size: 32px; background: radial-gradient(120% 100% at 50% 0%, rgba(201,162,75,.28), transparent 60%), linear-gradient(160deg,#17130d,#0d0d0f); border: 1px solid var(--hairline); color: var(--gold); }
        h1 { font-size: 30px; }
        .desc { color: var(--ink-muted); font-size: 14px; line-height: 1.6; max-width: 460px; }
        .voices { width: 100%; display: flex; flex-direction: column; gap: 9px; margin-top: 10px; }
        .voice { display: flex; align-items: center; gap: 12px; background: var(--graphite); border: 1px solid var(--hairline); border-radius: 10px; padding: 11px 13px; text-align: left; }
        .v-play { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--gold); color: var(--gold); display: grid; place-items: center; background: transparent; }
        .v-name { font-weight: 600; font-size: 13.5px; } .v-meta { font-size: 10.5px; color: var(--ink-muted); margin-top: 1px; }
        .v-id { margin-left: auto; font-size: 10px; color: var(--ink-dim); }
        .soon-note { margin-top: 10px; font-size: 11.5px; color: var(--ink-dim); background: var(--graphite); border: 1px solid var(--hairline); border-radius: 10px; padding: 13px 16px; }
      `}</style>
    </div>
  );
}
