"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { StyleCard } from "@/components/ui/StyleCard";

function NewInner() {
  const hydrated = useHydrated();
  const router = useRouter();
  const params = useSearchParams();
  const styleKey = params.get("style");
  const styles = useStore((s) => s.styles);
  const createRun = useStore((s) => s.createRun);

  useEffect(() => {
    if (!hydrated || !styleKey) return;
    const style = styles.find((s) => s.key === styleKey);
    if (style && !style.soon) {
      const id = createRun(style.id);
      router.replace(`/run/${id}`);
    }
  }, [hydrated, styleKey, styles, createRun, router]);

  if (styleKey) {
    return <div className="page"><p className="muted">Création du run…</p><style jsx>{`.page{padding:40px}.muted{color:var(--ink-muted)}`}</style></div>;
  }

  const video = styles.filter((s) => s.group === "video");
  const creation = styles.filter((s) => s.group === "creation");
  const start = (id: string) => { const rid = createRun(id); router.push(`/run/${rid}`); };

  return (
    <div className="page">
      <header><h1>Nouveau projet</h1><p className="muted">Choisis un style de rendu — une carte par univers.</p></header>
      <div className="eyebrow" style={{ marginTop: 26, marginBottom: 12 }}>Vidéo</div>
      <div className="grid">{video.map((s) => <StyleCard key={s.id} style={s} onClick={() => start(s.id)} />)}</div>
      <div className="eyebrow" style={{ marginTop: 30, marginBottom: 12 }}>Création</div>
      <div className="grid">{creation.map((s) => <StyleCard key={s.id} style={s} onClick={() => start(s.id)} />)}</div>
      <style jsx>{`
        .page { padding: 26px 30px 60px; max-width: 1240px; }
        h1 { font-size: 26px; } .muted { color: var(--ink-muted); margin-top: 4px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(215px,1fr)); gap: 14px; }
      `}</style>
    </div>
  );
}

export default function NewPage() {
  return <Suspense><NewInner /></Suspense>;
}
