/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "deep-charcoal": "var(--deep-charcoal)",
        "energizing-orange": "var(--energizing-orange)",
      },
    },
  },
  plugins: [],
};
