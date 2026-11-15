/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        play: {
          bg: '#141518',
          card: '#1c1e22',
          cardHover: '#24272d',
          border: '#2c3038',
          subtext: '#8e95a5',
          accentGreen: '#10b981',
          accentBlue: '#3b82f6',
          accentPurple: '#a855f7',
          accentYellow: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

