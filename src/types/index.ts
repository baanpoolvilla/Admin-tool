// =============================================================
// types/index.ts — Barrel Export สำหรับ Types ทั้งหมด
// import ได้จาก "@/types" แทนการระบุไฟล์ย่อย
// =============================================================

export type { Database } from "./database";
export type {
  Property,
  PropertyInsert,
  PropertyUpdate,
  PropertyWithStats,
  PropertySource,
  PropertyZone,
} from "./property";
export type {
  Availability,
  AvailabilityInsert,
  AvailabilityUpdate,
  AvailabilityStatus,
  CalendarDay,
  AvailabilitySummary,
} from "./availability";

// --- User Profile ---
export type UserProfile = {
  id: string;
  email: string | null;
  role: "admin" | "partner";
  display_name: string | null;
  created_at: string;
};
