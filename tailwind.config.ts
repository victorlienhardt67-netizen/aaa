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
        surface: "#111111",
        surface2: "#161616",
        border: "#242420",
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8C96A",
          dark: "#8A7233",
        },
        ink: {
          DEFAULT: "#F5F5F0",
          secondary: "#888880",
        },
        // Design system violet — nouvelle expérience /studio (Ad Production Agent).
        // Namespace séparé du thème or existant (brands/styles/projects/templates/settings
        // gardent l'ancien thème pour l'instant).
        agent: {
          bg: "#0e0e10",
          s1: "#161618",
          s2: "#1e1e21",
          s3: "#26262a",
          bd: "#2e2e33",
          bd2: "#3a3a40",
          acc: "#a855f7",
          acc2: "#7c3aed",
          accs: "rgba(168,85,247,0.1)",
          grn: "#22c55e",
          amb: "#f59e0b",
          t1: "#f0eff0",
          t2: "#9b9a9e",
          t3: "#4e4e54",
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
        gold: "0 0 0 1px rgba(201,168,76,0.25), 0 8px 24px rgba(201,168,76,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
