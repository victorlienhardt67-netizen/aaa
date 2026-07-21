"use client";
import { useEffect, useState } from "react";
import { useStore } from "./store";

// Vrai une fois le store rehydraté depuis localStorage (évite les
// mismatches SSR/CSR : on rend un état stable avant hydratation).
export function useHydrated(): boolean {
  const [mounted, setMounted] = useState(false);
  const hasHydrated = useStore((s) => s.hasHydrated);
  useEffect(() => setMounted(true), []);
  return mounted && hasHydrated;
}
