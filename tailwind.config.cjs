const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Barlow",
          ...defaultTheme.fontFamily.sans,
        ],
        mono: [
          "Fira Code",
          ...defaultTheme.fontFamily.mono,
        ]
      },
      colors: {
        "ow2": {
          "light-orange": "hsl(26, 100%, 55%)",
          "orange": "hsl(22, 100%, 38%)",
          "logo-orange": "#ed6516",
        }
      }
    },
  },
  plugins: [],
}
