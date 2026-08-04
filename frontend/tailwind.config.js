/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B2430",
        slate: {
          850: "#1E2733",
        },
        brand: {
          50: "#EFF6F5",
          100: "#D7E9E6",
          300: "#7FB8B0",
          500: "#2F7A6F",
          600: "#256359",
          700: "#1C4B44",
          900: "#0F2B27",
        },
        clay: "#C1673F",
        sand: "#F4F0E8",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
