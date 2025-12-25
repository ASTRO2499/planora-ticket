/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#030014', // Deep cosmic dark
        primary: {
          DEFAULT: '#7000FF', // Electric Violet
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#00C2FF', // Cyan
          foreground: '#030014',
        },
        accent: {
          DEFAULT: '#FF0055', // Neon Pink
          foreground: '#ffffff',
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          hover: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'], // For headings
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cosmic-gradient': 'linear-gradient(to right, #7000FF, #00C2FF)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1, filter: 'brightness(1.2)' },
          '50%': { opacity: .7, filter: 'brightness(0.8)' },
        }
      }
    }
  },
  plugins: [],
}
