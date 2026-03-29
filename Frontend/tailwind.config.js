/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['"Plus Jakarta Sans"', 'sans-serif'],
        'body': ['"Inter"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        'bg-void': '#020817',
        'bg-deep': '#060F24',
        'accent': '#4F8EF7',
        'accent-bright': '#6BA3FF',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      backdropBlur: {
        'xs': '2px',
      },
      transitionDuration: {
        '350': '350ms',
      },
    },
  },
  plugins: [],
};
