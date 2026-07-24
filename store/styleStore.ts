"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StylePreset } from "@/types";
import { STORAGE_KEYS } from "@/lib/storage";
import { DEFAULT_STYLES } from "@/lib/styleSeeds";
import { generateId } from "@/lib/utils";

interface StyleState {
  styles: StylePreset[];
  addCustomStyle: (data: Omit<StylePreset, "id" | "isCustom" | "createdAt">) => StylePreset;
  updateStyle: (id: string, patch: Partial<StylePreset>) => void;
  deleteStyle: (id: string) => void;
}

export const useStyleStore = create<StyleState>()(
  persist(
    (set) => ({
      styles: DEFAULT_STYLES,

      addCustomStyle: (data) => {
        const style: StylePreset = {
          ...data,
          id: generateId("style"),
          isCustom: true,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ styles: [...s.styles, style] }));
        return style;
      },

      updateStyle: (id, patch) =>
        set((s) => ({
          styles: s.styles.map((st) => (st.id === id ? { ...st, ...patch } : st)),
        })),

      deleteStyle: (id) =>
        set((s) => ({
          styles: s.styles.filter((st) => st.id !== id || !st.isCustom),
        })),
    }),
    {
      name: STORAGE_KEYS.styles,
      merge: (persisted, current) => {
        const p = persisted as StyleState | undefined;
        if (!p || !p.styles || p.styles.length === 0) return { ...current, ...p };
        // Fusionne : les styles de base gardent les modifs utilisateur persistées
        // (image d'illustration, prompts...) tout en récupérant les nouveaux champs
        // ajoutés côté code (ex: un futur champ absent des anciennes données
        // persistées) — sans ça, toute édition d'un style de base était
        // silencieusement effacée à chaque rechargement de page.
        const persistedById = new Map(p.styles.map((st) => [st.id, st]));
        const customs = p.styles.filter((st) => st.isCustom);
        const bases = DEFAULT_STYLES.map((base) => {
          const saved = persistedById.get(base.id);
          return saved ? { ...base, ...saved } : base;
        });
        return { ...current, ...p, styles: [...bases, ...customs] };
      },
    }
  )
);
