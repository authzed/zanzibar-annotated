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
  // The colors an annotation set can be highlighted in, whose classes are put
  // together when the page is rendered. Keep in step with HIGHLIGHT_COLORS in
  // util/annotationedit/sets.ts.
  safelist: [
    {
      pattern:
        /(bg|border|text)-(amber|sky|emerald|rose|violet|lime|orange|teal|fuchsia)-(100|200|300|400)/,
    },
  ],
};
