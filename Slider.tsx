"use client";

import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  valueLabel?: string;
}

export function Slider({ label, valueLabel, className, ...props }: SliderProps) {
  return (
    <div>
      {(label || valueLabel) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-xs font-mono uppercase tracking-wide text-ink-secondary">
              {label}
            </span>
          )}
          {valueLabel && (
            <span className="text-xs font-mono text-gold-light">{valueLabel}</span>
          )}
        </div>
      )}
      <input
        type="range"
        className={cn(
          "w-full h-1.5 rounded-full appearance-none bg-surface2 accent-gold cursor-pointer",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-gold",
          className
        )}
        {...props}
      />
    </div>
  );
}
