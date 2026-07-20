"use client";

import { useState } from "react";
import { Package, Users, MapPin, X } from "lucide-react";
import { useBrandStore } from "@/store/brandStore";
import { useProjectStore } from "@/store/projectStore";
import { cn } from "@/lib/utils";

type Tab = "produits" | "personnages" | "decors";

export function Library({ onClose }: { onClose: () => void }) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const brands = useBrandStore((s) => s.brands);
  const brand = brands.find((b) => b.id === currentProject?.brandId);
  const [tab, setTab] = useState<Tab>("produits");

  const characterEntries = Object.entries(currentProject?.characterReferences ?? {});
  const locationEntries = Object.entries(currentProject?.locationReferences ?? {});

  return (
    <div className="absolute inset-0 z-30 flex justify-end">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-[340px] shrink-0 bg-agent-s1 border-l border-agent-bd h-full overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-medium text-agent-t1">Bibliothèque</span>
          <button onClick={onClose} className="text-agent-t3 hover:text-agent-t1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex bg-agent-s2 border border-agent-bd rounded-md overflow-hidden mb-4">
          {([
            { key: "produits", label: "Produits", icon: Package },
            { key: "personnages", label: "Personnages", icon: Users },
            { key: "decors", label: "Décors", icon: MapPin },
          ] as { key: Tab; label: string; icon: typeof Package }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium",
                tab === key ? "bg-agent-acc text-white" : "text-agent-t2"
              )}
            >
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>

        {tab === "produits" && (
          <div className="space-y-2">
            {!brand || brand.productPhotos.length === 0 ? (
              <p className="text-[11.5px] text-agent-t3">Aucun produit enregistré pour {brand?.name ?? "cette marque"}.</p>
            ) : (
              brand.productPhotos.map((p) => (
                <div key={p.id} className="flex items-center gap-2.5 bg-agent-s2 border border-agent-bd rounded-md p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.name ?? ""} className="w-10 h-10 rounded object-cover" />
                  <div className="min-w-0">
                    <div className="text-[12px] text-agent-t1 truncate">{p.name ?? brand.name}</div>
                    <div className="text-[10.5px] text-agent-t3">{brand.name}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "personnages" && (
          <div className="space-y-2">
            {characterEntries.length === 0 ? (
              <p className="text-[11.5px] text-agent-t3">Aucun personnage sur cette production.</p>
            ) : (
              characterEntries.map(([id, ref]) => (
                <div key={id} className="flex items-center gap-2.5 bg-agent-s2 border border-agent-bd rounded-md p-2">
                  {ref.sheetUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ref.sheetUrl} alt={ref.name} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-agent-s3" />
                  )}
                  <div className="min-w-0">
                    <div className="text-[12px] text-agent-t1 truncate">{ref.name}</div>
                    <div className="text-[10.5px] text-agent-t3">{ref.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "decors" && (
          <div className="space-y-2">
            {locationEntries.length === 0 ? (
              <p className="text-[11.5px] text-agent-t3">Aucun décor sur cette production.</p>
            ) : (
              locationEntries.map(([id, ref]) => (
                <div key={id} className="flex items-center gap-2.5 bg-agent-s2 border border-agent-bd rounded-md p-2">
                  {ref.sheetUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ref.sheetUrl} alt={ref.name} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-agent-s3" />
                  )}
                  <div className="min-w-0">
                    <div className="text-[12px] text-agent-t1 truncate">{ref.name}</div>
                    <div className="text-[10.5px] text-agent-t3">{ref.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
