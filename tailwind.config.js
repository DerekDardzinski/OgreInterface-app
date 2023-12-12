/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pagebg': '#e5e5e5',
        'cardbg': '#fafafa',
        'cardhead': '#dbe7e4',
        'cardfoot': '#dbe7e4',
        'cardbutton': '#B6CEC8',
        'cardbuttonhover': '#9DBEB6',
        'cardbuttonfocus': '#78A59A',
        'cardoutline': '#525252',
        'button': '#74ABD2',
        'buttonhover': '#5698C8',
      }
    },
  },
  plugins: [
    require("daisyui"), 
    require("@tailwindcss/typography"), 
    require('tailwind-scrollbar')({ nocompatible: true }),
    require('tailwindcss-patterns'),
  ],
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
    ],
  }
}
