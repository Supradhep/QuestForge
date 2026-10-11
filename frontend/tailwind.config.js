/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: '#151C2C',
        surfaceHover: '#1E293B',
        primary: '#F59E0B',
        primaryHover: '#D97706',
        text: '#F3F4F6',
        textMuted: '#9CA3AF',
        accent: '#3B82F6',
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
}
