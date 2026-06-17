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
          900: "#030712", // Very deep midnight blue/black
          800: "#0B1120", // Slightly lighter for cards
          700: "#111827", // Hover states
          border: "#1F2937", // Crisp dark borders
        },
        light: "#FFFFFF",
        gray: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          300: "#D1D5DB",
          500: "#6B7280",
          700: "#374151",
          900: "#111827",
        },
        gold: {
          DEFAULT: "#F5A623",
          light: "#FFD166",
          dark: "#D4891A",
          pale: "#FEF3DC",
        },
        // Redirection totale de "green" vers l'accent "indigo" du Dashboard
        green: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
          DEFAULT: "#6366F1",
          mid: "#4F46E5",
          pale: "#EEF2FF",
        },
        indigo: {
          DEFAULT: "#6366F1",
          dark: "#4F46E5",
          pale: "#EEF2FF",
        },
        neon: {
          gold: "#F59E0B",
          cyan: "#6366F1",
          magenta: "#8B5CF6",
          green: "#6366F1",
          purple: "#8B5CF6",
        },
        brand: {
          red: "#EF4444", // erreurs
          blue: "#6366F1",
          wa: "#25D366",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "Sora", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      backgroundImage: {
        "grad-hero":
          "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#0F0A2E 100%)",
        "grad-gold":
          "linear-gradient(135deg,#FA709A 0%,#FEE140 100%)",
        "grad-neon":
          "linear-gradient(135deg,#667EEA 0%,#764BA2 100%)", // indigo-violet (--g1)
        "grad-premium": "linear-gradient(135deg,#667EEA 0%,#4F46E5 100%)",
        "g1": "linear-gradient(135deg,#667EEA,#764BA2)",
        "g2": "linear-gradient(135deg,#F093FB,#F5576C)",
        "g3": "linear-gradient(135deg,#4FACFE,#00F2FE)",
        "g4": "linear-gradient(135deg,#43E97B,#38F9D7)",
        "g5": "linear-gradient(135deg,#FA709A,#FEE140)",
        "g6": "linear-gradient(135deg,#FF9A56,#FF6A88)",
        "g7": "linear-gradient(135deg,#A18CD1,#FBC2EB)",
        "g8": "linear-gradient(135deg,#0BA360,#3CBA92)",
      },
      boxShadow: {
        "glow-gold":
          "0 0 5px rgba(245,166,35,.5),0 0 20px rgba(245,166,35,.3),0 0 40px rgba(245,166,35,.12)",
        "glow-cyan":
          "0 0 5px rgba(0,168,89,.5),0 0 20px rgba(0,168,89,.25)",
        "glow-magenta": 
          "0 0 8px rgba(245,166,35,.5), 0 0 20px rgba(245,166,35,.3)",
        "glow-purple": 
          "0 0 8px rgba(0,168,89,.5), 0 0 20px rgba(0,168,89,.3)",
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
