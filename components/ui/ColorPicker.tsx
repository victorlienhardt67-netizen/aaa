"use client";

import { Label } from "./Input";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2 bg-surface2 border border-border rounded px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer bg-transparent border-none"
        />
        <span className="text-xs font-mono text-ink-secondary">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}
