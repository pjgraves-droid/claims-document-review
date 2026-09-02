import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "Verdana", "system-ui", "sans-serif"],
      },
      colors: {
        // QBE palette (sampled from qbe.com/au)
        qbe: {
          navy: "#00205B",
          blue: "#0076BC",
          "blue-dark": "#005F99",
          orange: "#F9760A",
          ink: "#191919",
          body: "#27272A",
          grey: { 50: "#F7F8F9", 100: "#F1F2F4", 200: "#E1E4E8", 400: "#A7AEBB" },
        },
        brand: { DEFAULT: "#00205B", light: "#0076BC", fg: "#ffffff" },
        accent: { DEFAULT: "#0076BC", fg: "#ffffff" },
      },
      borderRadius: {
        pill: "50px",
      },
    },
  },
  plugins: [],
};

export default config;
