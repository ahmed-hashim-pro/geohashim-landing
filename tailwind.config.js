/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0b0d12',
          soft: '#1a1d24',
        },
        accent: {
          DEFAULT: '#6366f1',
          fade: '#a5b4fc',
        },
      },
      maxWidth: {
        prose: '68ch',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out both',
        'pulse-slow': 'pulseSlow 8s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.6', transform: 'translateX(-50%) scale(1)' },
          '50%': { opacity: '0.9', transform: 'translateX(-50%) scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
