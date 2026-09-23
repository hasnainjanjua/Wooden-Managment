/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          50: '#fdf8f4',
          100: '#f9eee4',
          200: '#f2dcbf',
          300: '#e7c394',
          400: '#d7a164',
          500: '#ca823b',
          600: '#bc692f',
          700: '#9c5028',
          800: '#7f4127',
          900: '#673623',
          950: '#381a10',
        },
      },
      fontFamily: {
        urdu: ['"Noto Nastaliq Urdu"', '"Urdu Typesetting"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
