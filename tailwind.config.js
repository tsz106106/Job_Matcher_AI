/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}"],
  theme: {
    extend: {
      colors: {
        // iOS System Colors
        primary: '#007AFF', // System Blue
        'primary-hover': '#0062CC',
        success: '#34C759', // System Green
        warning: '#FF9500', // System Orange
        danger: '#FF3B30', // System Red
        background: '#F2F2F7', // System Grouped Background
        surface: '#FFFFFF', // Secondary System Grouped Background
        divider: '#C6C6C8', // Separator
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'ios': '20px',
      }
    },
  },
  plugins: [],
}

