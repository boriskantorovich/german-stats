/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0f1419',
        'bg-secondary': '#1a2028',
        'bg-elevated': '#252d38',
        'text-primary': '#e6edf3',
        'text-secondary': '#8b949e',
        'accent-primary': '#58a6ff',
        'accent-secondary': '#f78166',
        'accent-success': '#56d364',
        'data-low': '#0d419d',
        'data-mid': '#3b82f6',
        'data-high': '#93c5fd',
      },
      fontFamily: {
        display: ['Instrument Sans', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '12px',
        'lg': '16px',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
    },
  },
  plugins: [],
}

