/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      serif: ['Times New Roman', 'serif'],
      sans: ['ui-sans-serif', 'system-ui'],
    },
    extend: {},
  },
  plugins: [],
};
