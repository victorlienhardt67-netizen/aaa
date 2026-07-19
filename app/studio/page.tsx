"use client";

import { RefreshCw, RotateCcw } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { StudioProgressBar, getStepIndex } from "@/components/studio/ProgressBar";
import { BriefStep } from "@/components/studio/BriefStep";
import { BriefCoConstruction } from "@/components/studio/BriefCoConstruction";
import { ScenePlanEditor } from "@/components/studio/ScenePlanEditor";
import { CharacterReferences } from "@/components/studio/CharacterReferences";
import { LocationReferences } from "@/components/studio/LocationReferences";
import { FrameGenerator } from "@/components/studio/FrameGenerator";
import { VideoGenerator } from "@/components/studio/VideoGenerator";
import { ExportPanel } from "@/components/studio/ExportPanel";
import { Button } from "@/components/ui/Button";

export default function StudioPage() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const clearCurrentProject = useProjectStore((s) => s.clearCurrentProject);

  const status = currentProject?.status ?? "brief";
  const framedScenes = currentProject?.plan?.scenes.filter((s) => s.needsFrame) ?? [];
  const allFramesValidated =
    framedScenes.length > 0 && framedScenes.every((s) => s.frameStatus === "frame_validated");
  const stepIndex = getStepIndex(status, allFramesValidated);

  return (
    <div className="flex h-full">
      <StudioProgressBar currentStep={stepIndex} />
      <div className="flex-1 overflow-y-auto relative">
        {currentProject && status !== "brief" && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm("Repartir d'un nouveau projet ? Le projet en cours sera perdu s'il n'est pas sauvegardé.")) {
                  clearCurrentProject();
                }
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Nouveau projet
            </Button>
          </div>
        )}

        {status === "brief" && <BriefStep />}
        {status === "brief_chat" && <BriefCoConstruction />}

        {status === "analyzing" && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-ink-secondary">
            <RefreshCw className="w-6 h-6 animate-spin text-gold" />
            <p className="text-sm">Analyse du brief en cours...</p>
          </div>
        )}

        {status === "plan_ready" && <ScenePlanEditor />}
        {status === "characters" && <CharacterReferences />}
        {status === "locations" && <LocationReferences />}
        {status === "frames" && <FrameGenerator />}
        {status === "videos" && <VideoGenerator />}
        {(status === "export" || status === "completed") && <ExportPanel />}
      </div>
    </div>
  );
}
