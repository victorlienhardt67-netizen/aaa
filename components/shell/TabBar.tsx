"use client";
import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";

export function TabBar() {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const openTabs = useStore((s) => s.openTabs);
  const runs = useStore((s) => s.runs);
  const styles = useStore((s) => s.styles);
  const closeTab = useStore((s) => s.closeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  if (!hydrated || openTabs.length === 0) {
    return <div className="tabbar tabbar-empty" />;
  }

  return (
    <div className="tabbar">
      {openTabs.map((id) => {
        const run = runs[id];
        if (!run) return null;
        const style = styles.find((s) => s.id === run.styleId);
        const done = run.scenes.filter((s) => s.frame.status === "done").length;
        const active = pathname === `/run/${id}`;
        return (
          <div key={id} className="tab" data-active={active}
            onClick={() => { setActiveTab(id); router.push(`/run/${id}`); }}>
            <span style={{ color: style?.accent ?? "var(--gold)" }}>{style?.emoji ?? "◆"}</span>
            <span className="tab-name">{run.name}</span>
            <span className="mono tab-count">{done}/{run.scenes.length || 0}</span>
            <button className="tab-x" onClick={(e) => { e.stopPropagation(); closeTab(id); if (active) router.push("/"); }}>
              <X size={12} />
            </button>
          </div>
        );
      })}
      <style jsx>{`
        .tabbar { height: var(--tabbar-h); display: flex; align-items: stretch; background: var(--graphite); border-bottom: 1px solid var(--hairline); overflow-x: auto; overflow-y: hidden; }
        .tab { display: flex; align-items: center; gap: 8px; padding: 0 12px; border-right: 1px solid var(--hairline); font-size: 12.5px; color: var(--ink-muted); cursor: pointer; white-space: nowrap; }
        .tab:hover { color: var(--ink); background: var(--slate); }
        .tab[data-active="true"] { color: var(--ink); background: var(--slate); box-shadow: inset 0 -2px 0 var(--gold); }
        .tab-name { font-weight: 500; max-width: 150px; overflow: hidden; text-overflow: ellipsis; }
        .tab-count { font-size: 10px; color: var(--gold); }
        .tab-x { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 4px; border: 0; background: transparent; color: var(--ink-dim); }
        .tab-x:hover { background: var(--slate-2); color: var(--ink); }
      `}</style>
    </div>
  );
}
