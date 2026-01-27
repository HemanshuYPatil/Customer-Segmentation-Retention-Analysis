import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["\"Bitcount Single\"", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        panelBorder: "rgb(var(--color-panel-border) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        accentSoft: "rgb(var(--color-accent-soft) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warn: "rgb(var(--color-warn) / <alpha-value>)"
      },
      boxShadow: {
        glow: "0 0 40px rgba(59, 163, 255, 0.15)"
      }
    }
  },
  plugins: []
};

export default config;
