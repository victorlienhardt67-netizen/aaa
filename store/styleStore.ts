"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StylePreset } from "@/types";
import { STORAGE_KEYS } from "@/lib/storage";
import { DEFAULT_STYLES } from "@/lib/styleSeeds";
import { generateId } from "@/lib/utils";

interface StyleState {
  styles: StylePreset[];
  addCustomStyle: (data: Omit<StylePreset, "id" | "isCustom" | "createdAt">) => void;
  updateStyle: (id: string, patch: Partial<StylePreset>) => void;
  deleteStyle: (id: string) => void;
}

export const useStyleStore = create<StyleState>()(
  persist(
    (set) => ({
      styles: DEFAULT_STYLES,

      addCustomStyle: (data) =>
        set((s) => ({
          styles: [
            ...s.styles,
            { ...data, id: generateId("style"), isCustom: true, createdAt: new Date().toISOString() },
          ],
        })),

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
        // Fusionne : garde les styles custom persistés + rafraîchit les styles de base
        const customs = p.styles.filter((st) => st.isCustom);
        return { ...current, ...p, styles: [...DEFAULT_STYLES, ...customs] };
      },
    }
  )
);
