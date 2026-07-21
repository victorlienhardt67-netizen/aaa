"use client";
import { useRef, useState } from "react";
import { Sparkles, Upload, Wand2, UserPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Run, Style } from "@/lib/types";
import { fmtDuration } from "@/lib/format";
import { TagChip } from "@/components/ui/TagChip";

const TONES = ["tendre / complice", "punchy / cash", "expert / rassurant", "fun / meme", "premium / posé"];

const SAMPLE = `Si tu as déjà rangé un drainant au fond du placard en te disant "encore un truc qui marche pas", écoute deux secondes. Le problème c'est pas toi, c'est ce qu'on t'a vendu. Les tisanes détox, c'est de l'eau chaude. Les diurétiques agressifs, tu te vides et l'effet yoyo revient en pire. Et les gélules sous-dosées, ta lymphe s'en moque. En liquide, dans une pipette qui s'absorbe directement sous la langue, sans passer par l'estomac. Un geste de dix secondes le matin dans ton verre d'eau. Goût miel, zéro alcool, pas de sucre. En deux semaines tu peux remarquer des jambes moins lourdes le soir, un visage moins bouffi au réveil, cette sensation de légèreté qui revient. En ce moment moins 40 pour cent sur la première commande, garantie satisfaite ou remboursée à 100 pour cent.`;

export function ScriptPanel({ run, style }: { run: Run; style?: Style }) {
  const updateRun = useStore((s) => s.updateRun);
  const analyzeRun = useStore((s) => s.analyzeRun);
  const addCharacter = useStore((s) => s.addCharacter);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onVo = (f?: File) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      updateRun(run.id, { voFileName: f.name, voDuration: isFinite(audio.duration) ? audio.duration : undefined });
    });
  };

  const analyze = async () => { setAnalyzing(true); await analyzeRun(run.id); setAnalyzing(false); };
  const analyzed = run.status !== "draft" && run.scenes.length > 0;

  return (
    <div className="panel">
      <div className="block">
        <div className="block-head"><Sparkles size={14} style={{ color: "var(--gold)" }} /><span>Script + cadrage</span><span className="mono block-tag">Claude + DNA</span></div>
        <input className="input" placeholder="Nom du projet (optionnel)" value={run.name}
          onChange={(e) => updateRun(run.id, { name: e.target.value })} />

        {style && style.presets.length > 0 && (
          <div className="presets">
            {style.presets.map((p) => (
              <button key={p.id} className="preset" data-active={run.presetId === p.id} onClick={() => updateRun(run.id, { presetId: p.id })}>
                <span className="preset-emoji">{p.emoji}</span>
                <div><div className="preset-name">{p.name}</div><div className="preset-desc">{p.description}</div></div>
              </button>
            ))}
          </div>
        )}

        <div className="script-wrap">
          <textarea className="input script" placeholder="Colle ton script ici…" value={run.script}
            onChange={(e) => updateRun(run.id, { script: e.target.value })} />
          {!run.script && <button className="fill" onClick={() => updateRun(run.id, { script: SAMPLE })}>Remplir avec l'exemple Lynae</button>}
        </div>

        <label className="vo-drop">
          <Upload size={14} />
          <span>{run.voFileName ? run.voFileName : "Ta VO finale (.mp3)"}</span>
          <span className="mono vo-oblig">{run.voDuration ? fmtDuration(run.voDuration) : "obligatoire"}</span>
          <input ref={fileRef} type="file" accept="audio/*" hidden onChange={(e) => onVo(e.target.files?.[0])} />
        </label>

        <select className="input" value={run.tone} onChange={(e) => updateRun(run.id, { tone: e.target.value })}>
          {TONES.map((t) => <option key={t}>{t}</option>)}
        </select>

        <button className="btn-gold analyze" onClick={analyze} disabled={!run.script || analyzing}>
          <Wand2 size={14} /> {analyzing ? "Analyse en cours…" : "Analyser → moodboard + casting"}
        </button>
      </div>

      {analyzed && (
        <div className="block">
          <div className="block-head"><span>Voix off</span><span className="mono block-tag">{run.voDuration ? fmtDuration(run.voDuration) : ""} · durées calées</span></div>
          <div className="vo-lines">
            {run.voLines.map((l) => {
              const sc = run.scenes[l.index - 1];
              return (
                <div key={l.index} className="vo-line">
                  <span className="mono vo-num">{String(l.index).padStart(2, "0")}</span>
                  {sc && <TagChip tag={sc.tag} size="xs" />}
                  <span className="vo-text">{l.text}</span>
                  <span className="mono vo-dur">{l.duration.toFixed(1)}s</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {analyzed && (
        <div className="block">
          <div className="block-head"><span>Casting</span><span className="mono block-tag">{run.characters.length} perso · cohérence</span></div>
          <div className="cast">
            {run.characters.map((c) => (
              <div key={c.id} className="cast-item">
                <span className="cast-av" />
                <div style={{ flex: 1 }}>
                  <div className="cast-name">{c.name}</div>
                  <div className="mono cast-meta">{c.source === "photo" ? "depuis photo" : "généré"} · voix {c.voiceId}</div>
                </div>
              </div>
            ))}
            <button className="cast-add" onClick={() => { const n = prompt("Nom du personnage ?"); if (n) addCharacter(run.id, n); }}>
              <UserPlus size={14} /> Nouveau personnage
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .panel { width: 350px; flex: 0 0 auto; border-right: 1px solid var(--hairline); overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .block { background: var(--graphite); border: 1px solid var(--hairline); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
        .block-head { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-weight: 600; font-size: 13.5px; }
        .block-tag { margin-left: auto; font-size: 10px; color: var(--ink-dim); }
        .presets { display: flex; flex-direction: column; gap: 7px; }
        .preset { display: flex; gap: 10px; align-items: flex-start; text-align: left; background: var(--slate); border: 1px solid var(--hairline); border-radius: 9px; padding: 10px; }
        .preset[data-active="true"] { border-color: var(--gold); background: rgba(201,162,75,.07); }
        .preset-emoji { font-size: 18px; } .preset-name { font-weight: 600; font-size: 12.5px; } .preset-desc { font-size: 11px; color: var(--ink-muted); margin-top: 2px; }
        .script-wrap { position: relative; }
        .script { min-height: 130px; resize: vertical; line-height: 1.5; font-size: 12.5px; }
        .fill { position: absolute; bottom: 10px; right: 10px; font-size: 10.5px; color: var(--gold); background: rgba(201,162,75,.1); border: 1px solid rgba(201,162,75,.3); border-radius: 6px; padding: 4px 8px; }
        .vo-drop { display: flex; align-items: center; gap: 9px; border: 1px dashed var(--hairline); border-radius: 9px; padding: 11px 12px; font-size: 12.5px; color: var(--ink-muted); cursor: pointer; }
        .vo-drop:hover { border-color: rgba(201,162,75,.4); }
        .vo-oblig { margin-left: auto; font-size: 10.5px; color: var(--warn); }
        .analyze { justify-content: center; width: 100%; }
        .vo-lines { display: flex; flex-direction: column; gap: 2px; }
        .vo-line { display: grid; grid-template-columns: auto auto 1fr auto; align-items: center; gap: 8px; padding: 6px 4px; border-top: 1px solid var(--hairline-soft); }
        .vo-line:first-child { border-top: 0; }
        .vo-num { font-size: 10px; color: var(--gold); }
        .vo-text { font-size: 12px; color: var(--ink-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vo-dur { font-size: 10px; color: var(--ink-dim); }
        .cast { display: flex; flex-direction: column; gap: 8px; }
        .cast-item { display: flex; align-items: center; gap: 10px; background: var(--slate); border: 1px solid var(--hairline); border-radius: 9px; padding: 9px 10px; }
        .cast-av { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(150deg,#3a2f22,#241b12); border: 1px solid var(--hairline); flex: 0 0 auto; }
        .cast-name { font-weight: 600; font-size: 12.5px; } .cast-meta { font-size: 10px; color: var(--ink-muted); margin-top: 1px; }
        .cast-add { display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px dashed var(--hairline); border-radius: 9px; padding: 9px; font-size: 12px; color: var(--gold); background: transparent; }
        .cast-add:hover { background: rgba(201,162,75,.06); }
      `}</style>
    </div>
  );
}
