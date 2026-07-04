import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0D10",       // page background
        panel: "#14171C",      // card / panel background
        panel2: "#191D23",     // slightly raised panel
        line: "#232830",       // borders / hairlines
        line2: "#2C323C",
        fg: "#E6E8EB",         // primary text
        muted: "#8B92A0",      // secondary text
        faint: "#5B6270",      // tertiary text
        amber: "#E8A33D",      // soft bounce / warning
        red: "#E5646B",        // hard bounce / failure
        green: "#4FBF83",      // delivered / success
        blue: "#5B9BD8",       // opened / info
        violet: "#9B8CF2",     // clicked
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
