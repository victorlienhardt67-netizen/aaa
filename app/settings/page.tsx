"use client";
import { useState } from "react";
import { KeyRound, Link2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";

function mask(key?: string) {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 5)}••••${key.slice(-4)}`;
}

function KeyRow({ provider, label, hint }: { provider: string; label: string; hint?: string }) {
  const stored = useStore((s) => s.keys[provider]);
  const setKey = useStore((s) => s.setKey);
  const [val, setVal] = useState("");
  return (
    <div className="row">
      <div className="row-head">
        <label>{label}</label>
        {stored?.key && <span className="mono stored">{mask(stored.key)}</span>}
      </div>
      {hint && <div className="hint mono">{hint}</div>}
      <div className="row-input">
        <input className="input" type="password" placeholder={`colle ta clé ${label}…`} value={val} onChange={(e) => setVal(e.target.value)} />
        <button className="btn-quiet" disabled={!val} onClick={() => { setKey(provider, val, stored?.defaultModel); setVal(""); }}>Enregistrer</button>
      </div>
      <style jsx>{`
        .row { display: flex; flex-direction: column; gap: 8px; }
        .row-head { display: flex; align-items: center; justify-content: space-between; }
        label { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-dim); }
        .stored { font-size: 11px; color: var(--ok); }
        .hint { font-size: 10.5px; color: var(--ink-dim); }
        .row-input { display: flex; gap: 8px; } .row-input .input { flex: 1; }
      `}</style>
    </div>
  );
}

export default function SettingsPage() {
  const hydrated = useHydrated();
  const claudeModel = useStore((s) => s.claudeModel);
  const setClaudeModel = useStore((s) => s.setClaudeModel);
  if (!hydrated) return <div style={{ padding: 40, color: "var(--ink-muted)" }}>Chargement…</div>;

  return (
    <div className="page">
      <header><h1><KeyRound size={22} style={{ verticalAlign: "-4px", color: "var(--gold)" }} /> Réglages — Clés API</h1>
        <p className="muted">Stockées <b>en local sur la machine</b>, jamais en clair dans le code, jamais en ligne.</p></header>

      <div className="card">
        <KeyRow provider="kie" label="Clé KIE" hint="image (Nano Banana 2) · vidéo (Omni / Kling)" />
        <KeyRow provider="anthropic" label="Clé Anthropic / Claude" hint="analyse script · conversion Brand DNA" />
        <div className="row">
          <label className="lbl">Modèle Claude — à changer seulement si Anthropic déprécie le défaut</label>
          <input className="input" value={claudeModel} onChange={(e) => setClaudeModel(e.target.value)} />
        </div>
        <KeyRow provider="heygen" label="Clé HeyGen" hint="lip-sync · avatar video" />

        <div className="mcp">
          <div><b>HeyGen MCP</b> <span className="muted">— génère sur tes crédits d'abo (~3× moins cher)</span></div>
          <button className="btn-ghost"><Link2 size={13} /> Connecter (1 clic navigateur)</button>
        </div>
      </div>

      <div className="note mono">
        ⓘ Prototype : les clés sont pour l'instant en localStorage. En prod locale elles passeront dans un store chiffré côté backend local (jamais commitées, jamais loggées) et les appels providers partiront du serveur local.
      </div>

      <style jsx>{`
        .page { padding: 26px 30px 60px; max-width: 680px; }
        h1 { font-size: 24px; } .muted { color: var(--ink-muted); margin-top: 5px; font-size: 13px; }
        .card { padding: 20px; display: flex; flex-direction: column; gap: 18px; margin-top: 20px; }
        .lbl { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-dim); display: block; margin-bottom: 8px; }
        .mcp { display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1px dashed var(--hairline); border-radius: 10px; padding: 13px 14px; font-size: 12.5px; }
        .mcp .muted { color: var(--ink-muted); }
        .note { margin-top: 16px; font-size: 11px; color: var(--ink-dim); line-height: 1.6; background: var(--graphite); border: 1px solid var(--hairline); border-radius: 10px; padding: 13px; }
      `}</style>
    </div>
  );
}
