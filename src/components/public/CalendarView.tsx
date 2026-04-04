// =============================================================
// components/public/CalendarView.tsx — ปฏิทินแสดงวันว่าง/จอง (Client Component)
// แสดง 2 เดือน พร้อมสี status + ราคา
// อยู่ด้านขวาของ 3-panel layout
// =============================================================

"use client";

import { useMemo } from "react";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import { calendarConfig } from "@/config/calendar";
import { theme } from "@/config/theme";
import PriceCard from "@/components/ui/PriceCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { Availability, Property } from "@/types";

type CalendarViewProps = {
  property: Property | null;
  availability: Availability[];
  isLoading: boolean;
};

export default function CalendarView({
  property,
  availability,
  isLoading,
}: CalendarViewProps) {
  // --- สร้าง lookup map: date → availability entry ---
  const dateMap = useMemo(() => {
    const map = new Map<string, Availability>();
    availability.forEach((a) => map.set(a.date, a));
    return map;
  }, [availability]);

  // --- คำนวณสถิติ ---
  const stats = useMemo(() => {
    const markup = typeof property?.price_markup === "number" ? property.price_markup : 0;
    const available = availability.filter((a) => a.status === "available");
    const prices = available
      .map((a) => a.price)
      .filter((p): p is number => p !== null);
    const lastScraped = availability
      .filter((a) => a.scraped_at)
      .sort((a, b) => (b.scraped_at! > a.scraped_at! ? 1 : -1))[0];

    return {
      availableDays: available.length,
      bookedDays: availability.filter((a) => a.status === "booked").length,
      avgPrice:
        prices.length > 0
          ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) + markup
          : null,
      lastScrapedAt: lastScraped?.scraped_at || null,
    };
  }, [availability, property]);

  // --- สร้างข้อมูลปฏิทิน 2 เดือน ---
  const months = useMemo(() => {
    const markup = typeof property?.price_markup === "number" ? property.price_markup : 0;
    const result = [];
    const now = new Date();

    for (let i = 0; i < calendarConfig.monthsToShow; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = monthDate.getDay(); // 0 = Sunday

      const days = [];

      // ช่องว่างก่อนวันที่ 1
      for (let j = 0; j < firstDayOfWeek; j++) {
        days.push(null);
      }

      // วันในเดือน
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const isPast = new Date(dateStr) < new Date(new Date().toDateString());
        const entry = dateMap.get(dateStr);
        const displayPrice = entry?.price != null ? entry.price + markup : null;

        days.push({
          day: d,
          date: dateStr,
          isPast,
          status: entry?.status || null,
          price: displayPrice,
          source: entry?.source || null,
        });
      }

      result.push({
        year,
        month,
        monthName: calendarConfig.monthNames[month],
        days,
      });
    }

    return result;
  }, [dateMap, property]);

  // --- ไม่มี property ที่เลือก ---
  if (!property) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary">
        <div className="text-center">
          <p className="text-4xl mb-4">📅</p>
          <p>เลือกบ้านพักเพื่อดูปฏิทิน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* --- Header: ชื่อบ้าน --- */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-text-primary font-bold text-lg">{property.name}</h2>
        {stats.lastScrapedAt && (
          <p className="text-text-secondary text-xs mt-1">
            อัปเดตล่าสุด: {timeAgo(stats.lastScrapedAt)}
          </p>
        )}
      </div>

      {/* --- สถิติสรุป --- */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <PriceCard
          label="วันว่าง"
          price={null}
          subtitle={`${stats.availableDays} วัน (จาก ${availability.length} วัน)`}
        />
        <PriceCard
          label="ราคาเฉลี่ย"
          price={stats.avgPrice}
          subtitle="ต่อคืน"
        />
      </div>

      {/* --- Calendar --- */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="p-4 space-y-6">
          {months.map((monthData) => (
            <div key={`${monthData.year}-${monthData.month}`}>
              {/* ชื่อเดือน */}
              <h3 className="text-text-primary font-semibold text-sm mb-2">
                {monthData.monthName} {monthData.year + 543}
              </h3>

              {/* หัวตาราง: วันในสัปดาห์ */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {calendarConfig.dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-text-secondary text-xs py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* ตารางวัน */}
              <div className="grid grid-cols-7 gap-1">
                {monthData.days.map((dayData, idx) => {
                  if (!dayData) {
                    return <div key={`empty-${idx}`} />;
                  }

                  // เลือก style ตามสถานะ
                  const statusStyle = dayData.isPast
                    ? theme.calendar.past
                    : dayData.status
                    ? theme.calendar[dayData.status]
                    : { bg: "", border: "", text: "text-text-secondary", hover: "" };

                  return (
                    <div
                      key={dayData.date}
                      className={cn(
                        "relative rounded-md p-1 text-center border transition-colors",
                        "min-h-[3rem] flex flex-col items-center justify-center",
                        statusStyle.bg,
                        statusStyle.border,
                        statusStyle.text,
                        statusStyle.hover,
                        dayData.status === "booked" && "cursor-not-allowed"
                      )}
                      title={
                        dayData.price
                          ? `${formatPrice(dayData.price)}/คืน`
                          : dayData.status || ""
                      }
                    >
                      <span className="text-sm font-medium">{dayData.day}</span>
                      {/* แสดงราคาถ้ามี */}
                      {dayData.price && !dayData.isPast && (
                        <span className="text-[10px] opacity-75">
                          {formatPrice(dayData.price)}
                        </span>
                      )}
                      {/* indicator source: manual vs scraper */}
                      {dayData.source === "manual" && !dayData.isPast && (
                        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
