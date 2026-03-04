/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        void: '#000000',
        void01: '#0A0A0A',
        void02: '#111111',
        glass04: 'rgba(255,255,255,0.04)',
        glass07: 'rgba(255,255,255,0.07)',
        glass10: 'rgba(255,255,255,0.10)',
        glass15: 'rgba(255,255,255,0.15)',
        rim: 'rgba(255,255,255,0.18)',
        warm500: '#D97B3C',
        warm600: '#C4602A',
        warm300: '#F5C49A',
        kosh500: '#1D2B53',
        kosh400: '#4A63B0',
        tealGlow: '#00E5CC',
        danger: '#FF4757',
        success: '#2ED573',
        textPrimary: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.72)',
        textTertiary: 'rgba(255,255,255,0.45)',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '44px',
      },
      borderRadius: {
        chip: '12px',
        card: '24px',
        pill: '9999px',
      }
    },
  },
  plugins: [],
};
