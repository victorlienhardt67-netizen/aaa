"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home, History, Sparkles, LayoutGrid, Wand2, Film, Clapperboard,
  Scissors, MessageSquare, Boxes, Blocks, Activity, Mic, FileText, Copy, Tag,
  ChevronDown, Settings, Circle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";

const ICONS: Record<string, any> = {
  "create-avatar": Sparkles, "native-ads": LayoutGrid, "visualiseur": Film, "adapt-crea": Wand2,
  "b-roll": Film, "avatar-video": Clapperboard, "paper-cut": Scissors, "talking-objects": MessageSquare,
  "clay-motion": Circle, "disney": Boxes, "jouet": Blocks, "minecraft": Blocks, "ecorche": Activity,
};

function NavItem({ href, icon: Icon, label, active, count, soon }: any) {
  return (
    <Link href={soon ? "#" : href} className="side-item" data-active={active} data-soon={soon}>
      <Icon size={15} strokeWidth={1.8} />
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && <span className="mono side-count">{count}</span>}
      {soon && <span className="side-soon mono">SOON</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const brands = useStore((s) => s.brands);
  const activeBrandId = useStore((s) => s.activeBrandId);
  const setActiveBrand = useStore((s) => s.setActiveBrand);
  const styles = useStore((s) => s.styles);
  const runs = useStore((s) => s.runs);
  const keys = useStore((s) => s.keys);
  const [brandOpen, setBrandOpen] = useState(false);

  const activeBrand = brands.find((b) => b.id === activeBrandId) ?? brands[0];
  const videoStyles = styles.filter((s) => s.group === "video");
  const runsList = Object.values(runs);
  const runsByStyle = (styleId: string) => runsList.filter((r) => r.styleId === styleId);

  const keyState = (p: string) => (keys[p]?.key ? "ok" : "bad");

  return (
    <aside className="sidebar">
      <div className="side-brandmark">
        <span className="glyph" />
        <span className="wordmark">GULDUST</span>
      </div>

      <div className="brand-switch">
        <button className="brand-switch-btn" onClick={() => setBrandOpen((v) => !v)}>
          <div>
            <div className="eyebrow">Marque active</div>
            <div className="brand-name">{hydrated ? activeBrand?.name ?? "—" : "—"}</div>
          </div>
          <ChevronDown size={15} style={{ color: "var(--gold)" }} />
        </button>
        {brandOpen && hydrated && (
          <div className="brand-menu">
            {brands.map((b) => (
              <button key={b.id} className="brand-menu-item" data-active={b.id === activeBrandId}
                onClick={() => { setActiveBrand(b.id); setBrandOpen(false); }}>
                {b.name}
              </button>
            ))}
            <Link href="/brands" className="brand-menu-item" style={{ color: "var(--gold)" }} onClick={() => setBrandOpen(false)}>
              + Gérer les marques
            </Link>
          </div>
        )}
      </div>

      <nav className="side-nav">
        <NavItem href="/" icon={Home} label="Accueil" active={pathname === "/"} />
        <NavItem href="/history" icon={History} label="Historique" active={pathname === "/history"} />

        <div className="side-group">Création</div>
        <NavItem href="/tools/create-avatar" icon={Sparkles} label="Create Avatar" active={pathname === "/tools/create-avatar"} />
        <NavItem href="/tools/native-ads" icon={LayoutGrid} label="Native Ads" active={pathname === "/tools/native-ads"} />
        <NavItem href="/tools/visualiseur" icon={Film} label="Visualiseur" active={pathname === "/tools/visualiseur"} />
        <NavItem href="/tools/adapt-crea" icon={Wand2} label="Adapt Créa" active={pathname === "/tools/adapt-crea"} />

        <div className="side-group">Vidéo</div>
        {videoStyles.map((s) => {
          const Icon = ICONS[s.key] ?? Circle;
          const styleRuns = hydrated ? runsByStyle(s.id) : [];
          return (
            <div key={s.id}>
              <NavItem href={`/new?style=${s.key}`} icon={Icon} label={s.name}
                active={pathname === `/style/${s.key}`} soon={s.soon} />
              {styleRuns.map((r) => (
                <Link key={r.id} href={`/run/${r.id}`} className="side-subrun" data-active={pathname === `/run/${r.id}`}>
                  <span className="dot-run" />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                  <span className="mono side-count">
                    {r.scenes.filter((sc) => sc.frame.status === "done").length}/{r.scenes.length || 0}
                  </span>
                </Link>
              ))}
            </div>
          );
        })}

        <div className="side-group">Outils</div>
        <NavItem href="/tools/voices" icon={Mic} label="Voix" active={pathname === "/tools/voices"} />
        <NavItem href="/tools/scripts" icon={FileText} label="Scripts" active={pathname === "/tools/scripts"} />
        <NavItem href="/tools/copy-ads" icon={Copy} label="Copy Ads" active={pathname === "/tools/copy-ads"} />

        <div className="side-group">Marques</div>
        <NavItem href="/brands" icon={Tag} label="Brands" active={pathname === "/brands"} />
      </nav>

      <div className="side-footer">
        <div className="side-keys mono">
          <span>KIE <b className={keyState("kie") === "ok" ? "ok" : "bad"}>{keyState("kie") === "ok" ? "✓" : "✗"}</b></span>
          <span>Claude <b className={keyState("anthropic") === "ok" ? "ok" : "bad"}>{keyState("anthropic") === "ok" ? "✓" : "✗"}</b></span>
          <span>HeyGen <b className={keyState("heygen") === "ok" ? "ok" : "bad"}>{keyState("heygen") === "ok" ? "✓" : "✗"}</b></span>
        </div>
        <Link href="/settings" className="side-keys-btn">
          <Settings size={14} /> Gérer mes clés API
        </Link>
      </div>

      <style jsx>{`
        .sidebar { background: var(--graphite); border-right: 1px solid var(--hairline); display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .side-brandmark { display: flex; align-items: center; gap: 10px; padding: 15px 16px 12px; }
        .glyph { width: 22px; height: 22px; border-radius: 6px; background: linear-gradient(150deg, var(--gold-leaf), var(--gold) 55%, var(--gold-deep)); box-shadow: 0 0 0 1px rgba(232,204,122,.3), 0 3px 12px rgba(201,162,75,.28); }
        .wordmark { font-family: var(--font-display); font-weight: 600; letter-spacing: .28em; font-size: 13px; }
        .brand-switch { position: relative; padding: 0 12px 10px; }
        .brand-switch-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; background: var(--slate); border: 1px solid var(--hairline); border-radius: 8px; padding: 8px 11px; text-align: left; }
        .brand-name { font-weight: 600; font-size: 13.5px; color: var(--ink); margin-top: 2px; }
        .brand-menu { position: absolute; left: 12px; right: 12px; top: 100%; z-index: 20; background: var(--slate-2); border: 1px solid var(--hairline); border-radius: 8px; padding: 5px; margin-top: 4px; box-shadow: 0 12px 30px rgba(0,0,0,.5); }
        .brand-menu-item { display: block; width: 100%; text-align: left; padding: 7px 9px; border-radius: 6px; font-size: 13px; color: var(--ink-muted); border: 0; background: transparent; }
        .brand-menu-item[data-active="true"] { color: var(--ink); background: var(--slate); }
        .brand-menu-item:hover { color: var(--ink); background: var(--graphite); }
        .side-nav { flex: 1; overflow-y: auto; padding: 4px 8px 8px; }
        .side-group { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .2em; text-transform: uppercase; color: var(--ink-dim); margin: 15px 8px 6px; }
        :global(.side-item) { display: flex; align-items: center; gap: 10px; padding: 7px 9px; border-radius: 7px; font-size: 13px; color: var(--ink-muted); }
        :global(.side-item:hover) { color: var(--ink); background: var(--slate); }
        :global(.side-item[data-active="true"]) { color: var(--ink); background: var(--slate); box-shadow: inset 2px 0 0 var(--gold); }
        :global(.side-item[data-soon="true"]) { opacity: .55; cursor: default; }
        :global(.side-count) { font-size: 10px; color: var(--gold); }
        :global(.side-soon) { font-size: 8.5px; letter-spacing: .1em; color: var(--gold-deep); border: 1px solid var(--gold-deep); border-radius: 4px; padding: 1px 5px; }
        :global(.side-subrun) { display: flex; align-items: center; gap: 8px; padding: 5px 9px 5px 26px; border-radius: 7px; font-size: 12px; color: var(--ink-dim); }
        :global(.side-subrun:hover) { color: var(--ink-muted); }
        :global(.side-subrun[data-active="true"]) { color: var(--ink); background: var(--slate); }
        .dot-run { width: 6px; height: 6px; border-radius: 50%; background: var(--gold-deep); }
        .side-footer { padding: 10px 12px 14px; border-top: 1px solid var(--hairline); }
        .side-keys { display: flex; gap: 10px; font-size: 10.5px; color: var(--ink-muted); padding: 4px 2px 10px; }
        .side-keys .ok { color: var(--ok); } .side-keys .bad { color: var(--err); }
        .side-keys-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: linear-gradient(160deg, rgba(201,162,75,.16), rgba(201,162,75,.06)); border: 1px solid rgba(201,162,75,.3); color: var(--gold); border-radius: 8px; padding: 9px; font-size: 12.5px; font-weight: 600; }
        .side-keys-btn:hover { background: rgba(201,162,75,.14); }
      `}</style>
    </aside>
  );
}
