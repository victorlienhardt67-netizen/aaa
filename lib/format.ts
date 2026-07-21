// Helpers de formatage & utilitaires
import { COST_RATES } from "./seed";

export function uid(prefix = "id"): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rnd}`;
}

export function creditsToUsd(credits: number, provider = "kie"): number {
  const rate = COST_RATES.find((r) => r.provider === provider)?.usdPerCredit ?? 0.005;
  return credits * rate;
}

export function fmtUsd(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export function fmtCredits(credits: number): string {
  return `${credits.toLocaleString("fr-FR")} cr`;
}

export function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
}
