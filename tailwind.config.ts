import type { Config } from 'tailwindcss';

/**
 * GroupStage theme — FIFA World Cup 26.
 *
 * The 2026 identity is bright and multi-coloured, so we move off the old gloomy
 * deep-green base onto a "stadium twilight" deep-blue, lit by the tournament's
 * vibrant accents (magenta + cyan) and trophy gold. The token *names* are kept
 * (`pitch`, `gold`, `offwhite`) so the entire existing className surface
 * re-skins instantly — only their values change here.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base scale — deep blue "stadium night" (was pitch green).
        pitch: {
          50: '#eef3fb',
          100: '#d9e2f4',
          200: '#b1c1e8',
          300: '#8198d6',
          400: '#5670b5',
          500: '#364d8a',
          600: '#26396f', // borders
          700: '#1a2c5c',
          800: '#122046', // base surface
          900: '#0b1430',
          950: '#070b1c', // page base
        },
        // Trophy gold — primary accent / CTAs.
        gold: {
          DEFAULT: '#f0b429',
          50: '#fdf6e3',
          100: '#f9e7b6',
          200: '#f2d281',
          300: '#ecc153',
          400: '#f0b429', // accent
          500: '#cf9415',
          600: '#a5740f',
          700: '#79540c',
          800: '#4f3708',
          900: '#2c1f05',
        },
        // FIFA 26 vibrant accents — used for energy, gradients, live states.
        magenta: {
          DEFAULT: '#ff2e88',
          200: '#ffb3d2',
          300: '#ff6aa9',
          400: '#ff2e88',
          500: '#e01f72',
          600: '#b31659',
        },
        cyan: {
          DEFAULT: '#19e3d6',
          200: '#a8f4ed',
          300: '#5ceadb',
          400: '#19e3d6',
          500: '#0bb9ae',
          600: '#0a8f88',
        },
        offwhite: {
          DEFAULT: '#f3f6fc',
          dim: '#c3cbe0',
          faint: '#8791ad',
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
        glow: '0 0 28px -4px rgba(240, 180, 41, 0.5)',
        'glow-sm': '0 0 14px -2px rgba(240, 180, 41, 0.4)',
        'glow-magenta': '0 0 28px -4px rgba(255, 46, 136, 0.5)',
        card: '0 18px 50px -22px rgba(0, 0, 0, 0.75)',
        // Liquid-glass: soft drop + an inner top highlight for the "wet" edge.
        glass: '0 8px 32px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
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
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 8s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
      backgroundImage: {
        shimmer:
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
        // FIFA 26 spectrum used for hero text + accent rules.
        'fifa-spectrum': 'linear-gradient(100deg, #ff2e88 0%, #f0b429 45%, #19e3d6 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
