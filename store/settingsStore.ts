"use client";

import { create } from "zustand";
import { AdvancedPromptSettings, ApiKeys, GenerationDefaults } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_ANALYZE_BRIEF_SYSTEM_PROMPT,
  DEFAULT_CO_CONSTRUCTION_SYSTEM_PROMPT,
  DEFAULT_GENERATE_HOOKS_SYSTEM_PROMPT,
  DEFAULT_MANDATORY_IMAGE_RULES,
  DEFAULT_MANDATORY_VIDEO_RULES,
  DEFAULT_MAX_SCENE_DURATION,
  DEFAULT_MIN_SCENE_DURATION,
} from "@/lib/prompts";

const DEFAULT_API_KEYS: ApiKeys = {
  falApiKey: "",
  higgsfieldApiKey: "",
  claudeApiKey: "",
  elevenLabsApiKey: "",
};

const DEFAULT_GENERATION_DEFAULTS: GenerationDefaults = {
  imageEngine: "auto",
  videoEngine: "auto",
  defaultLang: "fr",
  motionIntensity: "equilibre",
};

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
  /** true une fois la première lecture depuis Supabase terminée (évite d'écraser avec les valeurs par défaut avant que la vraie valeur soit connue). */
  hydrated: boolean;
  apiKeys: ApiKeys;
  generationDefaults: GenerationDefaults;
  advancedPrompts: AdvancedPromptSettings;
  /** Charge les réglages du compte connecté depuis Supabase — appelé une fois au montage de l'app. */
  hydrateFromRemote: () => Promise<void>;
  setApiKeys: (patch: Partial<ApiKeys>) => void;
  setGenerationDefaults: (patch: Partial<GenerationDefaults>) => void;
  setAdvancedPrompts: (patch: Partial<AdvancedPromptSettings>) => void;
  resetAdvancedPrompts: () => void;
}

/**
 * Réglages désormais liés au compte (table Supabase `settings`, une ligne par
 * utilisateur, créée automatiquement à l'inscription) plutôt qu'au navigateur —
 * chaque collègue a ses propres clés API et ses propres prompts avancés, qui
 * le suivent d'un appareil à l'autre.
 */
async function persistSettings(patch: {
  api_keys?: ApiKeys;
  generation_defaults?: GenerationDefaults;
  advanced_prompt_settings?: AdvancedPromptSettings;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("settings").update(patch).eq("user_id", user.id);
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  hydrated: false,
  apiKeys: DEFAULT_API_KEYS,
  generationDefaults: DEFAULT_GENERATION_DEFAULTS,
  advancedPrompts: DEFAULT_ADVANCED_PROMPTS,

  hydrateFromRemote: async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("settings")
      .select("api_keys, generation_defaults, advanced_prompt_settings")
      .eq("user_id", user.id)
      .maybeSingle();

    set({
      hydrated: true,
      apiKeys: { ...DEFAULT_API_KEYS, ...(data?.api_keys as Partial<ApiKeys> | null) },
      generationDefaults: {
        ...DEFAULT_GENERATION_DEFAULTS,
        ...(data?.generation_defaults as Partial<GenerationDefaults> | null),
      },
      advancedPrompts: {
        ...DEFAULT_ADVANCED_PROMPTS,
        ...(data?.advanced_prompt_settings as Partial<AdvancedPromptSettings> | null),
      },
    });
  },

  setApiKeys: (patch) => {
    const next = { ...get().apiKeys, ...patch };
    set({ apiKeys: next });
    persistSettings({ api_keys: next });
  },
  setGenerationDefaults: (patch) => {
    const next = { ...get().generationDefaults, ...patch };
    set({ generationDefaults: next });
    persistSettings({ generation_defaults: next });
  },
  setAdvancedPrompts: (patch) => {
    const next = { ...get().advancedPrompts, ...patch };
    set({ advancedPrompts: next });
    persistSettings({ advanced_prompt_settings: next });
  },
  resetAdvancedPrompts: () => {
    set({ advancedPrompts: DEFAULT_ADVANCED_PROMPTS });
    persistSettings({ advanced_prompt_settings: DEFAULT_ADVANCED_PROMPTS });
  },
}));
