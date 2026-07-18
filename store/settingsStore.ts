"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AdvancedPromptSettings, ApiKeys, GenerationDefaults } from "@/types";
import { STORAGE_KEYS } from "@/lib/storage";
import {
  DEFAULT_ANALYZE_BRIEF_SYSTEM_PROMPT,
  DEFAULT_CO_CONSTRUCTION_SYSTEM_PROMPT,
  DEFAULT_GENERATE_HOOKS_SYSTEM_PROMPT,
  DEFAULT_MANDATORY_IMAGE_RULES,
  DEFAULT_MANDATORY_VIDEO_RULES,
  DEFAULT_MAX_SCENE_DURATION,
  DEFAULT_MIN_SCENE_DURATION,
} from "@/lib/prompts";

const DEFAULT_ADVANCED_PROMPTS: AdvancedPromptSettings = {
  analyzeBriefSystemPrompt: DEFAULT_ANALYZE_BRIEF_SYSTEM_PROMPT,
  generateHooksSystemPrompt: DEFAULT_GENERATE_HOOKS_SYSTEM_PROMPT,
  coConstructionSystemPrompt: DEFAULT_CO_CONSTRUCTION_SYSTEM_PROMPT,
  mandatoryVideoRules: DEFAULT_MANDATORY_VIDEO_RULES,
  mandatoryImageRules: DEFAULT_MANDATORY_IMAGE_RULES,
  minSceneDurationSeconds: DEFAULT_MIN_SCENE_DURATION,
  maxSceneDurationSeconds: DEFAULT_MAX_SCENE_DURATION,
};

interface SettingsState {
  apiKeys: ApiKeys;
  generationDefaults: GenerationDefaults;
  advancedPrompts: AdvancedPromptSettings;
  setApiKeys: (patch: Partial<ApiKeys>) => void;
  setGenerationDefaults: (patch: Partial<GenerationDefaults>) => void;
  setAdvancedPrompts: (patch: Partial<AdvancedPromptSettings>) => void;
  resetAdvancedPrompts: () => void;
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
      advancedPrompts: DEFAULT_ADVANCED_PROMPTS,
      setApiKeys: (patch) => set((s) => ({ apiKeys: { ...s.apiKeys, ...patch } })),
      setGenerationDefaults: (patch) =>
        set((s) => ({ generationDefaults: { ...s.generationDefaults, ...patch } })),
      setAdvancedPrompts: (patch) =>
        set((s) => ({ advancedPrompts: { ...s.advancedPrompts, ...patch } })),
      resetAdvancedPrompts: () => set({ advancedPrompts: DEFAULT_ADVANCED_PROMPTS }),
    }),
    {
      name: STORAGE_KEYS.settings,
      merge: (persisted, current) => {
        const p = persisted as Partial<SettingsState> | undefined;
        return {
          ...current,
          ...p,
          advancedPrompts: { ...DEFAULT_ADVANCED_PROMPTS, ...p?.advancedPrompts },
        };
      },
    }
  )
);
