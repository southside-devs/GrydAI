/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '320px',          // 📱 Small mobile (320px - 374px)
      'mobile': '375px',      // 📱 Mobile (375px - 639px)
      'sm': '640px',          // 📱 Large mobile / small tablet (640px - 767px)
      'md': '768px',          // 📱 Tablet (768px - 1023px)
      'lg': '1024px',         // 💻 Small laptop (1024px - 1279px)
      'xl': '1280px',         // 💻 Desktop (1280px - 1535px)
      '2xl': '1536px',        // 🖥️ Large desktop (1536px+)
    },
    extend: {
      colors: {
        border: "rgba(255, 255, 255, 0.08)",
      },
    },
  },
  plugins: [],
}
