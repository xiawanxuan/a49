/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        cyan: {
          DEFAULT: '#00E5FF',
          50: '#E6FBFF',
          100: '#CCF7FF',
          200: '#99EEFF',
          300: '#66E6FF',
          400: '#33DDFF',
          500: '#00E5FF',
          600: '#00B8CC',
          700: '#008A99',
          800: '#005C66',
          900: '#002E33',
        },
        orange: {
          DEFAULT: '#FF8A3D',
          50: '#FFF4EC',
          100: '#FFE9D9',
          200: '#FFD4B3',
          300: '#FFBE8C',
          400: '#FFA966',
          500: '#FF8A3D',
          600: '#E06E1F',
          700: '#A85418',
          800: '#703910',
          900: '#381D08',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 24px rgba(0, 229, 255, 0.25)',
        'orange-glow': '0 0 24px rgba(255, 138, 61, 0.2)',
      },
      animation: {
        'spin-slow': 'spin 6s linear infinite',
      },
    },
  },
  plugins: [],
}
