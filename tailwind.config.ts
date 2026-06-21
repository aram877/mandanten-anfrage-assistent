import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        urgency: {
          high: '#dc2626',
          medium: '#d97706',
          low: '#16a34a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
