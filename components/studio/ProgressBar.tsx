"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const PIPELINE_STEPS = ["Brief", "Analyse", "Frames", "Validation", "Vidéos", "Export"] as const;

export function StudioProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-[72px] shrink-0 flex flex-col items-center py-8 border-r border-border bg-surface">
      <div className="relative flex-1 flex flex-col items-center justify-between">
        <div className="absolute top-2 bottom-2 w-px bg-border left-1/2 -translate-x-1/2" />
        <div
          className="absolute top-2 w-px bg-gold left-1/2 -translate-x-1/2 transition-all duration-500"
          style={{
            height: `calc((100% - 16px) * ${currentStep / (PIPELINE_STEPS.length - 1)})`,
          }}
        />
        {PIPELINE_STEPS.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-2 group">
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors",
                  done && "bg-gold border-gold",
                  active && "border-gold bg-background animate-gold-pulse",
                  !done && !active && "border-border bg-background"
                )}
              >
                {done && <Check className="w-2.5 h-2.5 text-background" />}
              </div>
              <span
                className={cn(
                  "text-[9px] font-mono uppercase tracking-wide writing-mode-vertical rotate-180 whitespace-nowrap",
                  active ? "text-gold-light" : done ? "text-ink-secondary" : "text-ink-secondary/50"
                )}
                style={{ writingMode: "vertical-rl" }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function getStepIndex(status: string, allFramesValidated: boolean): number {
  switch (status) {
    case "brief":
    case "brief_chat":
      return 0;
    case "analyzing":
    case "plan_ready":
      return 1;
    case "characters":
    case "locations":
    case "frames":
      return allFramesValidated ? 3 : 2;
    case "videos":
      return 4;
    case "export":
    case "completed":
      return 5;
    default:
      return 0;
  }
}
