"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { fmtTime, fmtDay } from "@/lib/format";

export default function HistoryPage() {
  const hydrated = useHydrated();
  const generations = useStore((s) => s.generations);
  const styles = useStore((s) => s.styles);
  const [filter, setFilter] = useState<string>("all");

  if (!hydrated) return <div style={{ padding: 40, color: "var(--ink-muted)" }}>Chargement…</div>;

  const filtered = generations.filter((g) => (filter === "all" ? true : g.styleKey === filter) && g.url);
  const byDay: Record<string, typeof filtered> = {};
  for (const g of filtered) { const d = fmtDay(g.createdAt); (byDay[d] ??= []).push(g); }
  const days = Object.keys(byDay);
  const chips = [{ key: "all", label: "Tous" }, ...styles.filter((s) => s.group === "video").slice(0, 5).map((s) => ({ key: s.key, label: s.name }))];

  return (
    <div className="page">
      <header><h1>Historique</h1><p className="muted">Toutes tes générations, tous onglets confondus — clic pour reprendre le run.</p></header>
      <div className="chips">
        {chips.map((c) => <button key={c.key} className="chip" data-active={filter === c.key} onClick={() => setFilter(c.key)}>{c.label}</button>)}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">Aucune génération pour l'instant. Lance un run pour remplir l'historique.</div>
      ) : days.map((day) => (
        <section key={day}>
          <div className="day mono">{day} · {byDay[day].length} générations</div>
          <div className="grid">
            {byDay[day].map((g) => {
              const style = styles.find((s) => s.key === g.styleKey);
              return (
                <Link key={g.id} href={g.runId ? `/run/${g.runId}` : "#"} className="cell">
                  {g.url && <img src={g.url} alt="" />}
                  <span className="mono tag">{style?.emoji} {style?.name ?? g.kind}</span>
                  <span className="mono time">{fmtTime(g.createdAt)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <style jsx>{`
        .page { padding: 26px 30px 60px; }
        h1 { font-size: 26px; } .muted { color: var(--ink-muted); margin-top: 4px; }
        .chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 18px 0 24px; }
        .chip { font-size: 12px; padding: 6px 13px; border-radius: 999px; border: 1px solid var(--hairline); background: var(--slate); color: var(--ink-muted); }
        .chip[data-active="true"] { border-color: var(--gold); color: var(--gold); background: rgba(201,162,75,.08); }
        .empty { padding: 60px; text-align: center; color: var(--ink-dim); }
        section { margin-bottom: 26px; }
        .day { font-size: 11px; letter-spacing: .1em; color: var(--ink-dim); margin-bottom: 12px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
        .cell { position: relative; aspect-ratio: 9/16; border-radius: 10px; overflow: hidden; border: 1px solid var(--hairline); background: var(--graphite); }
        .cell img { width: 100%; height: 100%; object-fit: cover; }
        .cell:hover { border-color: rgba(201,162,75,.4); }
        .tag { position: absolute; top: 7px; left: 7px; font-size: 9px; color: var(--ink); background: rgba(0,0,0,.5); padding: 2px 6px; border-radius: 5px; }
        .time { position: absolute; top: 7px; right: 7px; font-size: 9px; color: var(--ink); background: rgba(0,0,0,.5); padding: 2px 6px; border-radius: 5px; }
      `}</style>
    </div>
  );
}
