"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Lang } from "@/types";
import { safeLocalStorage } from "@/lib/storage";

interface UiState {
  activeLang: Lang;
  setActiveLang: (lang: Lang) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeLang: "fr",
      setActiveLang: (lang) => set({ activeLang: lang }),
    }),
    { name: "golddust:ui", storage: createJSONStorage(() => safeLocalStorage) }
  )
);
