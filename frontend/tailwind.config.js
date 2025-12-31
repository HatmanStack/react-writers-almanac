/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': '#1c1924',          // Main background color
        'app-text': '#FFFFF6',         // Main text color
        'app-container': '#8293a2',    // Container/card background
        'border-glow-start': 'rgba(168, 239, 255, 1)',
        'border-glow-end': 'rgba(168, 239, 255, 0.1)',
      },
      fontFamily: {
        'serif': ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        'sans': ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      keyframes: {
        'border-rotate': {
          'to': {
            '--angle': '1turn',
          },
        },
        'particle-pulse': {
          '0%': {
            filter: 'blur(5px) contrast(10) saturate(0.8)',
          },
          '50%': {
            filter: 'blur(10px) contrast(20) saturate(0.8)',
          },
          '100%': {
            filter: 'blur(5px) contrast(10) saturate(0.8)',
          },
        },
      },
      animation: {
        'border-spin': 'border-rotate 2.5s linear infinite',
        'border-spin-reverse': 'border-rotate 2.5s linear infinite reverse',
        'particle-pulse': 'particle-pulse 2s infinite',
      },
    },
  },
  plugins: [],
}
