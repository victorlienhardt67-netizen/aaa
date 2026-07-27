"use client";

import { usePathname } from "next/navigation";
import { Building2, Circle, DollarSign } from "lucide-react";
import { useBrandStore } from "@/store/brandStore";
import { useUiStore } from "@/store/uiStore";
import { useProjectStore } from "@/store/projectStore";
import { Toggle } from "@/components/ui/Toggle";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { initials, formatCost } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const brands = useBrandStore((s) => s.brands);
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const setActiveBrand = useBrandStore((s) => s.setActiveBrand);
  const activeLang = useUiStore((s) => s.activeLang);
  const setActiveLang = useUiStore((s) => s.setActiveLang);
  const currentProject = useProjectStore((s) => s.currentProject);

  const activeBrand = brands.find((b) => b.id === activeBrandId);
  const isStudio = pathname?.startsWith("/studio");

  return (
    <header className="h-16 shrink-0 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-6 gap-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 bg-surface border border-border rounded px-2.5 py-1.5">
          <Building2 className="w-3.5 h-3.5 text-gold" />
          {brands.length === 0 ? (
            <span className="text-xs text-ink-secondary">Aucune marque créée</span>
          ) : (
            <select
              value={activeBrandId ?? ""}
              onChange={(e) => setActiveBrand(e.target.value || null)}
              className="bg-transparent text-xs text-ink font-medium focus:outline-none"
            >
              <option value="">Sélectionner une marque</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {activeBrand && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-background shrink-0"
            style={{ backgroundColor: activeBrand.colors.accent || "#C9A84C" }}
          >
            {initials(activeBrand.name)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {isStudio && currentProject && (
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded px-2.5 py-1.5">
            <DollarSign className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-mono text-ink">
              {formatCost(currentProject.totalCostEstimate)}
            </span>
            <span className="text-[10px] text-ink-secondary">estimé</span>
          </div>
        )}

        <Toggle
          value={activeLang}
          onChange={setActiveLang}
          options={[
            { value: "fr", label: "FR" },
            { value: "en", label: "EN" },
          ]}
        />

        <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
          Connecté
        </div>

        <LogoutButton className="text-ink-secondary hover:text-ink transition-colors" />
      </div>
    </header>
  );
}
