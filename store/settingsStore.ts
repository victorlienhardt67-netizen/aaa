"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ApiKeys, GenerationDefaults } from "@/types";
import { STORAGE_KEYS } from "@/lib/storage";

interface SettingsState {
  apiKeys: ApiKeys;
  generationDefaults: GenerationDefaults;
  setApiKeys: (patch: Partial<ApiKeys>) => void;
  setGenerationDefaults: (patch: Partial<GenerationDefaults>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKeys: {
        falApiKey: "",
        higgsfieldApiKey: "",
        claudeApiKey: "",
      },
      generationDefaults: {
        imageEngine: "auto",
        videoEngine: "auto",
        defaultLang: "fr",
        motionIntensity: "equilibre",
      },
      setApiKeys: (patch) => set((s) => ({ apiKeys: { ...s.apiKeys, ...patch } })),
      setGenerationDefaults: (patch) =>
        set((s) => ({ generationDefaults: { ...s.generationDefaults, ...patch } })),
    }),
    { name: STORAGE_KEYS.settings }
  )
);
