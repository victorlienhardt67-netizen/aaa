"use client";

import { CAMERA_MOVEMENT_LABELS, CameraMovement } from "@/types";
import { cn } from "@/lib/utils";

export function CameraPresetPicker({
  onPick,
  className,
}: {
  onPick: (label: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {(Object.keys(CAMERA_MOVEMENT_LABELS) as CameraMovement[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onPick(CAMERA_MOVEMENT_LABELS[key])}
          className="text-[10px] font-mono px-2 py-1 rounded border border-border text-ink-secondary hover:border-gold/50 hover:text-gold-light transition-colors"
        >
          {CAMERA_MOVEMENT_LABELS[key]}
        </button>
      ))}
    </div>
  );
}
