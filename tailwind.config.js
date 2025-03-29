// tailwind.config.js
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          'weather-dark': '#0f172a',
          'weather-card': '#1e293b',
          'weather-highlight': '#3b82f6',
        },
        boxShadow: {
          'card': '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
        animation: {
          'fade-in': 'fadeIn 0.6s ease-in-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
        },
      },
    },
    plugins: [],
  }