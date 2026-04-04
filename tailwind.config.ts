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
        background: "#FAFAF8",
        // พื้นผิว (surface) สำหรับ panels
        surface: "#F3F1EC",
        // พื้น card
        card: "#FFFFFF",
        // สีเน้น (ส้มอุ่น)
        accent: "#E8622A",
        // สีสถานะ
        available: "#22C55E",
        booked: "#EF4444",
        blocked: "#9CA3AF",
        // ข้อความ
        "text-primary": "#1F2937",
        "text-secondary": "#6B7280",
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
