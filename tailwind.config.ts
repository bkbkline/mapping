import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "bg-primary": "#0A0E1A",
        "bg-secondary": "#111827",
        "bg-panel": "#1F2937",
        "border-default": "#374151",
        "text-primary": "#F9FAFB",
        "text-muted": "#9CA3AF",
        accent: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
        },
        success: "#10B981",
        danger: "#EF4444",
        warning: "#FBBF24",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};
export default config;
