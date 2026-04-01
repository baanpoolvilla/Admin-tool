// =============================================================
// lib/utils.ts — Utility Functions
// ฟังก์ชันช่วยเหลือทั่วไปที่ใช้ซ้ำได้ทั้งโปรเจค
// =============================================================

/**
 * จัดรูปแบบราคาเป็นสกุลเงินบาท
 * formatPrice(2500) → "฿2,500"
 */
export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "—";
  return `฿${price.toLocaleString("th-TH")}`;
}

/**
 * จัดรูปแบบวันที่เป็นภาษาไทย
 * formatDateThai("2025-03-28") → "28 มี.ค. 2568"
 */
export function formatDateThai(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * สร้าง slug จากชื่อ
 * generateSlug("Pool Villa Pattaya") → "pool-villa-pattaya"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * สร้าง array ของวันที่ระหว่าง from ถึง to
 * getDateRange("2025-03-01", "2025-03-03") → ["2025-03-01", "2025-03-02", "2025-03-03"]
 */
export function getDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * วันที่วันนี้ในรูปแบบ YYYY-MM-DD
 */
export function today(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * วันที่ X วันข้างหน้าในรูปแบบ YYYY-MM-DD
 */
export function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * รวม CSS class names (กรอง falsy values ออก)
 * cn("foo", false && "bar", "baz") → "foo baz"
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * แสดงเวลาที่ผ่านไปจาก timestamp
 * timeAgo("2025-03-28T10:00:00Z") → "2 ชั่วโมงที่แล้ว"
 */
export function timeAgo(dateStr: string): string {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "เมื่อสักครู่";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} วันที่แล้ว`;

  return formatDateThai(dateStr);
}
