"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";

/** Charge une fois les réglages (clés API, prompts avancés) du compte connecté depuis Supabase. */
export function SettingsSync() {
  const hydrateFromRemote = useSettingsStore((s) => s.hydrateFromRemote);

  useEffect(() => {
    hydrateFromRemote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
