// =============================================================
// types/property.ts — Property-related Types
// ใช้ในฝั่ง Frontend สำหรับแสดงผลข้อมูลบ้านพัก
// =============================================================

import type { Database } from "./database";

// --- Type หลักจาก DB ---
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
export type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

// --- Property พร้อมข้อมูลสรุป availability (ใช้ในหน้า list) ---
export type PropertyWithStats = Property & {
  available_days: number; // จำนวนวันว่างใน 60 วันข้างหน้า
  total_days: number; // จำนวนวันทั้งหมดที่มีข้อมูล
  avg_price: number | null; // ราคาเฉลี่ยต่อคืน
  is_available_today: boolean; // วันนี้ว่างหรือไม่
};

// --- แหล่งที่มาของ Property ---
export type PropertySource = "deville" | "poolvillacity" | "manual";

// --- โซนพื้นที่ ---
export type PropertyZone = "bangsaen" | "pattaya" | "sattahip" | "rayong";
