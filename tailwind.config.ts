import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#131313",
        surface2: "#1A1A1A",
        border: "#262622",
        // Accent unique de la marque (orange brûlé du logo) — remplace l'ancien
        // or ET l'ancien violet du Studio, pour que tout le site partage la
        // même identité visuelle au lieu de deux thèmes différents.
        gold: {
          DEFAULT: "#E2672E",
          light: "#F2946A",
          dark: "#A8421C",
        },
        ink: {
          DEFAULT: "#F5F5F0",
          secondary: "#8A8A82",
        },
        // Le Studio (Ad Production Agent) réutilise exactement les mêmes valeurs
        // que le thème principal ci-dessus (accent, fonds, texte) — namespace
        // conservé pour ne pas avoir à réécrire toutes les classes `agent-*`
        // déjà posées dans le code du Studio, mais visuellement c'est
        // désormais un seul et même système de couleurs.
        agent: {
          bg: "#0A0A0A",
          s1: "#131313",
          s2: "#1A1A1A",
          s3: "#212120",
          bd: "#262622",
          bd2: "#33332e",
          acc: "#E2672E",
          acc2: "#A8421C",
          accs: "rgba(226,103,46,0.12)",
          grn: "#22c55e",
          amb: "#F2C94C",
          t1: "#F5F5F0",
          t2: "#8A8A82",
          t3: "#5C5C56",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(226,103,46,0.25), 0 8px 24px rgba(226,103,46,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
