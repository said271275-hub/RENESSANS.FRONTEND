/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neu: {
          base: 'var(--bg-color)',
          text: 'var(--text-primary)',
          muted: 'var(--text-muted)',
          accent: 'var(--accent)',
          light: '#E0E5EC',
          dark: '#1E2229',
          'light-text': '#334155',
          'dark-text': '#E2E8F0',
        },
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        }
      },
      borderRadius: {
        'neu': '20px',
        'neu-sm': '14px',
        'neu-lg': '24px',
        'neu-full': '9999px',
      },
      boxShadow: {
        'neu-raised': 'var(--shadow-raised)',
        'neu-raised-sm': 'var(--shadow-raised-sm)',
        'neu-raised-lg': 'var(--shadow-raised-lg)',
        'neu-inset': 'var(--shadow-inset)',
        'neu-inset-sm': 'var(--shadow-inset-sm)',
      }
    },
  },
  plugins: [],
}
