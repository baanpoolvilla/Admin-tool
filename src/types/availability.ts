// =============================================================
// types/availability.ts — Availability-related Types
// ใช้ในฝั่ง Frontend สำหรับแสดงผลปฏิทิน
// =============================================================

import type { Database } from "./database";

// --- Type หลักจาก DB ---
export type Availability = Database["public"]["Tables"]["availability"]["Row"];
export type AvailabilityInsert = Database["public"]["Tables"]["availability"]["Insert"];
export type AvailabilityUpdate = Database["public"]["Tables"]["availability"]["Update"];

// --- สถานะวัน ---
export type AvailabilityStatus = "available" | "booked" | "blocked";

// --- ข้อมูลสรุปสำหรับ Calendar ---
export type CalendarDay = {
  date: string; // YYYY-MM-DD
  status: AvailabilityStatus;
  price: number | null;
  source: "scraper" | "manual";
  isPast: boolean; // วันที่ผ่านไปแล้วหรือไม่
};

// --- สรุปภาพรวม ---
export type AvailabilitySummary = {
  available_days: number;
  booked_days: number;
  blocked_days: number;
  avg_price: number | null;
  last_scraped_at: string | null;
};
