import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "gold" | "neutral" | "success" | "danger";

const toneClasses: Record<Tone, string> = {
  gold: "bg-gold/10 text-gold-light border-gold/30",
  neutral: "bg-surface2 text-ink-secondary border-border",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-800/40",
  danger: "bg-red-500/10 text-red-400 border-red-900/40",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide border rounded px-1.5 py-0.5",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
