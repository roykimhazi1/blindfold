import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm sunset → dusk palette. Reads as "golden hour on holiday".
        brand: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
        sun: { 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b" },
        coral: { 400: "#fb7185", 500: "#f97362" },
        violet: { 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6" },
        indigo: { 400: "#818cf8", 500: "#6366f1" },
        mint: { 300: "#5eead4", 400: "#2dd4bf" },
        ink: {
          950: "#120d24",
          900: "#1a1430",
          800: "#231d44",
          700: "#322a5e",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        blob: {
          "0%,100%": { transform: "translate(0,0) scale(1)", borderRadius: "42% 58% 63% 37% / 41% 44% 56% 59%" },
          "33%": { transform: "translate(24px,-30px) scale(1.08)", borderRadius: "60% 40% 33% 67% / 55% 38% 62% 45%" },
          "66%": { transform: "translate(-22px,18px) scale(0.95)", borderRadius: "38% 62% 58% 42% / 63% 51% 49% 37%" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        gradientPan: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        spinSlow: { to: { transform: "rotate(360deg)" } },
        sheen: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        blob: "blob 18s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
        pop: "pop 0.4s cubic-bezier(0.22,1,0.36,1) both",
        "gradient-pan": "gradientPan 8s ease infinite",
        "spin-slow": "spinSlow 14s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
