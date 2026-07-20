import { ProjectStatus } from "@/types";

/**
 * Pills de progression de la nouvelle expérience Ad Production Agent.
 * Réordonnées par rapport au libellé d'origine (Brief·Style·Perso·Découpage·Frames·Vidéo)
 * pour refléter l'ordre réel du pipeline de ce SaaS : le style est verrouillé avant le
 * script (Étape 0 existante), et le découpage (plan de production) est validé avant les
 * personnages — inverser l'affichage sans changer la mécanique aurait été trompeur.
 */
export const AGENT_STEPS = ["Brief", "Style", "Découpage", "Personnages", "Décors", "Frames", "Vidéo"] as const;

export function agentStepIndex(status: ProjectStatus, allFramesValidated: boolean): number {
  switch (status) {
    case "brief":
      return 0;
    case "brief_chat":
      return 1;
    case "analyzing":
    case "plan_ready":
      return 2;
    case "characters":
      return 3;
    case "locations":
      return 4;
    case "frames":
      return allFramesValidated ? 6 : 5;
    case "videos":
      return 6;
    case "export":
    case "completed":
      return 7;
    default:
      return 0;
  }
}
