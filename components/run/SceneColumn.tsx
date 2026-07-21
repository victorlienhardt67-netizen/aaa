"use client";
import { useState } from "react";
import { Play, RefreshCw, AlertTriangle, Mic, MessageSquare, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Run, Scene, ProductRole } from "@/lib/types";
import { VOICES } from "@/lib/seed";
import { TagChip } from "@/components/ui/TagChip";

const DURATIONS: (4 | 6 | 8 | 10)[] = [4, 6, 8, 10];
const PRODUCT: { key: ProductRole; label: string }[] = [
  { key: "star", label: "Star du plan" }, { key: "background", label: "En fond" }, { key: "hidden", label: "Masqué" },
];

function StatusDot({ s }: { s: Scene["frame"]["status"] }) {
  const map: any = { empty: "var(--ink-dim)", queued: "var(--warn)", running: "var(--gold-leaf)", done: "var(--ok)", error: "var(--err)" };
  return <span style={{ width: 7, height: 7, borderRadius: "50%", background: map[s], display: "inline-block", animation: s === "running" ? "pulse 1s infinite" : "none" }} />;
}

export function SceneColumn({ run, scene }: { run: Run; scene: Scene }) {
  const patchScene = useStore((s) => s.patchScene);
  const setSceneCharacter = useStore((s) => s.setSceneCharacter);
  const setSceneProduct = useStore((s) => s.setSceneProduct);
  const setDialogue = useStore((s) => s.setDialogue);
  const generateFrame = useStore((s) => s.generateFrame);
  const generateClip = useStore((s) => s.generateClip);
  const generateDialogue = useStore((s) => s.generateDialogue);
  const redoLipSync = useStore((s) => s.redoLipSync);
  const [sel, setSel] = useState(false);

  const id = `SC-${String(scene.index).padStart(2, "0")}`;
  const frameDone = scene.frame.status === "done";
  const clipDone = scene.clip.status === "done";
  const showDialogue = run.mode !== "vo" && scene.isDialogue && scene.dialogue;

  return (
    <div className="col">
      <div className="frame" data-sel={sel} data-status={scene.frame.status} onClick={() => setSel(true)}>
        <div className="frame-top">
          <TagChip tag={scene.tag} size="xs" />
          <span className="mono frame-id">{id}</span>
        </div>
        <div className="thumb">
          {scene.frame.url ? <img src={scene.frame.url} alt={id} /> : (
            <div className="thumb-empty">
              <StatusDot s={scene.frame.status} />
              <span className="mono">{scene.frame.status === "running" ? "génération…" : "à générer"}</span>
            </div>
          )}
          <span className="mono thumb-id">{id}</span>
          {scene.warnings.length > 0 && (
            <div className="warn"><AlertTriangle size={10} /> {scene.warnings[0]}</div>
          )}
        </div>
        <div className="framing mono">{scene.framing}</div>
        <div className="vo-quote">« {scene.voLine} »</div>

        <div className="ctrl">
          <label className="sel-row">
            <span className="mono k">Perso</span>
            <select value={scene.characterId} onChange={(e) => setSceneCharacter(run.id, scene.id, e.target.value)}>
              <option value="none">Sans perso (décor)</option>
              {run.characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <div className="prod">
            {PRODUCT.map((p) => (
              <button key={p.key} data-active={scene.product.role === p.key} onClick={() => setSceneProduct(run.id, scene.id, p.key)}>{p.label}</button>
            ))}
          </div>

          <input className="vision" placeholder="Ta vision / prompt custom…" value={scene.customPrompt ?? ""}
            onChange={(e) => patchScene(run.id, scene.id, { customPrompt: e.target.value })} />

          <button className="regen" onClick={() => generateFrame(run.id, scene.id)} disabled={scene.frame.status === "running"}>
            <RefreshCw size={12} /> {frameDone ? "Régénérer" : "Générer la frame"} <span className="mono cost">~8 cr</span>
          </button>
        </div>
      </div>

      {showDialogue && scene.dialogue && (
        <div className="dlg">
          <div className="dlg-head"><MessageSquare size={12} style={{ color: "var(--agitation)" }} /> <span className="mono">réplique</span>
            <button className="dlg-off" data-active={scene.dialogue.offscreen} onClick={() => setDialogue(run.id, scene.id, { offscreen: !scene.dialogue!.offscreen })}>hors-champ</button>
          </div>
          <input className="dlg-line" value={scene.dialogue.line} onChange={(e) => setDialogue(run.id, scene.id, { line: e.target.value })} />
          <div className="dlg-row">
            <select className="dlg-voice" value={scene.dialogue.voiceId} onChange={(e) => setDialogue(run.id, scene.id, { voiceId: e.target.value })}>
              {VOICES.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.lang}</option>)}
            </select>
            <button className="dlg-gen" onClick={() => generateDialogue(run.id, scene.id)} disabled={scene.dialogue.audio.status === "running"}>
              <Mic size={11} /> {scene.dialogue.audio.status === "done" ? "Regénérer" : "TTS + lip-sync"}
            </button>
          </div>
          {scene.dialogue.audio.status === "done" && (
            <div className="dlg-done mono">
              voix ✓ {scene.dialogue.duration?.toFixed(1)}s · {scene.dialogue.offscreen ? "hors-champ" : (scene.dialogue.lipsync.status === "done" ? "lip-sync ✓" : "lip-sync en attente")}
              {!scene.dialogue.offscreen && scene.dialogue.lipsync.status === "done" &&
                <button className="redo" onClick={() => redoLipSync(run.id, scene.id)}><RotateCcw size={10} /> refaire lip-sync</button>}
            </div>
          )}
        </div>
      )}

      <div className="connector"><span className="thread" data-on={frameDone} /></div>

      <div className="clip" data-status={scene.clip.status}>
        <div className="clip-head mono"><span>{run.videoModel} · {scene.clipDuration}s</span>{clipDone && <span style={{ color: "var(--ok)" }}>✓</span>}</div>
        <div className="clip-thumb" style={{ opacity: frameDone ? 1 : 0.4 }}>
          {scene.clip.url ? <img src={scene.clip.url} alt="" /> : <div className="thumb-empty mono"><StatusDot s={scene.clip.status} />{scene.clip.status === "running" ? "animation…" : "en attente"}</div>}
          {clipDone && <span className="play"><Play size={12} /></span>}
        </div>
        {scene.sfxSuggestion && <div className="sfx mono">🔊 {scene.sfxSuggestion}</div>}
        <div className="durs">
          {DURATIONS.map((d) => (
            <button key={d} data-active={scene.clipDuration === d} onClick={() => patchScene(run.id, scene.id, { clipDuration: d })}>{d}s</button>
          ))}
        </div>
        <input className="vision" placeholder="Ta vision vidéo (action, caméra…) sinon AUTO" value={scene.movementPrompt ?? ""}
          onChange={(e) => patchScene(run.id, scene.id, { movementPrompt: e.target.value })} />
        <button className="regen" onClick={() => generateClip(run.id, scene.id)} disabled={!frameDone || scene.clip.status === "running"}>
          <RefreshCw size={12} /> {clipDone ? "Régénérer la vidéo" : "Animer"} <span className="mono cost">~90 cr</span>
        </button>
      </div>

      <style jsx>{`
        .col { width: 236px; flex: 0 0 auto; display: flex; flex-direction: column; }
        .frame { background: var(--graphite); border: 1px solid var(--hairline); border-radius: 11px; overflow: hidden; }
        .frame[data-sel="true"] { border-color: var(--gold); box-shadow: 0 0 0 1px rgba(201,162,75,.32), 0 0 26px rgba(201,162,75,.1); }
        .frame-top { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-bottom: 1px solid var(--hairline-soft); }
        .frame-id { font-size: 10px; color: var(--ink-muted); }
        .thumb { position: relative; aspect-ratio: 9/16; background: #100e0c; display: grid; place-items: center; }
        .thumb img { width: 100%; height: 100%; object-fit: cover; }
        .thumb-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 10px; color: var(--ink-dim); }
        .thumb-id { position: absolute; top: 7px; left: 8px; font-size: 9px; color: rgba(255,255,255,.55); background: rgba(0,0,0,.4); padding: 2px 6px; border-radius: 4px; }
        .warn { position: absolute; left: 7px; right: 7px; bottom: 7px; display: flex; align-items: center; gap: 5px; font-size: 9px; color: #e7b98f; background: rgba(196,85,59,.16); border: 1px solid rgba(196,85,59,.4); border-radius: 6px; padding: 4px 6px; }
        .framing { padding: 7px 10px 0; font-size: 9.5px; color: var(--ink-dim); letter-spacing: .04em; }
        .vo-quote { padding: 4px 10px 8px; font-size: 11px; color: var(--ink-muted); font-style: italic; line-height: 1.35; }
        .ctrl { padding: 0 10px 11px; display: flex; flex-direction: column; gap: 7px; }
        .sel-row { display: flex; align-items: center; gap: 7px; background: var(--slate); border: 1px solid var(--hairline); border-radius: 7px; padding: 5px 8px; }
        .sel-row .k { font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-dim); }
        .sel-row select { flex: 1; background: transparent; border: 0; color: var(--ink); font-size: 12px; }
        .prod { display: flex; gap: 5px; }
        .prod button { flex: 1; font-size: 10px; padding: 6px 2px; border: 1px solid var(--hairline); border-radius: 6px; color: var(--ink-muted); background: var(--slate); }
        .prod button[data-active="true"] { border-color: var(--gold); color: var(--gold); background: rgba(201,162,75,.08); }
        .vision { width: 100%; background: var(--slate); border: 1px dashed var(--hairline); border-radius: 7px; padding: 7px 9px; font-size: 11px; color: var(--ink); }
        .vision::placeholder { color: var(--ink-dim); font-style: italic; }
        .regen { display: flex; align-items: center; justify-content: center; gap: 7px; padding: 8px; border-radius: 8px; border: 1px solid rgba(201,162,75,.4); color: var(--gold); font-size: 12px; font-weight: 600; background: transparent; }
        .regen:hover:not(:disabled) { background: rgba(201,162,75,.08); }
        .regen:disabled { opacity: .5; }
        .regen .cost { color: var(--ink-muted); font-size: 10px; font-weight: 400; }
        .dlg { background: var(--slate); border: 1px solid var(--hairline); border-left: 2px solid var(--agitation); border-radius: 9px; padding: 9px; margin-top: 8px; display: flex; flex-direction: column; gap: 7px; }
        .dlg-head { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--ink-muted); }
        .dlg-off { margin-left: auto; font-size: 9px; padding: 2px 6px; border-radius: 5px; border: 1px solid var(--hairline); background: transparent; color: var(--ink-dim); }
        .dlg-off[data-active="true"] { border-color: var(--gold); color: var(--gold); }
        .dlg-line { background: var(--graphite); border: 1px solid var(--hairline); border-radius: 7px; padding: 7px 9px; font-size: 11.5px; color: var(--ink); }
        .dlg-row { display: flex; gap: 6px; }
        .dlg-voice { flex: 1; background: var(--graphite); border: 1px solid var(--hairline); border-radius: 7px; padding: 6px; font-size: 11px; color: var(--ink); }
        .dlg-gen { display: flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 600; color: var(--agitation); border: 1px solid rgba(208,138,62,.4); border-radius: 7px; padding: 6px 9px; background: transparent; }
        .dlg-done { font-size: 9.5px; color: var(--ok); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .redo { display: flex; align-items: center; gap: 4px; font-size: 9px; color: var(--ink-muted); border: 1px solid var(--hairline); border-radius: 5px; padding: 2px 6px; background: transparent; }
        .connector { height: 30px; display: flex; justify-content: center; }
        .thread { width: 2px; background: var(--hairline); border-radius: 2px; transition: background .4s ease; }
        .thread[data-on="true"] { background: linear-gradient(var(--gold-leaf), var(--gold-deep)); box-shadow: 0 0 8px rgba(201,162,75,.4); }
        .clip { background: var(--graphite); border: 1px solid var(--hairline); border-radius: 11px; overflow: hidden; padding-bottom: 10px; }
        .clip-head { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; font-size: 9.5px; color: var(--ink-muted); border-bottom: 1px solid var(--hairline-soft); }
        .clip-thumb { position: relative; aspect-ratio: 9/16; background: #100e0c; display: grid; place-items: center; }
        .clip-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .thumb-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 10px; color: var(--ink-dim); }
        .play { position: absolute; inset: 0; margin: auto; width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--gold); color: var(--gold); display: grid; place-items: center; background: rgba(0,0,0,.35); }
        .sfx { padding: 7px 10px 0; font-size: 9.5px; color: var(--ink-dim); }
        .durs { display: flex; gap: 5px; padding: 8px 10px 0; }
        .durs button { flex: 1; font-size: 10.5px; padding: 5px; border: 1px solid var(--hairline); border-radius: 6px; color: var(--ink-muted); background: var(--slate); }
        .durs button[data-active="true"] { border-color: var(--gold); color: var(--gold); background: rgba(201,162,75,.08); }
        .clip .vision { margin: 8px 10px 0; width: calc(100% - 20px); }
        .clip .regen { margin: 8px 10px 0; }
        @keyframes pulse { 50% { opacity: .35; } }
      `}</style>
    </div>
  );
}
