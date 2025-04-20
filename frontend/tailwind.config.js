/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "bg-gradient-radial": (value) => ({
            "background-image": `radial-gradient(${value},var(--tw-gradient-stops))`,
          }),
        },
        { values: theme("gradientColorStops") }
      );
    }),
  ],
} 