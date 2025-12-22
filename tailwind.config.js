/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // TheWCAG.com brand colors
        primary: {
          DEFAULT: '#D97706',
          50: '#FEF3C7',
          100: '#FDE68A',
          200: '#FCD34D',
          300: '#FBBF24',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          800: '#78350F',
          900: '#451A03',
        },
        secondary: {
          DEFAULT: '#DA7756',
          50: '#FDF2EF',
          100: '#FCE7E1',
          200: '#F8C9BC',
          300: '#F4AB97',
          400: '#EF8D71',
          500: '#DA7756',
          600: '#C45A3A',
          700: '#9E4329',
          800: '#78331F',
          900: '#522315',
        },
        cream: '#FFFDF9',
        dark: '#1F1F1E',
        beige: '#F5F0E6',
        border: '#E5DDD0',
        'warm-brown': '#6B5B4F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
    },
  },
  plugins: [],
}

