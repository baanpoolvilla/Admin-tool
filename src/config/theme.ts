// =============================================================
// config/theme.ts — Design Tokens & Color Palette
// สี, spacing, และค่า design ต่างๆ ที่ใช้ใน JS/TS
// (สำหรับ Tailwind CSS → ดูที่ tailwind.config.ts)
// =============================================================

export const theme = {
  // --- สีสถานะบน Calendar ---
  calendar: {
    available: {
      bg: "bg-green-50",
      border: "border-green-400",
      text: "text-green-700",
      hover: "hover:bg-green-100",
    },
    booked: {
      bg: "bg-red-50",
      border: "border-red-400",
      text: "text-red-600",
      hover: "", // ไม่มี hover เพราะคลิกไม่ได้
    },
    blocked: {
      bg: "bg-gray-100",
      border: "border-gray-300",
      text: "text-gray-500",
      hover: "",
    },
    past: {
      bg: "opacity-40",
      border: "",
      text: "text-gray-400",
      hover: "",
    },
  },

  // --- สี Marker บนแผนที่ ---
  mapMarkers: {
    available: "#22C55E", // เขียว = มีวันว่าง
    booked: "#EF4444", // แดง = จองเต็ม
    selected: "#E8622A", // ส้ม = กำลังเลือกดู
  },
} as const;
