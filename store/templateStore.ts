"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CampaignTemplate } from "@/types";
import { STORAGE_KEYS, safeLocalStorage } from "@/lib/storage";
import { generateId } from "@/lib/utils";

const SEED_TEMPLATES: CampaignTemplate[] = [
  {
    id: "tpl_vsl_90",
    name: "VSL 90s — Problème → Agitation → Solution",
    description:
      "Structure classique de Video Sales Letter : on expose le problème, on l'amplifie émotionnellement, puis on introduit le produit comme solution évidente, avec preuve sociale et appel à l'action final.",
    structure:
      "1) Hook fort sur le problème. 2) Agitation — conséquences du problème non résolu. 3) Transition vers la solution. 4) Présentation du produit et de ses mécanismes. 5) Preuves / témoignages. 6) Démonstration d'usage. 7) Traitement des objections. 8) Offre + urgence. 9) Appel à l'action final.",
    recommendedScenes: 14,
    recommendedDuration: 90,
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_ugc_unboxing_60",
    name: "UGC Unboxing 60s",
    description:
      "Format authentique façon créateur de contenu : déballage du produit, premières impressions spontanées, test rapide et avis sincère face caméra.",
    structure:
      "1) Hook UGC casual (\"Je viens de recevoir...\"). 2) Déballage du colis. 3) Premières impressions sur le packaging. 4) Découverte du produit. 5) Test / application en direct. 6) Réaction authentique. 7) Avis personnel + recommandation. 8) CTA naturel.",
    recommendedScenes: 8,
    recommendedDuration: 60,
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_ad_produit_45",
    name: "Ad Produit 45s — Hook fort + démo + CTA",
    description:
      "Format publicitaire court et efficace pour les réseaux sociaux : accroche immédiate, démonstration rapide des bénéfices clés, appel à l'action clair.",
    structure:
      "1) Hook fort dans les 3 premières secondes. 2) Présentation rapide du produit. 3) Démonstration des 2-3 bénéfices clés. 4) Preuve rapide (avant/après, stat, témoignage). 5) Call-to-action clair avec offre.",
    recommendedScenes: 6,
    recommendedDuration: 45,
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
];

interface TemplateState {
  templates: CampaignTemplate[];
  pendingTemplate: CampaignTemplate | null;
  addCustomTemplate: (data: Omit<CampaignTemplate, "id" | "isCustom" | "createdAt">) => void;
  deleteTemplate: (id: string) => void;
  setPendingTemplate: (template: CampaignTemplate) => void;
  clearPendingTemplate: () => void;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set) => ({
      templates: SEED_TEMPLATES,
      pendingTemplate: null,
      addCustomTemplate: (data) =>
        set((s) => ({
          templates: [
            ...s.templates,
            { ...data, id: generateId("tpl"), isCustom: true, createdAt: new Date().toISOString() },
          ],
        })),
      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id || !t.isCustom) })),
      setPendingTemplate: (template) => set({ pendingTemplate: template }),
      clearPendingTemplate: () => set({ pendingTemplate: null }),
    }),
    {
      name: STORAGE_KEYS.templates,
      storage: createJSONStorage(() => safeLocalStorage),
      merge: (persisted, current) => {
        const p = persisted as TemplateState | undefined;
        if (!p || !p.templates || p.templates.length === 0) return { ...current, ...p };
        const customs = p.templates.filter((t) => t.isCustom);
        return { ...current, ...p, templates: [...SEED_TEMPLATES, ...customs] };
      },
    }
  )
);
