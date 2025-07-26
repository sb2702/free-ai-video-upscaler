/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        'manrope': ['Manrope', 'sans-serif'],
      },
      colors: {
        'primary': '#1e3a8a',
        'text-primary': '#1e3a8a',
        'primary-blue': '#1e3a8a',
        'light-blue': '#bfdbfe',
        'gray-light': '#F5F5F5',
        'gray-border': '#c8c8d5',
        'gray-text': '#999',
      }
    },
  },
  plugins: [],
}