// =============================================================
// components/ui/DateRangePicker.tsx — Calendar-style Date Range Picker
// คอมโพเนนต์เลือกช่วงวันแบบปฏิทิน (วันเดียวหรือหลายวัน)
// =============================================================

"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { calendarConfig } from "@/config/calendar";

type DateRangePickerProps = {
  value: { from: string; to: string } | null;
  onChange: (range: { from: string; to: string } | null) => void;
  onClose?: () => void;
};

export default function DateRangePicker({
  value,
  onChange,
  onClose,
}: DateRangePickerProps) {
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  const [selecting, setSelecting] = useState<"from" | "to" | null>(value ? null : "from");
  const [tempFrom, setTempFrom] = useState<string | null>(value?.from || null);
  const [tempTo, setTempTo] = useState<string | null>(value?.to || null);

  // สร้างข้อมูลปฏิทินเดือนปัจจุบัน
  const monthData = useMemo(() => {
    const now = new Date();
    const monthDate = new Date(now.getFullYear(), now.getMonth() + currentMonthOffset, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = monthDate.getDay();

    const days: (null | { day: number; date: string; isPast: boolean })[] = [];
    for (let j = 0; j < firstDayOfWeek; j++) days.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isPast = new Date(dateStr) < new Date(new Date().toDateString());
      days.push({ day: d, date: dateStr, isPast });
    }

    return {
      year,
      month,
      monthName: calendarConfig.monthNames[month],
      days,
    };
  }, [currentMonthOffset]);

  const handleDayClick = (date: string) => {
    if (selecting === "from" || !tempFrom) {
      // เลือกวันเริ่มต้น
      setTempFrom(date);
      setTempTo(null);
      setSelecting("to");
    } else if (selecting === "to") {
      // เลือกวันสิ้นสุด
      if (date < tempFrom) {
        // ถ้าเลือกวันก่อนหน้า ให้สลับ
        setTempTo(tempFrom);
        setTempFrom(date);
      } else {
        setTempTo(date);
      }
      setSelecting(null);
    } else {
      // รีเซ็ตการเลือก
      setTempFrom(date);
      setTempTo(null);
      setSelecting("to");
    }
  };

  const handleApply = () => {
    if (tempFrom) {
      // ถ้าเลือกแค่วันเดียว ให้ใช้วันเดียวกันทั้ง from และ to
      onChange({ from: tempFrom, to: tempTo || tempFrom });
      onClose?.();
    }
  };

  const handleClear = () => {
    setTempFrom(null);
    setTempTo(null);
    setSelecting("from");
    onChange(null);
    onClose?.();
  };

  const isInRange = (date: string) => {
    if (!tempFrom) return false;
    if (!tempTo) return date === tempFrom;
    return date >= tempFrom && date <= tempTo;
  };

  const isStart = (date: string) => date === tempFrom;
  const isEnd = (date: string) => date === tempTo || (!tempTo && date === tempFrom);

  return (
    <div className="bg-surface rounded-xl border border-gray-200 shadow-xl p-4 w-80">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentMonthOffset((prev) => prev - 1)}
          disabled={currentMonthOffset <= 0}
          className="px-2 py-1 rounded text-text-secondary hover:bg-card disabled:opacity-30 transition-colors"
        >
          ◀
        </button>
        <h3 className="text-text-primary font-semibold text-sm">
          {monthData.monthName} {monthData.year + 543}
        </h3>
        <button
          onClick={() => setCurrentMonthOffset((prev) => prev + 1)}
          disabled={currentMonthOffset >= 11}
          className="px-2 py-1 rounded text-text-secondary hover:bg-card disabled:opacity-30 transition-colors"
        >
          ▶
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {calendarConfig.dayNames.map((day) => (
          <div key={day} className="text-center text-text-secondary text-xs py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {monthData.days.map((dayData, idx) => {
          if (!dayData) return <div key={`empty-${idx}`} />;

          const inRange = isInRange(dayData.date);
          const isStartDay = isStart(dayData.date);
          const isEndDay = isEnd(dayData.date);

          return (
            <button
              key={dayData.date}
              disabled={dayData.isPast}
              onClick={() => handleDayClick(dayData.date)}
              className={cn(
                "relative rounded-md p-2 text-center transition-colors text-sm",
                "hover:bg-accent/20 disabled:opacity-30 disabled:cursor-not-allowed",
                dayData.isPast && "text-text-secondary/50",
                inRange && !isStartDay && !isEndDay && "bg-accent/10 text-accent",
                (isStartDay || isEndDay) && "bg-accent text-white font-medium"
              )}
            >
              {dayData.day}
            </button>
          );
        })}
      </div>

      {/* Selection info */}
      <div className="mt-4 text-xs text-text-secondary">
        {selecting === "from" && <p>📅 เลือกวันเริ่มต้น</p>}
        {selecting === "to" && tempFrom && (
          <p>📅 เลือกวันสิ้นสุด (หรือคลิกวันเดิมเพื่อเลือกวันเดียว)</p>
        )}
        {tempFrom && tempTo && (
          <p className="text-accent">
            เลือก: {tempFrom} → {tempTo}
          </p>
        )}
        {tempFrom && !tempTo && selecting !== "to" && (
          <p className="text-accent">เลือก: {tempFrom} (วันเดียว)</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleApply}
          disabled={!tempFrom}
          className="flex-1 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-40 transition-colors"
        >
          ยืนยัน
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-card text-text-secondary rounded-lg text-sm hover:bg-card/80 transition-colors"
        >
          ล้าง
        </button>
      </div>
    </div>
  );
}
