import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1e3a5f", light: "#2d5385", fg: "#ffffff" },
        accent: { DEFAULT: "#0e7490", fg: "#ffffff" },
      },
    },
  },
  plugins: [],
};

export default config;
