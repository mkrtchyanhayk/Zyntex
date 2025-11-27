/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        deep: 'var(--bg-deep)',
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        aurora: 'var(--accent-primary)',
      }
    }
  },
  plugins: []
};

