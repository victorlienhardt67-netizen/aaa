"use client";

import { Check, Menu, Plus } from "lucide-react";
import { useBrandStore } from "@/store/brandStore";
import { useProjectStore } from "@/store/projectStore";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AGENT_STEPS, agentStepIndex } from "./steps";

export function AgentTopbar({
  onNewProduction,
  onOpenMenu,
}: {
  onNewProduction: () => void;
  /** Ouvre le vrai menu de navigation (même composant/couleurs que le reste du site) en superposition. */
  onOpenMenu: () => void;
}) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const brands = useBrandStore((s) => s.brands);
  const brand = brands.find((b) => b.id === currentProject?.brandId);

  const framedScenes = currentProject?.plan?.scenes.filter((s) => s.needsFrame) ?? [];
  const allFramesValidated =
    framedScenes.length > 0 && framedScenes.every((s) => s.frameStatus === "frame_validated");
  const status = currentProject?.status ?? "brief";
  const currentStep = agentStepIndex(status, allFramesValidated);

  return (
    <header className="h-14 shrink-0 border-b border-agent-bd bg-agent-s1 flex items-center px-5 gap-5">
      <button
        type="button"
        onClick={onOpenMenu}
        title="Ouvrir le menu"
        className="shrink-0 p-2 -ml-2 rounded-md text-agent-t2 hover:text-agent-t1 hover:bg-agent-s2 transition-colors"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold text-[15px] tracking-tight text-agent-t1">Golddust</span>
        <span className="font-semibold text-[15px] tracking-tight text-agent-acc">Studio</span>
      </div>

      {currentProject && (
        <div className="flex items-center gap-2 bg-agent-s2 border border-agent-bd rounded-md px-3 py-1.5 text-[12px] text-agent-t2 shrink-0">
          <span className="text-agent-t1 font-medium">{brand?.name ?? "Sans marque"}</span>
          <span className="text-agent-t3">·</span>
          <span className="truncate max-w-[160px]">{currentProject.name}</span>
          <span className="text-agent-t3">·</span>
          <span className="uppercase">{currentProject.lang}</span>
        </div>
      )}

      <nav className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
        {AGENT_STEPS.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div
              key={label}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] whitespace-nowrap border transition-colors",
                done && "bg-agent-grn/10 border-agent-grn/30 text-agent-grn",
                active && "bg-agent-accs border-agent-acc/40 text-agent-acc",
                !done && !active && "border-transparent text-agent-t3"
              )}
            >
              {done ? <Check className="w-3 h-3" /> : <span className="w-1 h-1 rounded-full bg-current" />}
              {label}
            </div>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onNewProduction}
        className="shrink-0 flex items-center gap-1.5 bg-agent-acc hover:bg-agent-acc2 transition-colors text-white text-[12.5px] font-medium px-3.5 py-1.5 rounded-md"
      >
        <Plus className="w-3.5 h-3.5" /> Nouvelle prod
      </button>

      <LogoutButton className="shrink-0 text-agent-t3 hover:text-agent-t1 transition-colors" />
    </header>
  );
}
