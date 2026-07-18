"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Brand, BrandTone, BRAND_TONE_LABELS, Lang } from "@/types";
import { useBrandStore } from "@/store/brandStore";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Toggle } from "@/components/ui/Toggle";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";

const TONE_OPTIONS = (Object.keys(BRAND_TONE_LABELS) as BrandTone[]).map((t) => ({
  value: t,
  label: BRAND_TONE_LABELS[t],
}));

export function BrandForm({ brand, onClose }: { brand: Brand | null; onClose: () => void }) {
  const createBrand = useBrandStore((s) => s.createBrand);
  const updateBrand = useBrandStore((s) => s.updateBrand);
  const deleteBrand = useBrandStore((s) => s.deleteBrand);
  const addProductPhoto = useBrandStore((s) => s.addProductPhoto);
  const addCharacterPhoto = useBrandStore((s) => s.addCharacterPhoto);
  const removeProductPhoto = useBrandStore((s) => s.removeProductPhoto);
  const removeCharacterPhoto = useBrandStore((s) => s.removeCharacterPhoto);
  const renameCharacterPhoto = useBrandStore((s) => s.renameCharacterPhoto);

  const [name, setName] = useState(brand?.name ?? "");
  const [description, setDescription] = useState(brand?.description ?? "");
  const [colors, setColors] = useState(
    brand?.colors ?? { primary: "#C9A84C", secondary: "#E8C96A", accent: "#8A7233" }
  );
  const [tone, setTone] = useState<BrandTone>(brand?.tone ?? "luxe");
  const [defaultLang, setDefaultLang] = useState<Lang>(brand?.defaultLang ?? "fr");
  const [generationNotes, setGenerationNotes] = useState(brand?.generationNotes ?? "");

  const [savedBrand, setSavedBrand] = useState<Brand | null>(brand);

  function ensureSavedBrand(): Brand {
    if (savedBrand) return savedBrand;
    const created = createBrand({
      name: name || "Nouvelle marque",
      description,
      colors,
      tone,
      defaultLang,
      generationNotes,
    });
    setSavedBrand(created);
    return created;
  }

  function handleSaveDetails() {
    const target = ensureSavedBrand();
    updateBrand(target.id, { name, description, colors, tone, defaultLang, generationNotes });
    onClose();
  }

  function handleDelete() {
    if (savedBrand && confirm(`Supprimer la marque "${savedBrand.name}" ?`)) {
      deleteBrand(savedBrand.id);
      onClose();
    }
  }

  async function handleProductUpload(base64s: string[]) {
    const target = ensureSavedBrand();
    base64s.forEach((url) => addProductPhoto(target.id, { url }));
  }

  async function handleCharacterUpload(base64s: string[]) {
    const target = ensureSavedBrand();
    base64s.forEach((url) => addCharacterPhoto(target.id, { url, name: "Personnage" }));
  }

  const currentBrand = savedBrand;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nom de la marque</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex : Lynae" />
        </div>
        <div>
          <Label>Langue par défaut</Label>
          <Toggle
            value={defaultLang}
            onChange={setDefaultLang}
            options={[
              { value: "fr", label: "Français" },
              { value: "en", label: "English" },
            ]}
          />
        </div>
      </div>

      <div>
        <Label>Description du produit</Label>
        <Textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ce qu'est le produit, ses bénéfices, son positionnement, sa cible..."
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ColorPicker
          label="Couleur primaire"
          value={colors.primary}
          onChange={(v) => setColors((c) => ({ ...c, primary: v }))}
        />
        <ColorPicker
          label="Couleur secondaire"
          value={colors.secondary}
          onChange={(v) => setColors((c) => ({ ...c, secondary: v }))}
        />
        <ColorPicker
          label="Couleur accent"
          value={colors.accent}
          onChange={(v) => setColors((c) => ({ ...c, accent: v }))}
        />
      </div>

      <div>
        <Label>Ton de communication</Label>
        <Select value={tone} onChange={(e) => setTone(e.target.value as BrandTone)} options={TONE_OPTIONS} />
      </div>

      <div>
        <Label>Photos produits</Label>
        <Dropzone onFiles={handleProductUpload} hint="PNG, JPG — plusieurs fichiers acceptés" />
        {currentBrand && currentBrand.productPhotos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {currentBrand.productPhotos.map((p) => (
              <div key={p.id} className="relative group aspect-[9/16] rounded overflow-hidden bg-surface2 border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="produit" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeProductPhoto(currentBrand.id, p.id)}
                  className="absolute top-1 right-1 bg-black/70 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label>Photos modèles / personnages récurrents</Label>
        <Dropzone onFiles={handleCharacterUpload} hint="Une photo par personnage récurrent" />
        {currentBrand && currentBrand.characterPhotos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {currentBrand.characterPhotos.map((p) => (
              <div key={p.id} className="flex gap-2 items-center bg-surface2 border border-border rounded p-2">
                <div className="w-14 h-14 rounded overflow-hidden shrink-0 bg-surface border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="personnage" className="w-full h-full object-cover" />
                </div>
                <Input
                  defaultValue={p.name}
                  placeholder="Nom du personnage"
                  className="text-xs"
                  onBlur={(e) => renameCharacterPhoto(currentBrand.id, p.id, e.target.value)}
                />
                <button
                  onClick={() => removeCharacterPhoto(currentBrand.id, p.id)}
                  className="shrink-0 p-1.5 hover:bg-surface rounded"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label>Notes de génération</Label>
        <Textarea
          rows={3}
          value={generationNotes}
          onChange={(e) => setGenerationNotes(e.target.value)}
          placeholder='ex : "toujours montrer le flacon debout", "ne jamais montrer de visage trop gros plan"'
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        {currentBrand ? (
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5" /> Supprimer la marque
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" size="md" onClick={handleSaveDetails}>
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}
