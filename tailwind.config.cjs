/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["Fira Code", "Consolas", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      colors: {
        far: {
          50: "#e6fff3",
          100: "#bfffdc",
          200: "#8dffc2",
          300: "#5bffa8",
          400: "#2aff8e",
          500: "#00e274",
          600: "#00b85d",
          700: "#008f46",
          800: "#006630",
          900: "#003d1a"
        }
      },
      boxShadow: {
        far: "0 0 0 1px #00e274, 0 0 14px rgba(0, 226, 116, 0.35)"
      }
    }
  },
  plugins: []
};
