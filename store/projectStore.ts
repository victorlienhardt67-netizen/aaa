"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CharacterReference, LocationReference, Project, ProjectStatus, Scene } from "@/types";
import { STORAGE_KEYS } from "@/lib/storage";
import { generateId } from "@/lib/utils";

interface InitProjectParams {
  name: string;
  brandId: string;
  styleId: string;
  lang: "fr" | "en";
  targetDuration: number;
  imageEngine: Project["imageEngine"];
  videoEngine: Project["videoEngine"];
  templateSourceId?: string;
}

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];

  initProject: (params: InitProjectParams) => Project;
  updateCurrentProject: (patch: Partial<Project>) => void;
  setStatus: (status: ProjectStatus) => void;
  updateScene: (sceneId: string, patch: Partial<Scene>) => void;
  reorderScenes: (orderedIds: string[]) => void;
  /** Ajoute une frame à la fin d'un bloc narratif (beatLabel), clonée sur la dernière frame du bloc. Recalcule les index, aucun appel API. */
  addSceneToBeat: (beatLabel: string) => void;
  /** Retire une frame — refusé si c'est la dernière du bloc (minimum 1 frame par bloc). */
  removeScene: (sceneId: string) => void;
  initCharacterReferences: (refs: CharacterReference[]) => void;
  /** `key` est l'assetId du personnage — un personnage = une seule fiche de référence. */
  updateCharacterReference: (key: string, patch: Partial<CharacterReference>) => void;
  initLocationReferences: (refs: LocationReference[]) => void;
  updateLocationReference: (id: string, patch: Partial<LocationReference>) => void;
  recalcTotalCost: () => void;
  saveCurrentProject: () => void;
  loadProject: (id: string) => void;
  duplicateProject: (id: string) => Project | null;
  deleteProject: (id: string) => void;
  clearCurrentProject: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      projects: [],

      initProject: (params) => {
        const now = new Date().toISOString();
        const project: Project = {
          id: generateId("project"),
          name: params.name,
          brandId: params.brandId,
          styleId: params.styleId,
          lang: params.lang,
          targetDuration: params.targetDuration,
          imageEngine: params.imageEngine,
          videoEngine: params.videoEngine,
          brief: "",
          referenceImages: [],
          status: "brief",
          createdAt: now,
          updatedAt: now,
          totalCostEstimate: 0,
          templateSourceId: params.templateSourceId,
        };
        set({ currentProject: project });
        return project;
      },

      updateCurrentProject: (patch) =>
        set((s) =>
          s.currentProject
            ? { currentProject: { ...s.currentProject, ...patch, updatedAt: new Date().toISOString() } }
            : s
        ),

      setStatus: (status) =>
        set((s) =>
          s.currentProject ? { currentProject: { ...s.currentProject, status } } : s
        ),

      updateScene: (sceneId, patch) =>
        set((s) => {
          if (!s.currentProject?.plan) return s;
          const scenes = s.currentProject.plan.scenes.map((sc) =>
            sc.id === sceneId ? { ...sc, ...patch } : sc
          );
          return {
            currentProject: {
              ...s.currentProject,
              plan: { ...s.currentProject.plan, scenes },
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      reorderScenes: (orderedIds) =>
        set((s) => {
          if (!s.currentProject?.plan) return s;
          const byId = new Map(s.currentProject.plan.scenes.map((sc) => [sc.id, sc]));
          const scenes = orderedIds
            .map((id) => byId.get(id))
            .filter((sc): sc is Scene => !!sc)
            .map((sc, i) => ({ ...sc, index: i + 1 }));
          return {
            currentProject: {
              ...s.currentProject,
              plan: { ...s.currentProject.plan, scenes },
            },
          };
        }),

      addSceneToBeat: (beatLabel) =>
        set((s) => {
          if (!s.currentProject?.plan) return s;
          const scenes = s.currentProject.plan.scenes;
          const beatScenes = scenes.filter((sc) => (sc.beatLabel ?? "Frames") === beatLabel);
          const last = beatScenes[beatScenes.length - 1];
          if (!last) return s;
          const lastIdx = scenes.findIndex((sc) => sc.id === last.id);
          const newScene: Scene = {
            ...last,
            id: generateId("scene"),
            durationSeconds: 4,
            frameUrl: undefined,
            frameStatus: "frame_pending",
            frameHistory: [],
            videoUrl: undefined,
            videoStatus: "video_pending",
            videoCostEstimate: undefined,
            imageCostEstimate: undefined,
            feedback: undefined,
          };
          const updated = [...scenes.slice(0, lastIdx + 1), newScene, ...scenes.slice(lastIdx + 1)].map(
            (sc, i) => ({ ...sc, index: i + 1 })
          );
          return {
            currentProject: {
              ...s.currentProject,
              plan: { ...s.currentProject.plan, scenes: updated },
            },
          };
        }),

      removeScene: (sceneId) =>
        set((s) => {
          if (!s.currentProject?.plan) return s;
          const scenes = s.currentProject.plan.scenes;
          const target = scenes.find((sc) => sc.id === sceneId);
          if (!target) return s;
          const beatLabel = target.beatLabel ?? "Frames";
          const beatCount = scenes.filter((sc) => (sc.beatLabel ?? "Frames") === beatLabel).length;
          if (beatCount <= 1) return s;
          const updated = scenes.filter((sc) => sc.id !== sceneId).map((sc, i) => ({ ...sc, index: i + 1 }));
          return {
            currentProject: {
              ...s.currentProject,
              plan: { ...s.currentProject.plan, scenes: updated },
            },
          };
        }),

      initCharacterReferences: (refs) =>
        set((s) => {
          if (!s.currentProject) return s;
          const existing = s.currentProject.characterReferences ?? {};
          const characterReferences = { ...existing };
          for (const ref of refs) {
            if (!characterReferences[ref.assetId]) {
              characterReferences[ref.assetId] = ref;
            }
          }
          return { currentProject: { ...s.currentProject, characterReferences } };
        }),

      updateCharacterReference: (key, patch) =>
        set((s) => {
          if (!s.currentProject?.characterReferences?.[key]) return s;
          return {
            currentProject: {
              ...s.currentProject,
              characterReferences: {
                ...s.currentProject.characterReferences,
                [key]: { ...s.currentProject.characterReferences[key], ...patch },
              },
            },
          };
        }),

      initLocationReferences: (refs) =>
        set((s) => {
          if (!s.currentProject) return s;
          const existing = s.currentProject.locationReferences ?? {};
          const locationReferences = { ...existing };
          for (const ref of refs) {
            if (!locationReferences[ref.id]) {
              locationReferences[ref.id] = ref;
            }
          }
          return { currentProject: { ...s.currentProject, locationReferences } };
        }),

      updateLocationReference: (id, patch) =>
        set((s) => {
          if (!s.currentProject?.locationReferences?.[id]) return s;
          return {
            currentProject: {
              ...s.currentProject,
              locationReferences: {
                ...s.currentProject.locationReferences,
                [id]: { ...s.currentProject.locationReferences[id], ...patch },
              },
            },
          };
        }),

      recalcTotalCost: () =>
        set((s) => {
          if (!s.currentProject?.plan) return s;
          const total = s.currentProject.plan.scenes.reduce(
            (sum, sc) => sum + (sc.imageCostEstimate ?? 0) + (sc.videoCostEstimate ?? 0),
            0
          );
          return { currentProject: { ...s.currentProject, totalCostEstimate: total } };
        }),

      saveCurrentProject: () =>
        set((s) => {
          if (!s.currentProject) return s;
          const exists = s.projects.some((p) => p.id === s.currentProject!.id);
          const projects = exists
            ? s.projects.map((p) => (p.id === s.currentProject!.id ? s.currentProject! : p))
            : [s.currentProject, ...s.projects];
          return { projects };
        }),

      loadProject: (id) =>
        set((s) => {
          const project = s.projects.find((p) => p.id === id);
          return project ? { currentProject: { ...project } } : s;
        }),

      duplicateProject: (id) => {
        const original = get().projects.find((p) => p.id === id);
        if (!original) return null;
        const now = new Date().toISOString();
        const copy: Project = {
          ...original,
          id: generateId("project"),
          name: `${original.name} (copie)`,
          status: "brief",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ projects: [copy, ...s.projects] }));
        return copy;
      },

      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      clearCurrentProject: () => set({ currentProject: null }),
    }),
    {
      name: STORAGE_KEYS.projects,
      partialize: (s) => ({ projects: s.projects, currentProject: s.currentProject }),
    }
  )
);
