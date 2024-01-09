/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      gridTemplateColumns: {
        header: '40px min-content 1fr min-content'
      },
      gridTemplateRows: {
        layout: '48px auto'
      },
      colors: {
        primary: 'var(--slate-12)',
        secondary: 'var(--slate-11)',
        tertiary: 'var(--slate-10)'
      },
      textColor: {
        primary: 'var(--slate-12)',
        secondary: 'var(--slate-11)',
        tertiary: 'var(--slate-10)'
      },
      backgroundColor: {
        primary: 'var(--slate-1)',
        secondary: 'var(--slate-2)',
        tertiary: 'var(--slate-3)'
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
  ],
}