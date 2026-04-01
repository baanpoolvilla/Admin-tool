// =============================================================
// app/admin/dashboard/page.tsx — Admin Dashboard
// หน้าแรกของ admin แสดงภาพรวม:
// - จำนวนบ้านทั้งหมด
// - จำนวนวันว่าง (60 วัน)
// - สถานะ scraper ล่าสุด
// - ปุ่ม trigger scraper ด้วยตนเอง
// =============================================================

"use client";

import { useProperties } from "@/hooks/useProperties";
import { timeAgo } from "@/lib/utils";
import { useState } from "react";

export default function AdminDashboardPage() {
  const { properties, isLoading } = useProperties();
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);

  // --- คำนวณสถิติ ---
  const totalProperties = properties.length;
  const availableTodayProperties = properties.filter(
    (p) => p.is_active && p.is_available_today
  ).length;
  const activeProperties = properties.filter((p) => p.is_active).length;

  // --- Trigger Scraper ---
  const handleTriggerScrape = async () => {
    setTriggerStatus("กำลังส่งคำสั่ง...");
    try {
      const res = await fetch("/api/scrape/trigger", { method: "POST" });
      if (res.ok) {
        setTriggerStatus("ส่งคำสั่งสำเร็จ! Scraper กำลังทำงาน...");
      } else {
        const data = await res.json();
        setTriggerStatus(`เกิดข้อผิดพลาด: ${data.error}`);
      }
    } catch {
      setTriggerStatus("ไม่สามารถเชื่อมต่อได้");
    }
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">ภาพรวมระบบ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Properties */}
        <div className="bg-surface rounded-xl border border-white/5 p-6">
          <p className="text-text-secondary text-sm">บ้านพักทั้งหมด</p>
          <p className="text-3xl font-bold text-text-primary mt-2">
            {isLoading ? "..." : totalProperties}
          </p>
          <p className="text-text-secondary text-xs mt-1">
            Active: {activeProperties}
          </p>
        </div>

        {/* Available Today */}
        <div className="bg-surface rounded-xl border border-white/5 p-6">
          <p className="text-text-secondary text-sm">วันนี้ว่าง</p>
          <p className="text-3xl font-bold text-available mt-2">
            {isLoading ? "..." : availableTodayProperties}
          </p>
          <p className="text-text-secondary text-xs mt-1">หลัง</p>
        </div>

        {/* Zones */}
        <div className="bg-surface rounded-xl border border-white/5 p-6">
          <p className="text-text-secondary text-sm">โซน</p>
          <div className="mt-2 space-y-1">
            <p className="text-text-primary text-sm">
              บางแสน:{" "}
              {properties.filter((p) => p.zone === "bangsaen").length}
            </p>
            <p className="text-text-primary text-sm">
              พัทยา:{" "}
              {properties.filter((p) => p.zone === "pattaya").length}
            </p>
            <p className="text-text-primary text-sm">
              สัตหีบ:{" "}
              {properties.filter((p) => p.zone === "sattahip").length}
            </p>
            <p className="text-text-primary text-sm">
              ระยอง:{" "}
              {properties.filter((p) => p.zone === "rayong").length}
            </p>
          </div>
        </div>

        {/* Scraper Control */}
        <div className="bg-surface rounded-xl border border-white/5 p-6">
          <p className="text-text-secondary text-sm">Scraper</p>
          <button
            onClick={handleTriggerScrape}
            className="mt-3 w-full py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            🔄 รัน Scraper
          </button>
          {triggerStatus && (
            <p className="text-text-secondary text-xs mt-2">{triggerStatus}</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/admin/properties"
          className="bg-surface rounded-xl border border-white/5 p-6 hover:border-accent/30 transition-colors"
        >
          <h3 className="text-text-primary font-semibold">🏠 จัดการบ้านพัก</h3>
          <p className="text-text-secondary text-sm mt-1">
            เพิ่ม แก้ไข ลบ บ้านพัก
          </p>
        </a>

        <a
          href="/admin/calendar"
          className="bg-surface rounded-xl border border-white/5 p-6 hover:border-accent/30 transition-colors"
        >
          <h3 className="text-text-primary font-semibold">📅 จัดการปฏิทิน</h3>
          <p className="text-text-secondary text-sm mt-1">
            กำหนดวันว่าง/จอง ด้วยตนเอง
          </p>
        </a>

        <a
          href="/"
          className="bg-surface rounded-xl border border-white/5 p-6 hover:border-accent/30 transition-colors"
        >
          <h3 className="text-text-primary font-semibold">👁 ดูหน้า Public</h3>
          <p className="text-text-secondary text-sm mt-1">
            แผนที่ + ปฏิทิน สำหรับผู้ใช้ทั่วไป
          </p>
        </a>
      </div>
    </div>
  );
}
