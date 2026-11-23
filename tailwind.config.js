/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        noir: {
          bg: '#0B0D10',
          sidebar: '#101318',
          panel: '#15191F',
          elevated: '#1C2129',
          border: '#282E37',
          'border-light': '#363E4A',
          text: '#E8EBF0',
          muted: '#8993A1',
          dim: '#5A6372',
          amber: '#E5AC58',
          'amber-hover': '#F0B969',
          green: '#63D39B',
          warning: '#F0B44D',
          red: '#F06B6B',
          blue: '#72A9E8',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
