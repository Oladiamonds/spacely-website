/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // SpaceLY Brand Colors
        primary: {
          50: '#fdf4f0',
          100: '#f9e4db',
          200: '#f3c9b6',
          300: '#e8a88f',
          400: '#d8804f',
          500: '#C4472B', // Brand Terracotta
          600: '#b03f25',
          700: '#933120',
          800: '#76281a',
          900: '#622315',
        },
        secondary: {
          50: '#faf9f7',
          100: '#f5edd6', // Brand Cream
          200: '#ede1cd',
          300: '#e5d5c4',
          400: '#ddc9bb',
          500: '#d5bdb2',
          600: '#c4a99f',
          700: '#b2958c',
          800: '#a08179',
        },
        accent: {
          50: '#f4f8f3',
          100: '#e8f1e7',
          200: '#cfe4cb',
          300: '#a1d699',
          400: '#6fbf5e',
          500: '#2D5016', // Brand Forest Green
          600: '#265012',
          700: '#1e400e',
          800: '#173009',
          900: '#0f1f05',
        },
        neutral: {
          50: '#faf8f4', // Pearl White
          100: '#f5f3f0',
          200: '#ebe7e1',
          300: '#d5cfc5',
          400: '#a9a09a',
          500: '#7d7470',
          600: '#5a5250',
          700: '#3e3a35',
          800: '#1a1a1a', // Charcoal
          900: '#0d0d0d',
        },
      },
      fontFamily: {
        display: ['Instrument Serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      spacing: {
        // 4px base grid
        0.5: '0.25rem',
        1: '0.5rem',
        1.5: '0.75rem',
        2: '1rem',
        3: '1.5rem',
        4: '2rem',
        5: '2.5rem',
        6: '3rem',
        8: '4rem',
        10: '5rem',
        12: '6rem',
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        base: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 1s infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
