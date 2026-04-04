// =============================================================
// app/admin/calendar/page.tsx — Manual Calendar Management
// จัดการปฏิทินด้วยตนเอง:
// - เลือก property → แสดงปฏิทิน 2 เดือน
// - คลิกวันเพื่อเลือก (highlight) → กดปุ่มสถานะด้านขวาเพื่อเปลี่ยน
// - ตั้งราคาสำหรับวันที่เลือก
// =============================================================

"use client";

import { useState, useMemo, useCallback } from "react";
import { useProperties } from "@/hooks/useProperties";
import { useAvailability } from "@/hooks/useAvailability";
import { cn, formatPrice } from "@/lib/utils";
import { calendarConfig } from "@/config/calendar";
import { theme } from "@/config/theme";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { AvailabilityStatus } from "@/types";

export default function AdminCalendarPage() {
  const { properties, isLoading: propsLoading } = useProperties();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const { availability, isLoading: availLoading, mutate } = useAvailability(selectedPropertyId);
  const [mobileMonthIndex, setMobileMonthIndex] = useState(0);

  // วันที่ถูกเลือก (สำหรับ action)
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [bulkPrice, setBulkPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // --- dateMap: date → availability ---
  const dateMap = useMemo(() => {
    const map = new Map<string, { status: AvailabilityStatus; price: number | null; source: string }>();
    availability.forEach((a) => map.set(a.date, { status: a.status, price: a.price, source: a.source }));
    return map;
  }, [availability]);

  // --- สร้างข้อมูลปฏิทิน ---
  const months = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 0; i < calendarConfig.monthsToShow; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = monthDate.getDay();
      const days = [];
      for (let j = 0; j < firstDayOfWeek; j++) days.push(null);
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const isPast = new Date(dateStr) < new Date(new Date().toDateString());
        const entry = dateMap.get(dateStr);
        days.push({ day: d, date: dateStr, isPast, status: entry?.status || null, price: entry?.price || null, source: entry?.source || null });
      }
      result.push({ year, month, monthName: calendarConfig.monthNames[month], days });
    }
    return result;
  }, [dateMap]);

  // --- Toggle date selection (คลิก = เลือก/ยกเลิกเลือก) ---
  const handleCellClick = useCallback((date: string, e: React.MouseEvent) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (e.shiftKey && prev.size > 0) {
        // Shift+click: เลือกช่วงจากวันสุดท้ายที่เลือก
        const lastSelected = Array.from(prev).sort().pop()!;
        const start = lastSelected < date ? lastSelected : date;
        const end = lastSelected < date ? date : lastSelected;
        months.forEach((m) =>
          m.days.forEach((d) => {
            if (d && !d.isPast && d.date >= start && d.date <= end) {
              next.add(d.date);
            }
          })
        );
      } else {
        if (next.has(date)) next.delete(date);
        else next.add(date);
      }
      return next;
    });
  }, [months]);

  // --- Select all / deselect all ---
  const handleSelectAll = useCallback(() => {
    const allDates = new Set<string>();
    months.forEach((m) =>
      m.days.forEach((d) => {
        if (d && !d.isPast) allDates.add(d.date);
      })
    );
    setSelectedDates(allDates);
  }, [months]);

  const handleDeselectAll = useCallback(() => {
    setSelectedDates(new Set());
  }, []);

  const handlePrevMonth = () => {
    setMobileMonthIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextMonth = () => {
    setMobileMonthIndex((prev) => Math.min(months.length - 1, prev + 1));
  };

  // --- Apply status to selected dates ---
  const handleApplyStatus = async (status: AvailabilityStatus) => {
    if (!selectedPropertyId || selectedDates.size === 0) return;
    setSaving(true);
    setError(null);
    setSaveStatus(null);

    const parsedPrice = bulkPrice.trim() === "" ? null : Number(bulkPrice);
    if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
      setError("ราคาที่กรอกไม่ถูกต้อง");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: selectedPropertyId,
        dates: Array.from(selectedDates),
        status,
        price: parsedPrice,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      setSaving(false);
      return;
    }

    const actionLabel =
      status === "available" ? "ว่าง" : status === "booked" ? "จอง" : "ปิด";
    setSaveStatus(`บันทึกสำเร็จ: ${selectedDates.size} วัน (${actionLabel})`);
    setSelectedDates(new Set());
    setBulkPrice("");
    setSaving(false);
    mutate();
  };

  const handleSavePriceOnly = async () => {
    if (!selectedPropertyId || selectedDates.size === 0) return;

    const parsedPrice = Number(bulkPrice);
    if (bulkPrice.trim() === "" || Number.isNaN(parsedPrice)) {
      setError("กรุณากรอกราคาก่อนกดยืนยันราคา");
      return;
    }

    // บันทึกราคาโดยคงสถานะเดิมของแต่ละวัน
    const groupedByStatus = new Map<AvailabilityStatus, string[]>();
    for (const date of Array.from(selectedDates)) {
      const existing = dateMap.get(date);
      if (!existing?.status) {
        setError("มีวันที่ยังไม่มีสถานะ กรุณากำหนดสถานะวันก่อน");
        return;
      }
      const list = groupedByStatus.get(existing.status) || [];
      list.push(date);
      groupedByStatus.set(existing.status, list);
    }

    setSaving(true);
    setError(null);
    setSaveStatus(null);

    try {
      for (const [status, dates] of Array.from(groupedByStatus.entries())) {
        const res = await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: selectedPropertyId,
            dates,
            status,
            price: parsedPrice,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "ยืนยันราคาไม่สำเร็จ");
          setSaving(false);
          return;
        }
      }

      setSaveStatus(`ยืนยันราคาสำเร็จ: ${selectedDates.size} วัน`);
      mutate();
    } catch {
      setError("ยืนยันราคาไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">จัดการปฏิทิน</h1>

      {/* --- เลือก Property --- */}
      <div className="bg-surface rounded-xl border border-gray-200 p-4 mb-6">
        <label className="block text-text-secondary text-sm mb-2">เลือกบ้านพัก</label>
        <select
          value={selectedPropertyId || ""}
          onChange={(e) => {
            setSelectedPropertyId(e.target.value || null);
            setSelectedDates(new Set());
            setMobileMonthIndex(0);
          }}
          className="w-full max-w-md px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="">-- เลือกบ้านพัก --</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {saveStatus && (
        <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {saveStatus}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {!selectedPropertyId ? (
        <p className="text-text-secondary text-center py-12">เลือกบ้านพักเพื่อจัดการปฏิทิน</p>
      ) : availLoading ? (
        <LoadingSpinner size="lg" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* --- Calendar (2 เดือน) --- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mobile: single month card + prev/next */}
            {months[mobileMonthIndex] && (
              <div className="md:hidden bg-surface rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={handlePrevMonth}
                    disabled={mobileMonthIndex === 0}
                    className="px-3 py-1.5 rounded-lg text-sm bg-card text-text-secondary disabled:opacity-40"
                  >
                    ← ก่อนหน้า
                  </button>
                  <h3 className="text-text-primary font-semibold text-sm">
                    {months[mobileMonthIndex].monthName} {months[mobileMonthIndex].year + 543}
                  </h3>
                  <button
                    onClick={handleNextMonth}
                    disabled={mobileMonthIndex === months.length - 1}
                    className="px-3 py-1.5 rounded-lg text-sm bg-card text-text-secondary disabled:opacity-40"
                  >
                    ถัดไป →
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {calendarConfig.dayNames.map((day) => (
                    <div key={day} className="text-center text-text-secondary text-xs py-1">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {months[mobileMonthIndex].days.map((dayData, idx) => {
                    if (!dayData) return <div key={`empty-mobile-${idx}`} />;
                    const isSelected = selectedDates.has(dayData.date);
                    const statusStyle = dayData.isPast
                      ? theme.calendar.past
                      : dayData.status ? theme.calendar[dayData.status] : { bg: "", border: "", text: "text-text-secondary", hover: "hover:bg-card" };

                    return (
                      <button
                        key={dayData.date}
                        disabled={dayData.isPast}
                        onClick={(e) => handleCellClick(dayData.date, e)}
                        className={cn(
                          "relative rounded-md p-1 text-center border transition-all min-h-[3.2rem] flex flex-col items-center justify-center",
                          statusStyle.bg, statusStyle.border, statusStyle.text, statusStyle.hover,
                          isSelected && "ring-2 ring-accent ring-offset-1 ring-offset-background",
                          dayData.isPast && "cursor-not-allowed"
                        )}
                      >
                        <span className="text-sm font-medium">{dayData.day}</span>
                        {dayData.price && !dayData.isPast && (
                          <span className="text-[10px] opacity-75">{formatPrice(dayData.price)}</span>
                        )}
                        {isSelected && !dayData.isPast && (
                          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-accent" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Desktop: show all months */}
            <div className="hidden md:block space-y-6">
              {months.map((monthData) => (
                <div key={`${monthData.year}-${monthData.month}`} className="bg-surface rounded-xl border border-gray-200 p-4">
                  <h3 className="text-text-primary font-semibold mb-3">
                    {monthData.monthName} {monthData.year + 543}
                  </h3>
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {calendarConfig.dayNames.map((day) => (
                      <div key={day} className="text-center text-text-secondary text-xs py-1">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {monthData.days.map((dayData, idx) => {
                      if (!dayData) return <div key={`empty-desktop-${idx}`} />;
                      const isSelected = selectedDates.has(dayData.date);
                      const statusStyle = dayData.isPast
                        ? theme.calendar.past
                        : dayData.status ? theme.calendar[dayData.status] : { bg: "", border: "", text: "text-text-secondary", hover: "hover:bg-card" };

                      return (
                        <button
                          key={dayData.date}
                          disabled={dayData.isPast}
                          onClick={(e) => handleCellClick(dayData.date, e)}
                          className={cn(
                            "relative rounded-md p-1 text-center border transition-all min-h-[3.5rem] flex flex-col items-center justify-center",
                            statusStyle.bg, statusStyle.border, statusStyle.text, statusStyle.hover,
                            isSelected && "ring-2 ring-accent ring-offset-1 ring-offset-background",
                            dayData.isPast && "cursor-not-allowed"
                          )}
                        >
                          <span className="text-sm font-medium">{dayData.day}</span>
                          {dayData.price && !dayData.isPast && (
                            <span className="text-[10px] opacity-75">{formatPrice(dayData.price)}</span>
                          )}
                          {isSelected && !dayData.isPast && (
                            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-accent" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- Sidebar: Actions --- */}
          <div className="space-y-4">
            {/* วิธีใช้ */}
            <div className="bg-surface rounded-xl border border-gray-200 p-4">
              <h3 className="text-text-primary font-semibold text-sm mb-3">วิธีใช้</h3>
              <ul className="text-text-secondary text-xs space-y-1">
                <li>• คลิกวัน = เลือกวัน (จุดฟ้า)</li>
                <li>• Shift+คลิก = เลือกเป็นช่วง</li>
                <li>• เลือกวันแล้วกดปุ่มสถานะด้านล่าง</li>
              </ul>
            </div>

            {/* Selection + Actions */}
            <div className="bg-surface rounded-xl border border-gray-200 p-4">
              <h3 className="text-text-primary font-semibold text-sm mb-3">
                เลือกอยู่ {selectedDates.size} วัน
              </h3>

              {/* Select/Deselect all */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleSelectAll}
                  className="flex-1 py-1.5 bg-card text-text-secondary text-xs rounded-lg hover:bg-card/80 transition-colors"
                >
                  เลือกทั้งหมด
                </button>
                <button
                  onClick={handleDeselectAll}
                  disabled={selectedDates.size === 0}
                  className="flex-1 py-1.5 bg-card text-text-secondary text-xs rounded-lg hover:bg-card/80 disabled:opacity-30 transition-colors"
                >
                  ยกเลิกเลือก
                </button>
              </div>

              <div className="space-y-3">
                {/* ราคา */}
                <div>
                  <label className="block text-text-secondary text-xs mb-1">ราคา (ถ้าต้องการกำหนด)</label>
                  <input
                    type="number"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    placeholder="฿ ราคาต่อคืน"
                    className="w-full px-3 py-2 bg-card border border-gray-200 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <button
                  onClick={handleSavePriceOnly}
                  disabled={selectedDates.size === 0 || saving || bulkPrice.trim() === ""}
                  className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-30 transition-colors"
                >
                  💾 ยืนยันราคา
                </button>

                {/* Status buttons */}
                <button
                  onClick={() => handleApplyStatus("available")}
                  disabled={selectedDates.size === 0 || saving}
                  className="w-full py-2.5 bg-green-50 text-green-600 border border-green-500/30 rounded-lg text-sm font-medium hover:bg-green-500/30 disabled:opacity-30 transition-colors"
                >
                  ✅ ทำเครื่องหมาย ว่าง
                </button>

                <button
                  onClick={() => handleApplyStatus("booked")}
                  disabled={selectedDates.size === 0 || saving}
                  className="w-full py-2.5 bg-red-50 text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-30 transition-colors"
                >
                  🚫 ทำเครื่องหมาย จอง
                </button>

                <button
                  onClick={() => handleApplyStatus("blocked")}
                  disabled={selectedDates.size === 0 || saving}
                  className="w-full py-2.5 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-lg text-sm font-medium hover:bg-gray-500/30 disabled:opacity-30 transition-colors"
                >
                  ⛔ ทำเครื่องหมาย ปิด
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-surface rounded-xl border border-gray-200 p-4">
              <h3 className="text-text-primary font-semibold text-sm mb-3">สัญลักษณ์</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-green-50 border border-green-500" />
                  <span className="text-text-secondary">ว่าง (Available)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-red-50 border border-red-500" />
                  <span className="text-text-secondary">จอง (Booked)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-gray-500/20 border border-gray-500" />
                  <span className="text-text-secondary">ปิด (Blocked)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded ring-2 ring-accent" />
                  <span className="text-text-secondary">เลือกอยู่</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
