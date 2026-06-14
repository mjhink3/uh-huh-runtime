import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        warning: "hsl(var(--warning))",
        success: "hsl(var(--success))",
        danger: "hsl(var(--danger))",
      },
      boxShadow: {
        glow: "0 24px 90px rgba(0, 0, 0, 0.22)",
        brand: "0 18px 70px rgba(0, 0, 0, 0.38)",
        question: "0 22px 80px rgba(245, 158, 11, 0.11)",
      },
      backgroundImage: {
        question:
          "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(19, 20, 23, 0.92) 44%, rgba(255, 255, 255, 0.025))",
        "dashed-gap":
          "linear-gradient(90deg, rgba(245, 158, 11, 0.75) 0 45%, transparent 45% 62%, rgba(245, 158, 11, 0.75) 62% 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
