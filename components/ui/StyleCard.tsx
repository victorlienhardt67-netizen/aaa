"use client";
import type { Style } from "@/lib/types";

export function StyleCard({ style, onClick }: { style: Style; onClick?: () => void }) {
  return (
    <button className="style-card" onClick={onClick} disabled={style.soon}>
      <div className="style-card-art" style={{ ["--accent" as any]: style.accent ?? "var(--gold)" }}>
        <span className="style-emoji">{style.emoji}</span>
        {style.soon && <span className="style-soon mono">SOON</span>}
        {style.custom && <span className="style-custom mono">CUSTOM</span>}
      </div>
      <div className="style-card-body">
        <div className="style-card-name">{style.name}</div>
        <div className="style-card-sub">{style.subtitle}</div>
      </div>
      <style jsx>{`
        .style-card { text-align: left; background: var(--graphite); border: 1px solid var(--hairline); border-radius: 12px; overflow: hidden; transition: border-color .15s ease, transform .05s ease; display: flex; flex-direction: column; }
        .style-card:hover:not(:disabled) { border-color: rgba(201,162,75,.4); }
        .style-card:active:not(:disabled) { transform: translateY(1px); }
        .style-card:disabled { opacity: .5; cursor: default; }
        .style-card-art { position: relative; aspect-ratio: 16/9; display: grid; place-items: center;
          background: radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 62%), linear-gradient(160deg, #17130d, #0d0d0f); }
        .style-emoji { font-size: 34px; color: var(--accent); filter: drop-shadow(0 2px 10px color-mix(in srgb, var(--accent) 40%, transparent)); }
        .style-soon, .style-custom { position: absolute; top: 8px; right: 8px; font-size: 8.5px; letter-spacing: .12em; padding: 2px 6px; border-radius: 5px; }
        .style-soon { color: var(--gold-deep); border: 1px solid var(--gold-deep); }
        .style-custom { color: var(--gold); border: 1px solid rgba(201,162,75,.4); }
        .style-card-body { padding: 11px 13px 13px; }
        .style-card-name { font-family: var(--font-display); font-weight: 600; font-size: 14.5px; }
        .style-card-sub { font-size: 11.5px; color: var(--ink-muted); margin-top: 2px; }
      `}</style>
    </button>
  );
}
