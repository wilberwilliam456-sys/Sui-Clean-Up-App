// tailwind.config.js  ← ESM syntax (required when "type": "module" is set)

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',   // covers all React files
  ],
  theme: {
    extend: {
      colors: {
        'sui-blue': '#00A3FF',           // Official Sui brand blue
        'sui-light': '#66C5FF',
        'sui-dark': '#0088CC',
        'glass-bg': 'rgba(255, 255, 255, 0.08)',
        'glass-border': 'rgba(255, 255, 255, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};