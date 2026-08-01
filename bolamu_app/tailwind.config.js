/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Identité Bolamu — vert santé / confiance
        brand: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        ink: {
          DEFAULT: '#0F172A',
          soft: '#334155',
          muted: '#64748B',
          faint: '#94A3B8',
        },
        mist: '#F6F8F7',
      },
      fontFamily: {
        sans: ['System'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.10)',
        lift: '0 2px 4px rgba(15, 23, 42, 0.06), 0 16px 40px -12px rgba(21, 128, 61, 0.25)',
      },
    },
  },
  plugins: [],
};
