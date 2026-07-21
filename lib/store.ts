"use client";
// ============================================================
// GULDUST STUDIO — store global (Zustand + persistance locale)
// Toute la donnée vit ici et est persistée en localStorage.
// (Étape suivante : bascule vers backend local + SQLite.)
// ============================================================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Brand, Style, Run, Scene, Character, Generation, ProviderKey,
  RunMode, ProductRole, Dialogue, Asset, VoLine,
} from "./types";
import { STYLES, SEED_BRANDS, VOICES, SFX_SUGGESTIONS } from "./seed";
import { getProviders } from "./providers";
import { uid, nowISO, creditsToUsd, slugify } from "./format";

const emptyAsset: Asset = { status: "empty" };

interface State {
  hasHydrated: boolean;
  brands: Brand[];
  activeBrandId: string;
  styles: Style[];
  runs: Record<string, Run>;
  openTabs: string[];
  activeTabId?: string;
  generations: Generation[];
  keys: Record<string, ProviderKey>;
  claudeModel: string;

  setHydrated: () => void;

  setActiveBrand: (id: string) => void;
  addBrand: (name: string, dna?: string) => string;
  updateBrand: (id: string, patch: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;
  addProductImage: (brandId: string, dataUrl: string) => void;
  removeProductImage: (brandId: string, idx: number) => void;

  addStyle: (s: Partial<Style>) => string;
  updateStyle: (id: string, patch: Partial<Style>) => void;

  createRun: (styleId: string, opts?: { name?: string; brandId?: string }) => string;
  updateRun: (id: string, patch: Partial<Run>) => void;
  deleteRun: (id: string) => void;
  openTab: (runId: string) => void;
  closeTab: (runId: string) => void;
  setActiveTab: (runId: string) => void;

  analyzeRun: (runId: string) => Promise<void>;
  setRunMode: (runId: string, mode: RunMode) => void;
  generateFrame: (runId: string, sceneId: string) => Promise<void>;
  generateAllFrames: (runId: string) => Promise<void>;
  generateClip: (runId: string, sceneId: string) => Promise<void>;
  generateAllClips: (runId: string) => Promise<void>;
  generateDialogue: (runId: string, sceneId: string) => Promise<void>;
  redoLipSync: (runId: string, sceneId: string) => Promise<void>;

  patchScene: (runId: string, sceneId: string, patch: Partial<Scene>) => void;
  setSceneCharacter: (runId: string, sceneId: string, characterId: string) => void;
  setSceneProduct: (runId: string, sceneId: string, role: ProductRole) => void;
  toggleSceneDialogue: (runId: string, sceneId: string) => void;
  setDialogue: (runId: string, sceneId: string, patch: Partial<Dialogue>) => void;

  addCharacter: (runId: string, name: string, refImage?: string) => string;

  setKey: (provider: string, key: string, defaultModel?: string) => void;
  removeKey: (provider: string) => void;
  setClaudeModel: (m: string) => void;
}

function reviseRunCost(run: Run): Run {
  let credits = 0;
  for (const s of run.scenes) {
    if (s.frame.status === "done") credits += s.frame.costCredits ?? 0;
    if (s.clip.status === "done") credits += s.clip.costCredits ?? 0;
    if (s.dialogue?.audio.status === "done") credits += s.dialogue.audio.costCredits ?? 0;
    if (s.dialogue?.lipsync.status === "done") credits += s.dialogue.lipsync.costCredits ?? 0;
  }
  return { ...run, costCredits: credits, costUsd: creditsToUsd(credits, "mock") };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      brands: SEED_BRANDS,
      activeBrandId: SEED_BRANDS[0].id,
      styles: STYLES,
      runs: {},
      openTabs: [],
      activeTabId: undefined,
      generations: [],
      keys: {},
      claudeModel: "claude-opus-4-8",

      setHydrated: () => set({ hasHydrated: true }),

      // ---- brands ----
      setActiveBrand: (id) => set({ activeBrandId: id }),
      addBrand: (name, dna = `# BRAND DNA — ${name.toUpperCase()}\n\n## Essence\n\n## Positionnement\n\n## Produit\n\n## Persona\n\n## Claims autorisés\n\n## Rendering locks\n\n## B-Roll shot direction\n`) => {
        const id = slugify(name) || uid("brand");
        const b: Brand = { id, name, dna, productImages: [], createdAt: nowISO(), updatedAt: nowISO() };
        set((st) => ({ brands: [...st.brands, b], activeBrandId: id }));
        return id;
      },
      updateBrand: (id, patch) =>
        set((st) => ({ brands: st.brands.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: nowISO() } : b)) })),
      deleteBrand: (id) =>
        set((st) => {
          const brands = st.brands.filter((b) => b.id !== id);
          return { brands, activeBrandId: st.activeBrandId === id ? brands[0]?.id ?? "" : st.activeBrandId };
        }),
      addProductImage: (brandId, dataUrl) =>
        set((st) => ({ brands: st.brands.map((b) => (b.id === brandId ? { ...b, productImages: [...b.productImages, dataUrl] } : b)) })),
      removeProductImage: (brandId, idx) =>
        set((st) => ({ brands: st.brands.map((b) => (b.id === brandId ? { ...b, productImages: b.productImages.filter((_, i) => i !== idx) } : b)) })),

      // ---- styles ----
      addStyle: (s) => {
        const id = s.key ? slugify(s.key) : uid("style");
        const style: Style = {
          id, key: id, group: "video",
          name: s.name ?? "Nouveau style", subtitle: s.subtitle ?? "", description: s.description ?? "",
          emoji: s.emoji ?? "◆", basePrompt: s.basePrompt ?? "", renderLocks: s.renderLocks ?? "",
          presets: s.presets ?? [], imageModel: s.imageModel ?? "Nano Banana 2", videoModel: s.videoModel ?? "Omni",
          accent: s.accent ?? "#c9a24b", custom: true,
        };
        set((st) => ({ styles: [...st.styles, style] }));
        return id;
      },
      updateStyle: (id, patch) =>
        set((st) => ({ styles: st.styles.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),

      // ---- runs / tabs ----
      createRun: (styleId, opts) => {
        const st = get();
        const style = st.styles.find((s) => s.id === styleId) ?? st.styles[0];
        const brandId = opts?.brandId ?? st.activeBrandId;
        const id = uid("run");
        const run: Run = {
          id,
          name: opts?.name || style.name,
          brandId, styleId: style.id,
          presetId: style.presets[0]?.id,
          format: "9:16", mode: "vo", tone: "tendre / complice",
          script: "", voLines: [],
          imageModel: style.imageModel, videoModel: style.videoModel, voiceProvider: "mock",
          scenes: [], characters: [], status: "draft", createdAt: nowISO(), updatedAt: nowISO(),
          costCredits: 0, costUsd: 0,
        };
        set((s) => ({
          runs: { ...s.runs, [id]: run },
          openTabs: s.openTabs.includes(id) ? s.openTabs : [...s.openTabs, id],
          activeTabId: id,
        }));
        return id;
      },
      updateRun: (id, patch) =>
        set((st) => (st.runs[id] ? { runs: { ...st.runs, [id]: { ...st.runs[id], ...patch, updatedAt: nowISO() } } } : st)),
      deleteRun: (id) =>
        set((st) => {
          const runs = { ...st.runs };
          delete runs[id];
          return { runs, openTabs: st.openTabs.filter((t) => t !== id), activeTabId: st.activeTabId === id ? undefined : st.activeTabId };
        }),
      openTab: (runId) =>
        set((st) => ({ openTabs: st.openTabs.includes(runId) ? st.openTabs : [...st.openTabs, runId], activeTabId: runId })),
      closeTab: (runId) =>
        set((st) => {
          const openTabs = st.openTabs.filter((t) => t !== runId);
          return { openTabs, activeTabId: st.activeTabId === runId ? openTabs[openTabs.length - 1] : st.activeTabId };
        }),
      setActiveTab: (runId) => set({ activeTabId: runId }),

      // ---- analysis ----
      analyzeRun: async (runId) => {
        const st = get();
        const run = st.runs[runId];
        if (!run) return;
        const brand = st.brands.find((b) => b.id === run.brandId);
        const P = getProviders();
        const res = await P.analyze({
          script: run.script, brandDna: brand?.dna ?? "", mode: run.mode,
          styleKey: run.styleId, voDuration: run.voDuration,
        });

        const characters: Character[] = res.characters.map((c) => ({
          id: uid("char"), name: c.name, source: "generated", scope: "run",
          brandId: run.brandId, voiceId: VOICES[0].id, createdAt: nowISO(),
        }));

        const voLines: VoLine[] = [];
        let cursor = 0;
        const scenes: Scene[] = res.scenes.map((sc, i) => {
          voLines.push({ index: i + 1, text: sc.voLine, start: cursor, duration: sc.duration });
          cursor += sc.duration;
          const isDlg = run.mode !== "vo" && sc.isDialogue;
          const speaker = characters.find((c) => c.name === sc.speaker) ?? characters[i % characters.length];
          const dialogue: Dialogue | undefined = isDlg
            ? { speakerId: speaker?.id ?? "", line: sc.line ?? sc.voLine, voiceId: speaker?.voiceId, audio: { ...emptyAsset }, lipsync: { ...emptyAsset } }
            : undefined;
          return {
            id: uid("sc"), index: i + 1, tag: sc.tag, framing: sc.framing, voLine: sc.voLine, voDuration: sc.duration,
            characterId: speaker?.id ?? "none", product: { role: (i % 3 === 0 ? "star" : "background") as ProductRole },
            warnings: [], frame: { ...emptyAsset }, clip: { ...emptyAsset }, clipDuration: 4,
            sfxSuggestion: SFX_SUGGESTIONS[i % SFX_SUGGESTIONS.length],
            isDialogue: isDlg, dialogue,
          };
        });

        set((s) => ({
          runs: { ...s.runs, [runId]: { ...s.runs[runId], scenes, voLines, voDuration: res.voDuration, status: "analyzed", updatedAt: nowISO(), characters } },
        }));
      },

      setRunMode: (runId, mode) => set((st) => (st.runs[runId] ? { runs: { ...st.runs, [runId]: { ...st.runs[runId], mode } } } : st)),

      // ---- generation ----
      generateFrame: async (runId, sceneId) => {
        const st = get();
        const run = st.runs[runId];
        const scene = run?.scenes.find((s) => s.id === sceneId);
        const style = st.styles.find((s) => s.id === run?.styleId);
        if (!run || !scene || !style) return;
        get().patchScene(runId, sceneId, { frame: { ...scene.frame, status: "running" } });
        const P = getProviders();
        try {
          const r = await P.image({
            prompt: [style.basePrompt, scene.framing, scene.customPrompt, scene.voLine].filter(Boolean).join(" · "),
            styleKey: style.key, aspect: run.format, model: run.imageModel, accent: style.accent, label: `SC-${String(scene.index).padStart(2, "0")}`,
          });
          get().patchScene(runId, sceneId, {
            frame: { status: "done", url: r.url, provider: r.provider, model: r.model, costCredits: r.costCredits, seed: r.seed, createdAt: nowISO() },
          });
          _pushGen(set, { kind: "frame", runId, sceneId, styleKey: style.key, brandId: run.brandId, url: r.url, status: "done", costCredits: r.costCredits });
        } catch (e: any) {
          get().patchScene(runId, sceneId, { frame: { ...scene.frame, status: "error", error: String(e?.message ?? e) } });
        }
        set((s) => ({ runs: { ...s.runs, [runId]: reviseRunCost(s.runs[runId]) } }));
      },

      generateAllFrames: async (runId) => {
        const scenes = get().runs[runId]?.scenes ?? [];
        get().updateRun(runId, { status: "framing" });
        for (const sc of scenes) {
          if (sc.frame.status !== "done") await get().generateFrame(runId, sc.id);
        }
      },

      generateClip: async (runId, sceneId) => {
        const st = get();
        const run = st.runs[runId];
        const scene = run?.scenes.find((s) => s.id === sceneId);
        if (!run || !scene || scene.frame.status !== "done") return;
        get().patchScene(runId, sceneId, { clip: { ...scene.clip, status: "running" } });
        const P = getProviders();
        try {
          const r = await P.video({
            frameUrl: scene.frame.url!, prompt: scene.movementPrompt, duration: scene.clipDuration,
            model: run.videoModel, styleKey: run.styleId,
          });
          get().patchScene(runId, sceneId, {
            clip: { status: "done", url: r.url, provider: r.provider, model: r.model, costCredits: r.costCredits, createdAt: nowISO() },
          });
          _pushGen(set, { kind: "clip", runId, sceneId, styleKey: run.styleId, brandId: run.brandId, url: r.url, status: "done", costCredits: r.costCredits });
        } catch (e: any) {
          get().patchScene(runId, sceneId, { clip: { ...scene.clip, status: "error", error: String(e?.message ?? e) } });
        }
        set((s) => ({ runs: { ...s.runs, [runId]: reviseRunCost(s.runs[runId]) } }));
      },

      generateAllClips: async (runId) => {
        const scenes = get().runs[runId]?.scenes ?? [];
        get().updateRun(runId, { status: "animating" });
        for (const sc of scenes) {
          if (sc.frame.status === "done" && sc.clip.status !== "done") await get().generateClip(runId, sc.id);
        }
        const run = get().runs[runId];
        if (run && run.scenes.every((s) => s.clip.status === "done")) get().updateRun(runId, { status: "ready" });
      },

      generateDialogue: async (runId, sceneId) => {
        const st = get();
        const run = st.runs[runId];
        const scene = run?.scenes.find((s) => s.id === sceneId);
        if (!run || !scene || !scene.dialogue) return;
        const P = getProviders();
        get().setDialogue(runId, sceneId, { audio: { ...scene.dialogue.audio, status: "running" } });
        const tts = await P.tts({ text: scene.dialogue.line, voiceId: scene.dialogue.voiceId ?? VOICES[0].id });
        get().setDialogue(runId, sceneId, { audio: { status: "done", url: tts.url, costCredits: tts.costCredits, createdAt: nowISO() }, duration: tts.duration });
        _pushGen(set, { kind: "tts", runId, sceneId, brandId: run.brandId, status: "done", costCredits: tts.costCredits });
        if (scene.frame.status === "done" && !scene.dialogue.offscreen) {
          get().setDialogue(runId, sceneId, { lipsync: { status: "running" } });
          const ls = await P.lipsync({ frameUrl: scene.frame.url!, audioUrl: tts.url });
          get().setDialogue(runId, sceneId, { lipsync: { status: "done", url: ls.url, costCredits: ls.costCredits, createdAt: nowISO() } });
          _pushGen(set, { kind: "lipsync", runId, sceneId, brandId: run.brandId, status: "done", costCredits: ls.costCredits });
        }
        set((s) => ({ runs: { ...s.runs, [runId]: reviseRunCost(s.runs[runId]) } }));
      },

      redoLipSync: async (runId, sceneId) => {
        const st = get();
        const scene = st.runs[runId]?.scenes.find((s) => s.id === sceneId);
        if (!scene?.dialogue || scene.dialogue.audio.status !== "done" || scene.frame.status !== "done") return;
        const P = getProviders();
        get().setDialogue(runId, sceneId, { lipsync: { status: "running" } });
        const ls = await P.lipsync({ frameUrl: scene.frame.url!, audioUrl: scene.dialogue.audio.url! });
        get().setDialogue(runId, sceneId, { lipsync: { status: "done", url: ls.url, costCredits: ls.costCredits, createdAt: nowISO() } });
      },

      // ---- scene edits ----
      patchScene: (runId, sceneId, patch) =>
        set((st) => {
          const run = st.runs[runId];
          if (!run) return st;
          return { runs: { ...st.runs, [runId]: { ...run, scenes: run.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)) } } };
        }),
      setSceneCharacter: (runId, sceneId, characterId) => get().patchScene(runId, sceneId, { characterId }),
      setSceneProduct: (runId, sceneId, role) => get().patchScene(runId, sceneId, { product: { role } }),
      toggleSceneDialogue: (runId, sceneId) =>
        set((st) => {
          const run = st.runs[runId];
          if (!run) return st;
          const chars = run.characters;
          return {
            runs: {
              ...st.runs,
              [runId]: {
                ...run,
                scenes: run.scenes.map((s) => {
                  if (s.id !== sceneId) return s;
                  const on = !s.isDialogue;
                  const speaker = chars.find((c) => c.id === s.characterId) ?? chars[0];
                  return {
                    ...s,
                    isDialogue: on,
                    dialogue: on
                      ? s.dialogue ?? { speakerId: speaker?.id ?? "", line: s.voLine, voiceId: speaker?.voiceId, audio: { status: "empty" }, lipsync: { status: "empty" } }
                      : s.dialogue,
                  };
                }),
              },
            },
          };
        }),
      setDialogue: (runId, sceneId, patch) =>
        set((st) => {
          const run = st.runs[runId];
          if (!run) return st;
          return {
            runs: {
              ...st.runs,
              [runId]: { ...run, scenes: run.scenes.map((s) => (s.id === sceneId && s.dialogue ? { ...s, dialogue: { ...s.dialogue, ...patch } } : s)) },
            },
          };
        }),

      addCharacter: (runId, name, refImage) => {
        const id = uid("char");
        set((st) => {
          const run = st.runs[runId];
          if (!run) return st;
          const c: Character = { id, name, refImage, source: refImage ? "photo" : "generated", scope: "run", brandId: run.brandId, voiceId: VOICES[0].id, createdAt: nowISO() };
          return { runs: { ...st.runs, [runId]: { ...run, characters: [...run.characters, c] } } };
        });
        return id;
      },

      // ---- keys ----
      setKey: (provider, key, defaultModel) =>
        set((st) => ({ keys: { ...st.keys, [provider]: { provider, key, defaultModel } } })),
      removeKey: (provider) =>
        set((st) => {
          const keys = { ...st.keys };
          delete keys[provider];
          return { keys };
        }),
      setClaudeModel: (m) => set({ claudeModel: m }),
    }),
    {
      name: "guldust-studio",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        brands: s.brands, activeBrandId: s.activeBrandId, styles: s.styles, runs: s.runs,
        openTabs: s.openTabs, activeTabId: s.activeTabId, generations: s.generations,
        keys: s.keys, claudeModel: s.claudeModel,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);

function _pushGen(set: any, g: Omit<Generation, "id" | "createdAt" | "costUsd">) {
  const gen: Generation = { ...g, id: uid("gen"), createdAt: nowISO(), costUsd: creditsToUsd(g.costCredits, "mock") };
  set((st: State) => ({ generations: [gen, ...st.generations].slice(0, 500) }));
}

export function getRunCharacters(run?: Run): Character[] {
  return run?.characters ?? [];
}
