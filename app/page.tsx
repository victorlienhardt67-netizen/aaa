"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { StyleCard } from "@/components/ui/StyleCard";
import { fmtUsd, fmtCredits, fmtTime, creditsToUsd } from "@/lib/format";

export default function Dashboard() {
  const hydrated = useHydrated();
  const router = useRouter();
  const runs = useStore((s) => s.runs);
  const styles = useStore((s) => s.styles);
  const generations = useStore((s) => s.generations);
  const createRun = useStore((s) => s.createRun);

  const runsList = Object.values(runs).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const today = new Date().toDateString();
  const todayGens = generations.filter((g) => new Date(g.createdAt).toDateString() === today);
  const spentCredits = todayGens.reduce((n, g) => n + g.costCredits, 0);
  const running = runsList.reduce(
    (n, r) => n + r.scenes.filter((s) => s.frame.status === "running" || s.clip.status === "running").length, 0
  );

  const start = (styleId: string) => { const id = createRun(styleId); router.push(`/run/${id}`); };
  const videoStyles = styles.filter((s) => s.group === "video" && !s.soon);

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="hello">Bonjour <span style={{ WebkitTextFillColor: "initial" }}>👋</span></h1>
        <p className="muted">Ton studio de production d'ads IA.</p>
      </header>

      <div className="tiles">
        <div className="tile">
          <div className="eyebrow">Crédits KIE</div>
          <div className="tile-val goldtext">—</div>
          <div className="tile-foot">ajoute ta clé dans Réglages</div>
        </div>
        <div className="tile">
          <div className="eyebrow">HeyGen</div>
          <div className="tile-val goldtext">—</div>
          <div className="tile-foot">abonnement lip-sync</div>
        </div>
        <div className="tile">
          <div className="eyebrow">Dépensé aujourd'hui</div>
          <div className="tile-val mono">{hydrated ? fmtUsd(creditsToUsd(spentCredits, "mock")) : "—"}</div>
          <div className="tile-foot mono">{hydrated ? `${fmtCredits(spentCredits)} · ${todayGens.length} gén` : "—"}</div>
        </div>
        <div className="tile">
          <div className="eyebrow">Générations en cours</div>
          <div className="tile-val mono">{hydrated ? running : 0}</div>
          <div className="tile-foot">disque : 28.8 Go libres sur 40</div>
          <div className="meter"><i style={{ width: "72%" }} /></div>
        </div>
      </div>

      {hydrated && runsList.length > 0 && (
        <section>
          <div className="sec-head"><span className="eyebrow">↻ Reprendre un projet</span></div>
          <div className="resume-grid">
            {runsList.slice(0, 6).map((r) => {
              const style = styles.find((s) => s.id === r.styleId);
              const frames = r.scenes.filter((s) => s.frame.status === "done").length;
              const clips = r.scenes.filter((s) => s.clip.status === "done").length;
              const poster = r.scenes.find((s) => s.frame.url)?.frame.url;
              return (
                <Link key={r.id} href={`/run/${r.id}`} className="resume-card">
                  <div className="resume-thumb" style={{ ["--accent" as any]: style?.accent ?? "var(--gold)" }}>
                    {poster ? <img src={poster} alt="" /> : <span className="resume-emoji">{style?.emoji}</span>}
                    <span className="resume-time mono">{fmtTime(r.updatedAt)}</span>
                    <span className="resume-tag mono">{style?.emoji} {style?.name}</span>
                  </div>
                  <div className="resume-meta">
                    <div className="resume-name">{r.name}</div>
                    <div className="mono resume-stats">{frames} img · {clips} clips · {r.brandId}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="sec-head"><span className="eyebrow">✦ Nouveau projet</span></div>
        <div className="new-grid">
          {videoStyles.map((s) => <StyleCard key={s.id} style={s} onClick={() => start(s.id)} />)}
        </div>
      </section>

      <style jsx>{`
        .page { padding: 26px 30px 60px; max-width: 1240px; }
        .page-head { margin-bottom: 22px; }
        .hello { font-size: 30px; }
        .muted { color: var(--ink-muted); margin-top: 4px; }
        .tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 34px; }
        .tile { background: var(--graphite); border: 1px solid var(--hairline); border-radius: 12px; padding: 16px; }
        .tile-val { font-family: var(--font-display); font-size: 27px; font-weight: 600; margin-top: 10px; }
        .tile-foot { margin-top: 6px; font-size: 11px; color: var(--ink-muted); }
        .meter { height: 4px; border-radius: 2px; background: var(--hairline); margin-top: 12px; overflow: hidden; }
        .meter > i { display: block; height: 100%; background: linear-gradient(90deg, var(--gold-deep), var(--gold-leaf)); }
        section { margin-top: 30px; }
        .sec-head { margin-bottom: 14px; }
        .resume-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
        .resume-card { background: var(--graphite); border: 1px solid var(--hairline); border-radius: 12px; overflow: hidden; transition: border-color .15s ease; }
        .resume-card:hover { border-color: rgba(201,162,75,.4); }
        .resume-thumb { position: relative; aspect-ratio: 4/3; display: grid; place-items: center; overflow: hidden;
          background: radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%), linear-gradient(160deg,#17130d,#0d0d0f); }
        .resume-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .resume-emoji { font-size: 30px; color: var(--accent); }
        .resume-time { position: absolute; top: 7px; right: 8px; font-size: 10px; color: var(--ink); background: rgba(0,0,0,.4); padding: 2px 6px; border-radius: 5px; }
        .resume-tag { position: absolute; left: 8px; top: 7px; font-size: 9.5px; color: var(--ink); background: rgba(0,0,0,.45); padding: 2px 7px; border-radius: 5px; }
        .resume-meta { padding: 10px 12px; }
        .resume-name { font-weight: 600; font-size: 13.5px; }
        .resume-stats { font-size: 10.5px; color: var(--ink-muted); margin-top: 3px; }
        .new-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: 14px; }
        @media (max-width: 900px) { .tiles { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  );
}
