/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce8ff",
          200: "#b9d1ff",
          300: "#8fb3ff",
          400: "#5f8bff",
          500: "#3b63f5",
          600: "#2a49d1",
          700: "#2038a8",
          800: "#1c2f85",
          900: "#1a2a6b",
        },
      },
    },
  },
  plugins: [],
};
