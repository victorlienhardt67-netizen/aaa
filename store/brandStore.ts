"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Brand, BrandAsset } from "@/types";
import { STORAGE_KEYS, safeLocalStorage } from "@/lib/storage";
import { DEFAULT_BRANDS } from "@/lib/brandSeeds";
import { generateId } from "@/lib/utils";

interface BrandState {
  brands: Brand[];
  activeBrandId: string | null;
  createBrand: (data: Omit<Brand, "id" | "createdAt" | "updatedAt" | "productPhotos" | "characterPhotos">) => Brand;
  updateBrand: (id: string, patch: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;
  setActiveBrand: (id: string | null) => void;
  addProductPhoto: (brandId: string, asset: Omit<BrandAsset, "id" | "createdAt">) => void;
  addCharacterPhoto: (brandId: string, asset: Omit<BrandAsset, "id" | "createdAt">) => void;
  removeProductPhoto: (brandId: string, assetId: string) => void;
  removeCharacterPhoto: (brandId: string, assetId: string) => void;
  renameCharacterPhoto: (brandId: string, assetId: string, name: string) => void;
  touchLastUsed: (brandId: string) => void;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set, get) => ({
      brands: DEFAULT_BRANDS,
      activeBrandId: null,

      createBrand: (data) => {
        const now = new Date().toISOString();
        const brand: Brand = {
          ...data,
          id: generateId("brand"),
          productPhotos: [],
          characterPhotos: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ brands: [...s.brands, brand] }));
        return brand;
      },

      updateBrand: (id, patch) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b
          ),
        })),

      deleteBrand: (id) =>
        set((s) => ({
          brands: s.brands.filter((b) => b.id !== id),
          activeBrandId: s.activeBrandId === id ? null : s.activeBrandId,
        })),

      setActiveBrand: (id) => set({ activeBrandId: id }),

      addProductPhoto: (brandId, asset) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  productPhotos: [
                    ...b.productPhotos,
                    { ...asset, id: generateId("asset"), createdAt: new Date().toISOString() },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        })),

      addCharacterPhoto: (brandId, asset) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  characterPhotos: [
                    ...b.characterPhotos,
                    { ...asset, id: generateId("asset"), createdAt: new Date().toISOString() },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        })),

      removeProductPhoto: (brandId, assetId) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === brandId
              ? { ...b, productPhotos: b.productPhotos.filter((p) => p.id !== assetId) }
              : b
          ),
        })),

      removeCharacterPhoto: (brandId, assetId) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === brandId
              ? { ...b, characterPhotos: b.characterPhotos.filter((p) => p.id !== assetId) }
              : b
          ),
        })),

      renameCharacterPhoto: (brandId, assetId, name) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  characterPhotos: b.characterPhotos.map((p) =>
                    p.id === assetId ? { ...p, name } : p
                  ),
                }
              : b
          ),
        })),

      touchLastUsed: (brandId) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === brandId ? { ...b, lastUsedAt: new Date().toISOString() } : b
          ),
        })),
    }),
    { name: STORAGE_KEYS.brands, storage: createJSONStorage(() => safeLocalStorage) }
  )
);
