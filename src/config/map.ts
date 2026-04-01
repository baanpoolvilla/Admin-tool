// =============================================================
// config/map.ts — Map Configuration
// ค่า default สำหรับ Leaflet Map (จุดกลาง, zoom, tile layer)
// =============================================================

export const mapConfig = {
  // --- จุดกลางเริ่มต้น (พัทยา) ---
  defaultCenter: {
    lat: 12.9236,
    lng: 100.8825,
  },

  // --- ระดับ Zoom เริ่มต้น ---
  defaultZoom: 12,

  // --- ระดับ Zoom เมื่อเลือกบ้าน ---
  selectedZoom: 15,

  // --- Tile Layer (OpenStreetMap — ฟรี ไม่ต้อง API Key) ---
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileAttribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

  // --- ขนาด Marker ---
  markerSize: {
    default: 10,
    selected: 14,
  },
} as const;
