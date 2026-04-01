// =============================================================
// config/site.ts — Site Metadata & Navigation
// ข้อมูลทั่วไปของเว็บไซต์ และรายการเมนู
// =============================================================

export const siteConfig = {
  // --- ชื่อและคำอธิบายของเว็บ ---
  name: "Villa Dashboard",
  description: "ระบบแสดงข้อมูลบ้านพัก ปฏิทินว่าง และราคา สำหรับ Admin",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // --- เมนู Admin ---
  adminNav: [
    { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
    { label: "Properties", href: "/admin/properties", icon: "Building" },
    { label: "Calendar", href: "/admin/calendar", icon: "Calendar" },
  ],

  // --- เมนู Public ---
  publicNav: [
    { label: "หน้าหลัก", href: "/" },
  ],
} as const;
