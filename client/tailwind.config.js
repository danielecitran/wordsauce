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
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in-from-bottom': 'slideInFromBottom 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInFromBottom: {
          '0%': { 
            transform: 'translateY(16px)', 
            opacity: '0',
            scale: '0.95'
          },
          '100%': { 
            transform: 'translateY(0px)', 
            opacity: '1',
            scale: '1'
          },
        },
      },
    },
  },
  plugins: [],
}; 