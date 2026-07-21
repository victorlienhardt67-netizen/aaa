"use client";
import { NARRATIVE_TAGS, type NarrativeTag } from "@/lib/types";

export function TagChip({ tag, size = "sm" }: { tag: NarrativeTag; size?: "sm" | "xs" }) {
  const t = NARRATIVE_TAGS.find((x) => x.key === tag) ?? NARRATIVE_TAGS[0];
  return (
    <span className="mono" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: size === "xs" ? 9 : 10, letterSpacing: ".08em", textTransform: "uppercase",
      fontWeight: 700, color: t.color,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.color }} />
      {t.label}
    </span>
  );
}
