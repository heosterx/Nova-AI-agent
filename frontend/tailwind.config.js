/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0F0F14',
          secondary: '#17171F',
          tertiary: '#1E1E2A',
        },
        border: '#2A2A3A',
        text: {
          primary: '#E8E8F0',
          secondary: '#8888A0',
        },
        accent: {
          primary: '#7C3AED',
          glow: '#9F67FF',
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
          cyan: '#06B6D4',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
