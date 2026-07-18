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
