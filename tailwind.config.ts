import type { Config } from "tailwindcss";

// Scoped to the Ward Report route so Tailwind's reset/utilities never touch
// the rest of the (non-Tailwind) WardOS dashboard.
const config: Config = {
  content: [
    "./app/ward-report/**/*.{ts,tsx}",
    "./components/ward-report/**/*.{ts,tsx}",
    // Matches ward-report-data.ts and ward-report-design-tokens.ts. The tokens
    // file stores utility-class strings (e.g. the typography specimens), so it
    // must be scanned or those classes could be purged.
    "./lib/ward-report-*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef1f6",
          100: "#d7deea",
          200: "#aebdd4",
          300: "#8095b8",
          400: "#546f98",
          500: "#385174",
          600: "#293f5e",
          700: "#1d2e47",
          800: "#141f33",
          900: "#0b1626",
          950: "#070f1a",
        },
        cream: {
          50: "#fefdfb",
          100: "#faf6ea",
          200: "#f4ecd6",
          300: "#ece0c0",
          400: "#e2d1a3",
        },
        gold: {
          300: "#e8cd85",
          400: "#dcb95f",
          500: "#c9a227",
          600: "#a8841e",
          700: "#87681a",
        },
      },
      fontFamily: {
        serif: [
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(11, 22, 38, 0.25)",
        panel: "0 20px 45px -18px rgba(11, 22, 38, 0.45)",
      },
      maxWidth: {
        report: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;
