/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      serif: ['Times New Roman', 'Linux Libertine', 'serif'],
      sans: ['ui-sans-serif', 'system-ui'],
    },
    extend: {},
  },
  plugins: [require('@tailwindcss/line-clamp')],
  safelist: [
    {
      pattern: /(bg|border|text)-(amber|sky|violet)-(100|200|300|400)/,
    },
  ],
};
