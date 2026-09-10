/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        flame: {
          50: '#eef2ff',   // Softest Iris Tint
          100: '#e0e7ff',  // Light Iris Wash
          200: '#c7d2fe',  // Pastel Indigo Accent
          300: '#a5b4fc',  // Soft Violet
          400: '#818cf8',  // Vivid Iris
          500: '#6366f1',  // Bright Electric Indigo
          600: '#4f46e5',  // Primary Brand Electric Indigo (Eye-catching & Attractive)
          700: '#4338ca',  // Deep Royal Iris (Hover State)
          800: '#3730a3',  // Midnight Indigo
          900: '#312e81',  // Dark Obsidian Indigo
        },
        canteen: {
          surface: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          dark: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Epilogue', 'Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 10px 25px -5px rgba(79, 70, 229, 0.18), 0 8px 10px -6px rgba(79, 70, 229, 0.12)',
        'glow': '0 0 24px rgba(99, 102, 241, 0.35)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
      }

    },
  },
  plugins: [],
}

