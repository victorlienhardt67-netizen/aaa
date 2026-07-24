"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { AgentTopbar } from "@/components/studio-agent/Topbar";
import { MediaCanvas } from "@/components/studio-agent/MediaCanvas";
import { ProjectBrain } from "@/components/studio-agent/ProjectBrain";
import { Library } from "@/components/studio-agent/Library";
import { ExportPanel } from "@/components/studio/ExportPanel";
import { Sidebar } from "@/components/sidebar/Sidebar";

export default function StudioPage() {
  const clearCurrentProject = useProjectStore((s) => s.clearCurrentProject);
  const status = useProjectStore((s) => s.currentProject?.status);
  const [brainOpen, setBrainOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNewProduction() {
    if (confirm("Repartir d'une nouvelle production ? La production en cours sera perdue si elle n'est pas sauvegardée.")) {
      clearCurrentProject();
      setBrainOpen(false);
      setLibraryOpen(false);
    }
  }

  const isExportStage = status === "export" || status === "completed";

  return (
    <div className="flex flex-col h-screen bg-agent-bg text-agent-t1 font-body text-[13px]">
      <AgentTopbar onNewProduction={handleNewProduction} onOpenMenu={() => setMenuOpen(true)} />
      {isExportStage ? (
        <div className="flex-1 overflow-y-auto bg-background text-ink">
          <ExportPanel />
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 relative">
          <MediaCanvas onOpenLibrary={() => setLibraryOpen(true)} onOpenProjectBrain={() => setBrainOpen(true)} />
          {brainOpen && <ProjectBrain onClose={() => setBrainOpen(false)} />}
          {libraryOpen && <Library onClose={() => setLibraryOpen(false)} />}
        </div>
      )}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-[240px] shrink-0 h-full">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMenuOpen(false)} />
        </div>
      )}
    </div>
  );
}
