"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full bg-surface2 border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-gold/60 transition-colors",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full bg-surface2 border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-gold/60 transition-colors resize-y",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block text-xs font-mono uppercase tracking-wide text-ink-secondary mb-1.5", className)}>
      {children}
    </label>
  );
}
