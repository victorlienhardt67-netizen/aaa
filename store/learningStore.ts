"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LearningEntry } from "@/types";
import { STORAGE_KEYS, safeLocalStorage } from "@/lib/storage";
import { generateId } from "@/lib/utils";

interface LearningState {
  entries: LearningEntry[];
  addEntry: (data: Omit<LearningEntry, "id" | "createdAt">) => void;
  reset: () => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (data) =>
        set((s) => ({
          entries: [
            { ...data, id: generateId("learn"), createdAt: new Date().toISOString() },
            ...s.entries,
          ].slice(0, 200),
        })),
      reset: () => set({ entries: [] }),
    }),
    { name: STORAGE_KEYS.learning, storage: createJSONStorage(() => safeLocalStorage) }
  )
);
