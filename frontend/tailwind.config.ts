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
        background: "#0B0F14",
        panel: "#121823",
        panelBorder: "#1C2533",
        text: "#E6EDF6",
        muted: "#9FB0C7",
        accent: "#3BA3FF",
        accentSoft: "#183A5B",
        danger: "#FF5C5C",
        success: "#4ADE80",
        warn: "#F59E0B"
      },
      boxShadow: {
        glow: "0 0 40px rgba(59, 163, 255, 0.15)"
      }
    }
  },
  plugins: []
};

export default config;
