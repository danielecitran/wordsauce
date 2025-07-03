module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        xl: '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        neumorph: '8px 8px 24px #e0e0e0, -8px -8px 24px #ffffff',
      },
      colors: {
        accent: '#6366f1',
        neutral: '#f5f6fa',
        dark: '#22223b',
      },
    },
  },
  plugins: [],
}; 