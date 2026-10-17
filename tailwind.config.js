/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          dark: '#020617', // slate-950
          card: '#0f172a', // slate-900
          border: '#1e293b', // slate-800
        }
      }
    },
  },
  plugins: [],
}

