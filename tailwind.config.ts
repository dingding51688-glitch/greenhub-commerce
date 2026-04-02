import type { Config } from "tailwindcss";

const palette = {
  night: {
    50: "#f5f7fb",
    100: "#e4e9f3",
    200: "#cacfec",
    300: "#a4b3df",
    400: "#7f96cc",
    500: "#5a75b0",
    600: "#3c558f",
    700: "#273c6a",
    800: "#172243",
    900: "#0b1426",
    950: "#05070c"
  },
  plum: {
    100: "#f3e8ff",
    300: "#d1b0ff",
    500: "#a56bff",
    600: "#7c3aed"
  },
  jade: {
    200: "#bce5d5",
    400: "#4fd9a9",
    500: "#24b485"
  },
  amber: {
    300: "#fbd38d",
    500: "#f6ad55"
  },
  ink: {
    400: "#aeb3d9",
    500: "#8c92bb",
    600: "#5c6287",
    800: "#2c314e"
  }
};

const spacing = {
  "2xs": "var(--gh-spacing-2xs)",
  xs: "var(--gh-spacing-xs)",
  sm: "var(--gh-spacing-sm)",
  md: "var(--gh-spacing-md)",
  lg: "var(--gh-spacing-lg)",
  xl: "var(--gh-spacing-xl)",
  "2xl": "var(--gh-spacing-2xl)"
};

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ...palette,
        surface: "#0b0f14",
        card: "#141925",
        accent: {
          DEFAULT: "#4fd9a9",
          subtle: "rgba(79, 217, 169, 0.2)"
        }
      },
      fontFamily: {
        sans: ["Space Grotesk", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Sora", "Space Grotesk", "Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "SFMono-Regular", "Menlo", "monospace"]
      },
      spacing,
      borderRadius: {
        sm: "var(--gh-radius-sm)",
        md: "var(--gh-radius-md)",
        lg: "var(--gh-radius-lg)"
      },
      boxShadow: {
        surface: "var(--gh-shadow-soft)",
        ring: "var(--gh-shadow-ring)"
      }
    }
  },
  plugins: []
};

export default config;
