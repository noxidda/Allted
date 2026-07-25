/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        mono: {
          bg: '#000000',
          panel: '#111111',
          surface: '#1a1a1a',
          border: '#333333',
          hover: '#262626',
          muted: '#888888',
          text: '#ffffff',
          subtext: '#aaaaaa',
        }
      },
      fontFamily: {
        sans: ['"DM Sans Local"', 'sans-serif'],
        mono: ['"DM Sans Local"', 'monospace'],
      }
    },
  },
  plugins: [],
}
