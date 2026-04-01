// =============================================================
// tailwind.config.ts — Tailwind CSS Configuration
// - กำหนด custom colors ตาม Design System ของโปรเจค
// - เพิ่ม font family: Inter + Noto Sans Thai
// - กำหนด animation สำหรับ map markers
// =============================================================

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // === สี (Colors) — ตาม Design System ===
      colors: {
        // พื้นหลังหลัก
        background: "#0F1117",
        // พื้นผิว (surface) สำหรับ panels
        surface: "#1A1D26",
        // พื้น card
        card: "#22263A",
        // สีเน้น
        accent: "#4F9EFF",
        // สีสถานะ
        available: "#2ED573",
        booked: "#FF4757",
        blocked: "#8892A4",
        // ข้อความ
        "text-primary": "#FFFFFF",
        "text-secondary": "#8892A4",
      },

      // === ฟอนต์ (Fonts) ===
      fontFamily: {
        sans: ["Inter", "Noto Sans Thai", "sans-serif"],
        thai: ["Noto Sans Thai", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      // === Animation สำหรับ Map Marker ===
      keyframes: {
        pulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.2)", opacity: "0.7" },
        },
      },
      animation: {
        "marker-pulse": "pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
