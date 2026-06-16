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
        green: {
          DEFAULT: "#00A859", // Vert dynamique
          mid: "#007F43",
          pale: "#E6F6ED",
        },
        neon: {
          gold: "#F5A623", 
          cyan: "#00A859", 
          magenta: "#F5A623", 
          green: "#00A859",
          purple: "#00A859",
        },
        brand: {
          red: "#E63946", // Keep for errors
          blue: "#00A859", 
          wa: "#25D366",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "Sora", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      backgroundImage: {
        "grad-hero":
          "linear-gradient(135deg,#0A0E14 0%,#111722 50%,#000000 100%)",
        "grad-gold":
          "linear-gradient(135deg,#F5A623 0%,#FFD166 50%,#F5A623 100%)",
        "grad-neon":
          "linear-gradient(135deg,#00A859 0%,#F5A623 100%)", // 2 colors only
        "grad-premium": "linear-gradient(135deg,#F5A623 0%,#D4891A 100%)",
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
