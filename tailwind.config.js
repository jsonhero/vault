const { nextui } = require("@nextui-org/react");


/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
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
        backgroundBorder: 'var(--background-border)',
      },
      textColor: {
        normal: 'var(--text-normal)',
        muted: 'var(--text-muted)',
        accent: 'var(--text-accent)',
      },
      backgroundColor: {
        primary: 'var(--background-primary)',
        secondary: 'var(--background-secondary)',
        interactiveHover: 'var(--interactive-hover)'
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
    nextui()
  ],
}