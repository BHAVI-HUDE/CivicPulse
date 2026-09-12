/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15213b",
        paper: "#f5f7fb",
        brand: "#3855e8",
        navy: "#121b33",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Manrope", "sans-serif"],
      },
      boxShadow: { card: "0 10px 30px rgba(32,47,82,.08)" },
    },
  },
  plugins: [],
};
