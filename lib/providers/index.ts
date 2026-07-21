// Point d'entrée providers. Bascule mock ↔ réel ici.
// Quand les adaptateurs réels seront prêts, ce registry choisira
// l'implémentation selon les clés API configurées.
import { mockProviders } from "./mock";
import type { Providers } from "./types";

// TODO(réel): brancher les adaptateurs KIE / HeyGen / TTS ici
// en fonction des clés présentes dans le store settings.
export function getProviders(): Providers {
  return mockProviders;
}

export * from "./types";
