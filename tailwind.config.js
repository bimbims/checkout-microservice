/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        ibira: {
          beige: '#f4ece1',
          green: '#233133',
          border: '#e8dfd2',
          'border-dark': '#d8e2dc',
          'border-light': '#dde4e1',
        },
      },
    },
  },
  plugins: [],
}
