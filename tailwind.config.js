/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      /*
       * Colors reference CSS variables from globals.css
       */
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-elevated': 'var(--bg-elevated)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-success': 'var(--accent-success)',
        'data-low': 'var(--data-low)',
        'data-mid': 'var(--data-mid)',
        'data-high': 'var(--data-high)',
        'border-subtle': 'var(--border-subtle)',
        'hover-bg': 'var(--hover-bg)',
        'active-bg': 'var(--active-bg)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
}

