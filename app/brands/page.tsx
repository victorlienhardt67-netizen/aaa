"use client";
import { useRef, useState } from "react";
import { Plus, X, Upload, FileText, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f); });
}
function fileToText(f: File): Promise<string> {
  return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsText(f); });
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const addBrand = useStore((s) => s.addBrand);
  const [name, setName] = useState("");
  const [lang, setLang] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const convert = async () => {
    if (!name) return;
    setBusy(true);
    let source = "";
    if (file && /\.(txt|md)$/i.test(file.name)) source = await fileToText(file);
    const dna = `# BRAND DNA — ${name.toUpperCase()}
${lang ? `*Langue : ${lang}*\n` : ""}
## Essence
_(à compléter — extrait du brand book)_

## Positionnement
_(à compléter)_

## Produit
_(à compléter)_

## Persona
_(à compléter)_

## Claims autorisés
_(à compléter)_

## Rendering locks
_(à compléter)_

## B-Roll shot direction
_(à compléter)_

---

## DÉTAILS SOURCE
> Contenu non mappé conservé sans perte (sera structuré par Claude en réel).

${source ? source.slice(0, 4000) : file ? `[${file.name} — PDF : extraction texte à brancher]` : "[aucun fichier]"}
`;
    addBrand(name, dna);
    setBusy(false);
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2><FileText size={18} style={{ verticalAlign: "-3px", color: "var(--gold)" }} /> Importer un Brand DNA</h2>
        <p className="muted">Dépose le brand book / DNA client — l'IA le convertit au format exact du tool (Produit · Persona · claims · ⭐ RENDERING LOCKS · B-Roll Shot Direction) sans rien inventer ni perdre. Le non-mappé est gardé en fin de DNA (« DÉTAILS SOURCE »).</p>
        <label className="drop">
          <Upload size={20} />
          <span>{file ? file.name : "Glisse ton fichier ici — ou clique"}</span>
          <span className="mono muted">PDF · .txt · .md — max 20 Mo</span>
          <input type="file" accept=".pdf,.txt,.md" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <input className="input" placeholder="Nom de la marque *" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Langue du DNA final (défaut : langue du fichier)" value={lang} onChange={(e) => setLang(e.target.value)} />
        <div className="actions">
          <button className="btn-quiet" onClick={onClose}>Annuler</button>
          <button className="btn-gold" onClick={convert} disabled={!name || busy}>{busy ? "Conversion…" : "Convertir au format du tool"}</button>
        </div>
      </div>
      <style jsx>{`
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(3px); display: grid; place-items: center; z-index: 100; }
        .modal { width: 460px; max-width: 92vw; background: var(--graphite); border: 1px solid var(--hairline); border-radius: 14px; padding: 22px; display: flex; flex-direction: column; gap: 12px; }
        h2 { font-size: 18px; } .muted { color: var(--ink-muted); font-size: 12.5px; line-height: 1.5; }
        .drop { display: flex; flex-direction: column; align-items: center; gap: 6px; border: 1px dashed var(--hairline); border-radius: 12px; padding: 26px; text-align: center; cursor: pointer; color: var(--ink-muted); }
        .drop:hover { border-color: rgba(201,162,75,.4); }
        .actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 4px; }
      `}</style>
    </div>
  );
}

export default function BrandsPage() {
  const hydrated = useHydrated();
  const brands = useStore((s) => s.brands);
  const activeBrandId = useStore((s) => s.activeBrandId);
  const setActiveBrand = useStore((s) => s.setActiveBrand);
  const updateBrand = useStore((s) => s.updateBrand);
  const addBrand = useStore((s) => s.addBrand);
  const addProductImage = useStore((s) => s.addProductImage);
  const removeProductImage = useStore((s) => s.removeProductImage);
  const [showImport, setShowImport] = useState(false);
  const [saved, setSaved] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  if (!hydrated) return <div style={{ padding: 40, color: "var(--ink-muted)" }}>Chargement…</div>;
  const brand = brands.find((b) => b.id === activeBrandId) ?? brands[0];

  const onImg = async (files?: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) addProductImage(brand.id, await fileToDataUrl(f));
  };
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1400); };

  return (
    <div className="page">
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      <div className="layout">
        <aside className="brands-col">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Mes marques</div>
          {brands.map((b) => (
            <button key={b.id} className="brand-row" data-active={b.id === activeBrandId} onClick={() => setActiveBrand(b.id)}>
              <span className="brand-ic">{b.name[0]}</span>
              <div><div className="brand-row-name">{b.name}</div><div className="mono brand-row-meta">{b.id === activeBrandId ? "active · " : ""}{b.productImages.length} img</div></div>
            </button>
          ))}
          <button className="brand-new" onClick={() => { const n = prompt("Nom de la nouvelle marque ?"); if (n) addBrand(n); }}><Plus size={14} /> Nouvelle marque</button>
          <button className="brand-import" onClick={() => setShowImport(true)}><FileText size={14} /> Importer un DNA (fichier)</button>
        </aside>

        <div className="editor">
          <div className="editor-head">
            <h1>{brand.name}</h1>
            {brand.id === activeBrandId && <span className="badge">ACTIVE</span>}
            <button className="btn-gold" style={{ marginLeft: "auto" }} onClick={save}>{saved ? <><Check size={14} /> Enregistré</> : "Enregistrer"}</button>
          </div>

          <label className="lbl">Nom de la marque</label>
          <input className="input" value={brand.name} onChange={(e) => updateBrand(brand.id, { name: e.target.value })} />

          <label className="lbl" style={{ marginTop: 16 }}>Brand DNA — colle ton markdown (ton, persona, produit, wearing-rule…)</label>
          <textarea className="input dna" value={brand.dna} onChange={(e) => updateBrand(brand.id, { dna: e.target.value })} />

          <label className="lbl" style={{ marginTop: 16 }}>Images produit — réutilisées en B-Roll & Avatar · drag & drop</label>
          <div className="imgs" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onImg(e.dataTransfer.files); }}>
            {brand.productImages.map((src, i) => (
              <div key={i} className="img-cell"><img src={src} alt="" /><button className="img-x" onClick={() => removeProductImage(brand.id, i)}><X size={12} /></button></div>
            ))}
            <button className="img-add" onClick={() => imgRef.current?.click()}><Plus size={18} /><span>ajouter</span></button>
            <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={(e) => onImg(e.target.files)} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .page { padding: 24px 30px 60px; }
        .layout { display: grid; grid-template-columns: 250px 1fr; gap: 24px; max-width: 1200px; }
        .brands-col { display: flex; flex-direction: column; gap: 8px; }
        .brand-row { display: flex; align-items: center; gap: 11px; text-align: left; background: var(--graphite); border: 1px solid var(--hairline); border-radius: 10px; padding: 11px; }
        .brand-row[data-active="true"] { border-color: rgba(201,162,75,.5); }
        .brand-ic { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; font-weight: 700; color: #221a06; background: linear-gradient(150deg, var(--gold-leaf), var(--gold-deep)); }
        .brand-row-name { font-weight: 600; font-size: 13.5px; } .brand-row-meta { font-size: 10.5px; color: var(--ink-muted); margin-top: 1px; }
        .brand-new, .brand-import { display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 10px; padding: 11px; font-size: 12.5px; font-weight: 600; }
        .brand-new { border: 1px dashed var(--hairline); color: var(--ink-muted); background: transparent; margin-top: 4px; }
        .brand-import { border: 1px solid rgba(201,162,75,.3); color: var(--gold); background: linear-gradient(160deg, rgba(201,162,75,.14), rgba(201,162,75,.05)); }
        .editor { background: var(--graphite); border: 1px solid var(--hairline); border-radius: 14px; padding: 22px; }
        .editor-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .editor-head h1 { font-size: 26px; }
        .badge { font-family: var(--font-mono); font-size: 10px; letter-spacing: .12em; color: var(--ok); border: 1px solid var(--ok); border-radius: 5px; padding: 3px 8px; }
        .lbl { display: block; font-family: var(--font-mono); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-dim); margin-bottom: 8px; }
        .dna { min-height: 260px; font-family: var(--font-mono); font-size: 12px; line-height: 1.6; resize: vertical; }
        .imgs { display: flex; flex-wrap: wrap; gap: 12px; }
        .img-cell { position: relative; width: 96px; height: 120px; border-radius: 10px; overflow: hidden; border: 1px solid var(--hairline); }
        .img-cell img { width: 100%; height: 100%; object-fit: cover; }
        .img-x { position: absolute; top: 5px; right: 5px; width: 20px; height: 20px; border-radius: 5px; border: 0; background: rgba(0,0,0,.6); color: var(--ink); display: grid; place-items: center; }
        .img-add { width: 96px; height: 120px; border: 1px dashed var(--hairline); border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; color: var(--ink-dim); font-size: 11px; background: transparent; }
        .img-add:hover { border-color: rgba(201,162,75,.4); color: var(--ink-muted); }
        @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
