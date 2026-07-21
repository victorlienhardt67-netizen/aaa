"use client";

import { cn } from "@/lib/utils";

interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Toggle<T extends string>({ options, value, onChange, className }: ToggleProps<T>) {
  return (
    <div className={cn("inline-flex bg-surface2 border border-border rounded p-0.5", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-mono rounded transition-colors",
            value === opt.value
              ? "bg-gold text-background font-semibold"
              : "text-ink-secondary hover:text-ink"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
