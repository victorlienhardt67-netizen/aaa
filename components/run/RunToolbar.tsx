"use client";
import { useState } from "react";
import { Zap, Clapperboard } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Run, Style, RunMode, AspectRatio } from "@/lib/types";
import { fmtUsd } from "@/lib/format";

const MODES: { key: RunMode; label: string }[] = [
  { key: "vo", label: "VO seule" },
  { key: "dialogue", label: "Dialogue" },
  { key: "mixte", label: "Mixte" },
];
const FORMATS: AspectRatio[] = ["9:16", "1:1", "4:5", "16:9"];

export function RunToolbar({ run, style }: { run: Run; style?: Style }) {
  const setRunMode = useStore((s) => s.setRunMode);
  const updateRun = useStore((s) => s.updateRun);
  const generateAllFrames = useStore((s) => s.generateAllFrames);
  const generateAllClips = useStore((s) => s.generateAllClips);
  const [busy, setBusy] = useState<"frames" | "clips" | null>(null);

  const framesDone = run.scenes.filter((s) => s.frame.status === "done").length;
  const clipsDone = run.scenes.filter((s) => s.clip.status === "done").length;
  const n = run.scenes.length;
  const canGen = n > 0;

  const doFrames = async () => { setBusy("frames"); await generateAllFrames(run.id); setBusy(null); };
  const doClips = async () => { setBusy("clips"); await generateAllClips(run.id); setBusy(null); };

  return (
    <div className="toolbar">
      <span className="pill" style={{ borderColor: "rgba(201,162,75,.4)", color: style?.accent ?? "var(--gold)" }}>
        <b style={{ color: style?.accent ?? "var(--gold)" }}>{style?.emoji} {style?.name}</b>
      </span>
      <span className="pill">Voix <b>drop MP3</b></span>
      <span className="pill">Image <b>{run.imageModel}</b></span>
      <span className="pill">Vidéo <b>{run.videoModel}</b></span>

      <label className="pill select-pill">◳ <b>{run.format}</b>
        <select value={run.format} onChange={(e) => updateRun(run.id, { format: e.target.value as AspectRatio })}>
          {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>

      <div className="mode-seg">
        {MODES.map((m) => (
          <button key={m.key} data-active={run.mode === m.key} onClick={() => setRunMode(run.id, m.key)}>{m.label}</button>
        ))}
      </div>

      <span className="pill mono" style={{ borderColor: "rgba(201,162,75,.35)", color: "var(--gold)" }}>
        {framesDone}/{n} · 🖼 {clipsDone}/{n} {clipsDone === n && n > 0 ? "✓" : ""}
      </span>

      {run.costCredits > 0 && <span className="pill mono">{fmtUsd(run.costUsd)}</span>}

      <div style={{ marginLeft: "auto", display: "flex", gap: 9 }}>
        <button className="btn-ghost" onClick={doClips} disabled={!canGen || framesDone === 0 || busy !== null}>
          <Clapperboard size={14} /> {busy === "clips" ? "Animation…" : "Tout animer"}
        </button>
        <button className="btn-gold shimmer" onClick={doFrames} disabled={!canGen || busy !== null}>
          <Zap size={14} /> {busy === "frames" ? "Génération…" : "Tout générer"}
        </button>
      </div>

      <style jsx>{`
        .toolbar { display: flex; align-items: center; gap: 9px; padding: 11px 18px; border-bottom: 1px solid var(--hairline); background: var(--graphite); flex-wrap: wrap; }
        .select-pill { position: relative; cursor: pointer; }
        .select-pill select { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .mode-seg { display: inline-flex; border: 1px solid var(--hairline); border-radius: 8px; overflow: hidden; background: var(--slate); }
        .mode-seg button { padding: 6px 11px; font-size: 12px; color: var(--ink-muted); border: 0; background: transparent; border-right: 1px solid var(--hairline); }
        .mode-seg button:last-child { border-right: 0; }
        .mode-seg button[data-active="true"] { color: #221a06; background: linear-gradient(160deg, var(--gold-leaf), var(--gold-deep)); font-weight: 700; }
      `}</style>
    </div>
  );
}
