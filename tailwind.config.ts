import type { Config } from "tailwindcss";

/**
 * Tokens de design Annonce.ID (voir section 4 du brief).
 * Hybride : fond sombre néon (hero/admin) + fond clair (listings).
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0A0E14",
          800: "#111722",
          700: "#1A2231",
          border: "#243044",
        },
        light: "#FAFAF8",
        gray: {
          50: "#F4F4F2",
          100: "#E8E8E4",
          300: "#BEBEBB",
          500: "#7C7C78",
          700: "#3A3A37",
          900: "#141412",
        },
        gold: {
          DEFAULT: "#F5A623",
          light: "#FFD166",
          dark: "#D4891A",
          pale: "#FEF3DC",
        },
        green: {
          DEFAULT: "#1B4332",
          mid: "#2D6A4F",
          pale: "#D8F3DC",
        },
        neon: {
          gold: "#FFC93C",
          cyan: "#2DE2E6",
          magenta: "#FF2A6D",
          green: "#05FFA1",
        },
        brand: {
          red: "#E63946",
          blue: "#2563EB",
          wa: "#25D366",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "Sora", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      backgroundImage: {
        "grad-hero":
          "linear-gradient(135deg,#0A0E14 0%,#1A2231 50%,#1B4332 100%)",
        "grad-gold":
          "linear-gradient(135deg,#F5A623 0%,#FFD166 50%,#F5A623 100%)",
        "grad-neon":
          "linear-gradient(135deg,#FF2A6D 0%,#F5A623 50%,#2DE2E6 100%)",
        "grad-premium": "linear-gradient(135deg,#FFC93C 0%,#FF8C42 100%)",
      },
      boxShadow: {
        "glow-gold":
          "0 0 5px rgba(255,201,60,.5),0 0 20px rgba(255,201,60,.3),0 0 40px rgba(255,201,60,.12)",
        "glow-cyan":
          "0 0 5px rgba(45,226,230,.5),0 0 20px rgba(45,226,230,.25)",
        "glow-wa": "0 0 20px rgba(37,211,102,.5)",
        xs: "0 1px 3px rgba(0,0,0,.06)",
        sm: "0 2px 8px rgba(0,0,0,.08)",
        md: "0 6px 24px rgba(0,0,0,.12)",
        lg: "0 16px 48px rgba(0,0,0,.18)",
      },
      borderRadius: {
        DEFAULT: "10px",
        lg: "16px",
        xl: "24px",
      },
      keyframes: {
        neonPulse: {
          "0%,100%": {
            boxShadow:
              "0 0 8px #FFC93C,0 0 16px rgba(255,201,60,.4)",
          },
          "50%": {
            boxShadow:
              "0 0 16px #FFC93C,0 0 32px rgba(255,201,60,.65)",
          },
        },
        gradShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        floatBlob: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(30px,-20px) scale(1.1)" },
          "66%": { transform: "translate(-20px,20px) scale(.95)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        skeletonPulse: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        neonPulse: "neonPulse 2.5s ease infinite",
        gradShift: "gradShift 6s ease infinite",
        floatBlob: "floatBlob 14s ease infinite",
        fadeUp: "fadeUp .5s ease both",
        skeletonPulse: "skeletonPulse 1.5s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
