/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aligned with Figma SCM Template (Community file 1354682817335330954) & DESIGN.md
        scm: {
          sidebar: '#072c33',
          sidebarBorder: '#0b3d47',
          sidebarActive: '#00a896',
          canvas: '#f4f6f9',
          card: '#ffffff',
          border: '#e2e8f0',
          teal: '#00a896',
          tealHover: '#008c7d',
          navy: '#061a20',
        },
        canvas: {
          DEFAULT: '#f4f6f9',
          subtle: '#eef2f6',
          dark: '#0a1628',
        },
        surface: {
          1: '#ffffff',
          2: '#f8fafc',
          3: '#f1f5f9',
        },
        hairline: {
          DEFAULT: '#e2e8f0',
          strong: '#cbd5e1',
          accent: 'rgba(0, 168, 150, 0.3)',
        },
        ink: {
          DEFAULT: '#0f172a',
          secondary: '#334155',
          muted: '#64748b',
          subtle: '#94a3b8',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#00a896', // Figma SCM signature teal
          600: '#008c7d',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#072c33',
        },
        navy: {
          950: '#072c33',
          900: '#0a1628',
          850: '#0c182d',
          800: '#0f1d33',
          700: '#132742',
          600: '#1e3a5f',
        },
      },
      boxShadow: {
        card: '0 4px 12px -2px rgba(2, 6, 23, 0.4), 0 2px 6px -1px rgba(2, 6, 23, 0.2)',
        lift: '0 10px 25px -5px rgba(2, 6, 23, 0.6), 0 8px 10px -6px rgba(2, 6, 23, 0.5)',
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Bengali', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
