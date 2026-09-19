/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        registry: {
          dark: '#0f172a',
          primary: '#1e3a8a',
          accent: '#059669',
          gold: '#d97706',
          slate: '#334155',
          light: '#f8fafc',
        }
      }
    },
  },
  plugins: [],
}
