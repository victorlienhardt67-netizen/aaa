"use client";

import { X } from "lucide-react";
import { useBrandStore } from "@/store/brandStore";
import { useStyleStore } from "@/store/styleStore";
import { useProjectStore } from "@/store/projectStore";
import { useLearningStore } from "@/store/learningStore";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-agent-bd pb-3 mb-3 last:border-0">
      <div className="text-[10.5px] uppercase tracking-wide text-agent-t3 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

/**
 * Panneau de contexte persistant d'une production — l'équivalent local du
 * "Project Brain" : au lieu d'un JSON stocké en base (pas de backend dans
 * cette architecture), il lit directement le state Zustand déjà présent
 * (currentProject, brand, style, learnings) et se met à jour en temps réel.
 */
export function ProjectBrain({ onClose }: { onClose: () => void }) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const brands = useBrandStore((s) => s.brands);
  const styles = useStyleStore((s) => s.styles);
  const learningEntries = useLearningStore((s) => s.entries);

  const brand = brands.find((b) => b.id === currentProject?.brandId);
  const style = styles.find((s) => s.id === currentProject?.styleId);
  const plan = currentProject?.plan;
  const relevantLearnings = learningEntries.filter((l) => !brand || l.engine === currentProject?.videoEngine || l.engine === currentProject?.imageEngine);

  return (
    <div className="absolute inset-0 z-30 flex justify-end">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-[300px] shrink-0 bg-agent-s1 border-l border-agent-bd h-full overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-medium text-agent-t1">Project Brain</span>
          <button onClick={onClose} className="text-agent-t3 hover:text-agent-t1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!currentProject ? (
          <p className="text-[12px] text-agent-t3">Aucune production active.</p>
        ) : (
          <>
            <Section label="Marque & langue & modèle">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-agent-t1">{brand?.name ?? "—"}</span>
                <span className="text-[11px] bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-agent-t1 uppercase">{currentProject.lang}</span>
                <span className="text-[11px] bg-agent-s3 border border-agent-bd rounded px-2 py-1 text-agent-t1">{currentProject.videoEngine}</span>
              </div>
            </Section>

            {brand?.description && (
              <Section label="Cible audience">
                <p className="text-[12px] text-agent-t2">{brand.description}</p>
              </Section>
            )}

            <Section label="Style validé">
              <p className="text-[12px] text-agent-t1">{style?.name ?? "—"}</p>
              {style?.shortDescription && <p className="text-[11px] text-agent-t3 mt-0.5">{style.shortDescription}</p>}
            </Section>

            {plan?.arcNarratif && (
              <Section label="Arc narratif">
                <p className="text-[12px] text-agent-t2">{plan.arcNarratif}</p>
              </Section>
            )}

            {plan?.characterNames && Object.keys(plan.characterNames).length > 0 && (
              <Section label="Personnages actifs">
                <div className="space-y-1.5">
                  {Object.entries(plan.characterNames).map(([id, name]) => {
                    const ref = currentProject.characterReferences?.[id];
                    return (
                      <div key={id} className="flex items-center gap-2">
                        {ref?.sheetUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ref.sheetUrl} alt={name} className="w-7 h-7 rounded object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded bg-agent-s3" />
                        )}
                        <span className="text-[12px] text-agent-t1">{name}</span>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {brand && brand.productPhotos.length > 0 && (
              <Section label="Produit actif">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brand.productPhotos[0].url} alt="" className="w-7 h-7 rounded object-cover" />
                  <span className="text-[12px] text-agent-t1">{brand.productPhotos[0].name ?? brand.name}</span>
                </div>
              </Section>
            )}

            <Section label="Règles actives">
              <ul className="space-y-1 text-[11.5px] text-agent-t2 list-disc pl-4">
                <li>exactly two arms, no extra limbs, anatomically correct hands</li>
                <li>Symptôme physique visible si rétention/SOPK</li>
                {currentProject.lang === "fr" && <li>S-O-P-K épelé, é → er dans les dialogues</li>}
                <li>Durée vidéo calculée (mots ÷ 2,5), jamais laissée au modèle</li>
              </ul>
            </Section>

            <Section label="Apprentissages appliqués">
              {relevantLearnings.length === 0 ? (
                <p className="text-[11.5px] text-agent-t3">Aucun pour l&apos;instant.</p>
              ) : (
                <ul className="space-y-1 text-[11.5px] text-agent-t2 list-disc pl-4">
                  {relevantLearnings.slice(0, 6).map((l) => (
                    <li key={l.id}>{l.reason}</li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
