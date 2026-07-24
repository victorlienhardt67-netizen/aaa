"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CharacterReference, LocationReference, Project, ProjectStatus, Scene } from "@/types";
import { STORAGE_KEYS } from "@/lib/storage";
import { generateId } from "@/lib/utils";

/**
 * Une génération marquée "generating" ne peut plus jamais aboutir après un
 * rechargement de page (le fetch/poll en cours vivait dans le contexte JS
 * précédent, désormais perdu) — sans ce nettoyage au chargement, la scène
 * reste bloquée indéfiniment sur son spinner, sans bouton pour relancer.
 */
function sanitizeStuckScene(sc: Scene): Scene {
  let next = sc;
  if (next.frameStatus === "frame_generating") {
    next = { ...next, frameStatus: "error", frameError: "Génération interrompue (page rechargée ou fermée) — clique sur Réessayer." };
  }
  if (next.videoStatus === "video_generating") {
    next = { ...next, videoStatus: "error", videoError: "Génération interrompue (page rechargée ou fermée) — clique sur Réessayer." };
  }
  return next;
}

function sanitizeStuckReferences<T extends { status: CharacterReference["status"] }>(
  refs: Record<string, T> | undefined
): Record<string, T> | undefined {
  if (!refs) return refs;
  const entries = Object.entries(refs).map(
    ([k, ref]) => [k, ref.status === "generating" ? { ...ref, status: "pending" as const } : ref] as const
  );
  return Object.fromEntries(entries);
}

function sanitizeProject(project: Project): Project {
  return {
    ...project,
    plan: project.plan ? { ...project.plan, scenes: project.plan.scenes.map(sanitizeStuckScene) } : project.plan,
    characterReferences: sanitizeStuckReferences(project.characterReferences),
    locationReferences: sanitizeStuckReferences(project.locationReferences),
  };
}

/**
 * `voiceOverAudioUrl` est le MP3 uploadé encodé en base64 — souvent plusieurs
 * Mo, ce qui dépasse vite le quota de localStorage (~5-10 Mo par origine) une
 * fois écrit dans le state persisté, faisant échouer silencieusement TOUTE
 * écriture suivante (QuotaExceededError), y compris celles sans rapport avec
 * l'audio. On garde ce champ en mémoire pour la session en cours (transcription,
 * calage des durées) mais on ne le persiste jamais dans localStorage — seule
 * la durée (un simple nombre) survit à un rechargement de page.
 */
function stripUnpersistableProject(project: Project): Project {
  const { voiceOverAudioUrl: _voiceOverAudioUrl, ...rest } = project;
  return rest as Project;
}

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
    (rawSet, get) => {
      /**
       * Toute action passe par ce `set` plutôt que `rawSet` directement :
       * après chaque mise à jour, `currentProject` est automatiquement
       * reflété (créé ou synchronisé) dans `projects`, l'historique consulté
       * par la page /projects. Auparavant seul un appel explicite à
       * saveCurrentProject() (jamais déclenché par le studio actuel)
       * l'ajoutait à l'historique — démarrer une nouvelle prod ou fermer
       * l'onglet perdait donc silencieusement le travail en cours.
       */
      const set: typeof rawSet = (partial, replace) => {
        rawSet(partial as never, replace as never);
        const s = get();
        if (!s.currentProject) return;
        const idx = s.projects.findIndex((p) => p.id === s.currentProject!.id);
        if (idx === -1) {
          rawSet({ projects: [s.currentProject, ...s.projects] });
        } else if (s.projects[idx] !== s.currentProject) {
          const next = [...s.projects];
          next[idx] = s.currentProject;
          rawSet({ projects: next });
        }
      };
      return {
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
      };
    },
    {
      name: STORAGE_KEYS.projects,
      partialize: (s) => ({
        projects: s.projects.map(stripUnpersistableProject),
        currentProject: s.currentProject ? stripUnpersistableProject(s.currentProject) : s.currentProject,
      }),
      // `merge` (pas `onRehydrateStorage`) est le hook garanti appliqué via
      // setState par le middleware persist — une mutation directe dans
      // onRehydrateStorage n'est pas fiable pour transformer l'état rechargé.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ProjectState> | undefined;
        return {
          ...currentState,
          ...persisted,
          currentProject: persisted?.currentProject ? sanitizeProject(persisted.currentProject) : currentState.currentProject,
          projects: (persisted?.projects ?? currentState.projects).map(sanitizeProject),
        };
      },
    }
  )
);
