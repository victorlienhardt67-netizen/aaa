"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import JSZip from "jszip";
import { Package, Download, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { RunToolbar } from "@/components/run/RunToolbar";
import { ScriptPanel } from "@/components/run/ScriptPanel";
import { SceneColumn } from "@/components/run/SceneColumn";
import { fmtUsd, fmtCredits, fmtDuration } from "@/lib/format";

export default function RunPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const run = useStore((s) => s.runs[id]);
  const styles = useStore((s) => s.styles);
  const openTab = useStore((s) => s.openTab);
  const createRun = useStore((s) => s.createRun);

  useEffect(() => { if (hydrated && run) openTab(run.id); }, [hydrated, run, openTab]);

  if (!hydrated) return <div className="empty">Chargement…<style jsx>{`.empty{padding:40px;color:var(--ink-muted)}`}</style></div>;
  if (!run) return (
    <div className="empty">Run introuvable. <a href="/" style={{ color: "var(--gold)" }}>Retour à l'accueil</a>
      <style jsx>{`.empty{padding:40px;color:var(--ink-muted)}`}</style></div>
  );

  const style = styles.find((s) => s.id === run.styleId);
  const analyzed = run.scenes.length > 0;
  const clipsDone = run.scenes.filter((s) => s.clip.status === "done").length;
  const ready = analyzed && clipsDone === run.scenes.length && run.scenes.length > 0;

  const download = async () => {
    const zip = new JSZip();
    const manifest = {
      run: run.name, brand: run.brandId, style: style?.name, format: run.format, mode: run.mode,
      voDuration: run.voDuration, cost: { credits: run.costCredits, usd: run.costUsd },
      edl: run.scenes.map((s) => ({
        id: `SC-${String(s.index).padStart(2, "0")}`, tag: s.tag, framing: s.framing,
        vo: s.voLine, duration: s.clipDuration, sfx: s.sfxSuggestion,
        dialogue: s.isDialogue ? { speaker: run.characters.find((c) => c.id === s.characterId)?.name, line: s.dialogue?.line } : null,
      })),
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    const frames = zip.folder("frames")!;
    run.scenes.forEach((s) => {
      if (s.frame.url?.startsWith("data:image/svg")) {
        const svg = decodeURIComponent(s.frame.url.split(",")[1]);
        frames.file(`SC-${String(s.index).padStart(2, "0")}.svg`, svg);
      }
    });
    zip.file("README.txt", `GULDUST STUDIO — export run "${run.name}"\n${run.scenes.length} scènes · ${clipsDone} clips\nCoût : ${fmtCredits(run.costCredits)} ≈ ${fmtUsd(run.costUsd)}\n\n(Prototype : frames en SVG placeholder. Le réel exportera les .mp4.)`);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `guldust-${run.name.toLowerCase().replace(/\s+/g, "-")}.zip`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="run">
      <RunToolbar run={run} style={style} />
      <div className="run-body">
        <ScriptPanel run={run} style={style} />
        <div className="canvas">
          <div className="hint mono">1 idée VO = 1 scène = 1 décor · le fil d'or relie frame → vidéo</div>
          {!analyzed ? (
            <div className="canvas-empty">
              <Sparkles size={30} style={{ color: "var(--gold)", opacity: .6 }} />
              <p>Colle ton script à gauche et lance <b>Analyser</b>.<br />Les scènes apparaîtront ici, reliées par le fil d'or.</p>
            </div>
          ) : (
            <div className="rows">
              {run.scenes.map((sc) => <SceneColumn key={sc.id} run={run} scene={sc} />)}
            </div>
          )}
        </div>
      </div>

      {ready && (
        <div className="delivery">
          <Package size={16} style={{ color: "var(--ok)" }} />
          <b>Prêt pour le montage — {clipsDone} clips</b>
          <span className="mono" style={{ color: "var(--ink-muted)" }}>· {fmtCredits(run.costCredits)} ≈ {fmtUsd(run.costUsd)} · {run.voDuration ? fmtDuration(run.voDuration) : ""}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 9 }}>
            <button className="btn-quiet" onClick={() => { const rid = createRun(run.styleId); router.push(`/run/${rid}`); }}><Sparkles size={13} /> Nouveau {style?.name}</button>
            <button className="btn-gold" onClick={download}><Download size={14} /> Télécharger le run (.zip)</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .run { display: flex; flex-direction: column; height: 100%; min-height: 0; }
        .run-body { flex: 1; display: flex; min-height: 0; }
        .canvas { flex: 1; overflow: auto; padding: 18px 20px 30px;
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,.03) 1px, transparent 0); background-size: 22px 22px; }
        .hint { font-size: 11px; color: var(--ink-dim); margin-bottom: 16px; letter-spacing: .03em; }
        .rows { display: flex; gap: 16px; align-items: flex-start; padding-bottom: 20px; }
        .canvas-empty { height: 70%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; color: var(--ink-muted); }
        .delivery { display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-top: 1px solid var(--hairline); background: var(--graphite); font-size: 13.5px; }
      `}</style>
    </div>
  );
}
