"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Lang } from "@/types";

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
    { name: "golddust:ui" }
  )
);
