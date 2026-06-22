import type { Config } from 'tailwindcss';

/**
 * GroupStage theme — FIFA broadcast graphics meet a high-end sports
 * analytics dashboard. Deep pitch green base, warm gold accents, clean
 * off-white text. No purple, no neon, no AI-aesthetic gradients.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pitch: {
          50: '#e8f2ec',
          100: '#c5ded1',
          200: '#9cc5b1',
          300: '#6fa98e',
          400: '#46876a',
          500: '#2a6149',
          600: '#1a4733',
          700: '#103826',
          800: '#0a2e1f', // base
          900: '#072218',
          950: '#04150f',
        },
        gold: {
          DEFAULT: '#d4a437',
          50: '#fbf6e7',
          100: '#f5e7bf',
          200: '#ecd28a',
          300: '#e2bd58',
          400: '#d4a437', // accent
          500: '#b9882a',
          600: '#946a21',
          700: '#6f4f19',
          800: '#4b3511',
          900: '#2a1d09',
        },
        offwhite: {
          DEFAULT: '#f4f1e8',
          dim: '#cfcabb',
          faint: '#8f8c80',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Oswald', 'Inter', 'sans-serif'],
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums',
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(212, 164, 55, 0.45)',
        'glow-sm': '0 0 12px -2px rgba(212, 164, 55, 0.35)',
        card: '0 8px 32px -8px rgba(0, 0, 0, 0.6)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
      },
      backgroundImage: {
        shimmer:
          'linear-gradient(90deg, transparent 0%, rgba(244,241,232,0.06) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
