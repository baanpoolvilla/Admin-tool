// =============================================================
// config/theme.ts — Design Tokens & Color Palette
// สี, spacing, และค่า design ต่างๆ ที่ใช้ใน JS/TS
// (สำหรับ Tailwind CSS → ดูที่ tailwind.config.ts)
// =============================================================

export const theme = {
  // --- สีสถานะบน Calendar ---
  calendar: {
    available: {
      bg: "bg-green-500/20",
      border: "border-green-500",
      text: "text-green-400",
      hover: "hover:bg-green-500/40",
    },
    booked: {
      bg: "bg-red-500/20",
      border: "border-red-500",
      text: "text-red-400",
      hover: "", // ไม่มี hover เพราะคลิกไม่ได้
    },
    blocked: {
      bg: "bg-gray-500/20",
      border: "border-gray-500",
      text: "text-gray-400",
      hover: "",
    },
    past: {
      bg: "opacity-30",
      border: "",
      text: "text-gray-600",
      hover: "",
    },
  },

  // --- สี Marker บนแผนที่ ---
  mapMarkers: {
    available: "#2ED573", // เขียว = มีวันว่าง
    booked: "#FF4757", // แดง = จองเต็ม
    selected: "#4F9EFF", // ฟ้า = กำลังเลือกดู
  },
} as const;
