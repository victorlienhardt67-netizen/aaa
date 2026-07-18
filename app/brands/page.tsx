"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useBrandStore } from "@/store/brandStore";
import { Brand } from "@/types";
import { BrandCard } from "@/components/brands/BrandCard";
import { BrandForm } from "@/components/brands/BrandForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export default function BrandsPage() {
  const brands = useBrandStore((s) => s.brands);
  const [editingBrand, setEditingBrand] = useState<Brand | null | undefined>(undefined);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Marques</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Gérez les marques et leurs assets pour la production vidéo.
          </p>
        </div>
        <Button onClick={() => setEditingBrand(null)}>
          <Plus className="w-4 h-4" /> Nouvelle marque
        </Button>
      </div>

      {brands.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-20 text-center">
          <p className="text-ink-secondary text-sm mb-4">Aucune marque créée pour le moment.</p>
          <Button onClick={() => setEditingBrand(null)} variant="secondary">
            <Plus className="w-4 h-4" /> Créer votre première marque
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} onClick={() => setEditingBrand(brand)} />
          ))}
        </div>
      )}

      <Modal
        open={editingBrand !== undefined}
        onClose={() => setEditingBrand(undefined)}
        title={editingBrand ? `Modifier ${editingBrand.name}` : "Nouvelle marque"}
        size="lg"
      >
        {editingBrand !== undefined && (
          <BrandForm brand={editingBrand} onClose={() => setEditingBrand(undefined)} />
        )}
      </Modal>
    </div>
  );
}
