/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/ui/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      width: {
        '70': '17.5rem', // 280px for LeftNav
        '95': '23.75rem', // 380px for RightDrawer
      },
      margin: {
        '70': '17.5rem', // 280px for LeftNav margin
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};


