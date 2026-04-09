// =============================================================
// app/villa/[code]/page.tsx — Public Shared Villa Page
// 2-Panel Layout: ซ้าย = รายละเอียดบ้าน + แผนที่ / ขวา = ปฏิทิน
// =============================================================

"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import "leaflet/dist/leaflet.css";
import { cn, formatPrice } from "@/lib/utils";
import { calendarConfig } from "@/config/calendar";
import { theme } from "@/config/theme";
import PriceCard from "@/components/ui/PriceCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { PropertyWithStats, Availability } from "@/types";

type Props = {
  params: { code: string };
};

export default function SharedVillaPage({ params }: Props) {
  const { code } = params;
  const [property, setProperty] = useState<PropertyWithStats | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mobileTab, setMobileTab] = useState<"detail" | "calendar">("detail");
  const [currentMonthIdx, setCurrentMonthIdx] = useState(0);
  const searchParams = useSearchParams();
  const isAgentView = searchParams.get("view") === "agent";

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/properties/by-code/${encodeURIComponent(code)}`);
        if (!res.ok) { setError(true); setLoading(false); return; }
        const data = await res.json();
        setProperty(data);

        const today = new Date().toISOString().split("T")[0];
        const end = new Date();
        end.setDate(end.getDate() + 60);
        const endStr = end.toISOString().split("T")[0];

        const avRes = await fetch(`/api/availability?property_id=${data.id}&from=${today}&to=${endStr}`);
        if (avRes.ok) {
          const avData = await avRes.json();
          setAvailability(Array.isArray(avData) ? avData : []);
        }
      } catch {
        setError(true);
      }
      setLoading(false);
    }
    fetchData();
  }, [code]);

  const dateMap = useMemo(() => {
    const map = new Map<string, Availability>();
    availability.forEach((a) => map.set(a.date, a));
    return map;
  }, [availability]);

  // ค่าคอมจาก property: ลูกค้าเห็นราคาจริง, Agent เห็นราคาหักค่าคอม
  const commission = property?.price_markup ?? 0;
  const priceAdjust = isAgentView ? -commission : 0;

  const stats = useMemo(() => {
    const available = availability.filter((a) => a.status === "available");
    const prices = available
      .map((a) => a.price)
      .filter((p): p is number => p !== null);
    const lastScraped = availability
      .filter((a) => a.scraped_at)
      .sort((a, b) => (b.scraped_at! > a.scraped_at! ? 1 : -1))[0];

    // บวกราคา markup เข้าไป
    const minPriceBase = prices.length > 0 ? Math.min(...prices) : null;

    return {
      availableDays: available.length,
      bookedDays: availability.filter((a) => a.status === "booked").length,
      totalDays: availability.length,
      minPrice: minPriceBase !== null ? Math.max(0, minPriceBase + priceAdjust) : null,
      lastScrapedAt: lastScraped?.scraped_at || null,
    };
  }, [availability, priceAdjust]);

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
        // ลูกค้าเห็นราคาจริง, Agent เห็นราคาหักค่าคอม
        const displayPrice = entry?.price != null
          ? Math.max(0, entry.price + priceAdjust)
          : null;
        days.push({
          day: d, date: dateStr, isPast,
          status: entry?.status || null,
          price: displayPrice,
          source: entry?.source || null,
        });
      }

      result.push({ year, month, monthName: calendarConfig.monthNames[month], days });
    }
    return result;
  }, [dateMap, priceAdjust]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-text-secondary">
        <div className="text-center">
          <p className="text-4xl mb-4">🏠</p>
          <p className="text-lg">ไม่พบบ้านพัก</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* --- 2-Panel Layout (Desktop) / Single scroll (Mobile) --- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel ซ้าย: แผนที่ + รายละเอียด + ปฏิทิน(mobile) */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-background">
          {/* Map with frame */}
          <div className="p-4 md:p-6 pb-3">
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
              <div className="h-[40vh] md:h-[52vh]">
                <SharedMapView
                  latitude={property.latitude}
                  longitude={property.longitude}
                  minPrice={stats.minPrice}
                />
              </div>
            </div>
          </div>

          {/* Property Info */}
          <div className="px-4 md:px-6 pb-4">
            {/* Code + Price row */}
            <div className="flex items-baseline justify-between mb-3">
              {property.property_code && (
                <p className="text-accent text-2xl md:text-3xl font-bold">{property.property_code}</p>
              )}
              {stats.minPrice && (
                <div className="flex items-baseline gap-1">
                  <span className="text-accent font-bold text-lg">{formatPrice(stats.minPrice)}</span>
                  <span className="text-text-secondary text-xs">/คืน</span>
                </div>
              )}
            </div>

            {/* Stats Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-card border border-gray-200 px-3 py-1.5 rounded-full text-text-secondary text-xs">
                🛏 {property.bedrooms} ห้องนอน
              </span>
              <span className="bg-card border border-gray-200 px-3 py-1.5 rounded-full text-text-secondary text-xs">
                🚿 {property.bathrooms} ห้องน้ำ
              </span>
              <span className="bg-card border border-gray-200 px-3 py-1.5 rounded-full text-text-secondary text-xs">
                👥 {property.max_guests}{property.extra_guests ? `+${property.extra_guests}` : ""} คน
              </span>
              {property.pets_allowed && (
                <span className="bg-card border border-gray-200 px-3 py-1.5 rounded-full text-text-secondary text-xs">
                  🐾 รับสัตว์เลี้ยง
                </span>
              )}
            </div>

            {/* Description */}
            {property.description && (
              <p className="text-text-secondary text-sm mt-3 leading-relaxed">{property.description}</p>
            )}

            {/* รายละเอียดเพิ่มเติม (ถ้ามี) */}
            {property.detail_url && (
              <a
                href={property.detail_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                📋 ดูรายละเอียดเพิ่มเติม
              </a>
            )}
          </div>

          {/* Mobile Calendar (ซ่อนบน desktop) */}
          <div className="md:hidden px-4 pb-6">
            {months.length > 0 && (
              <div>
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setCurrentMonthIdx((i) => Math.max(0, i - 1))}
                    disabled={currentMonthIdx === 0}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 bg-card text-text-secondary hover:bg-card/80"
                  >
                    ◀ ก่อนหน้า
                  </button>
                  <h3 className="text-text-primary font-semibold text-sm">
                    {months[currentMonthIdx].monthName} {months[currentMonthIdx].year + 543}
                  </h3>
                  <button
                    onClick={() => setCurrentMonthIdx((i) => Math.min(months.length - 1, i + 1))}
                    disabled={currentMonthIdx === months.length - 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 bg-card text-text-secondary hover:bg-card/80"
                  >
                    ถัดไป ▶
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
                  {months[currentMonthIdx].days.map((dayData, idx) => {
                    if (!dayData) return <div key={`empty-${idx}`} />;

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
                          "min-h-[2.8rem] flex flex-col items-center justify-center",
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
                        {dayData.price && !dayData.isPast && (
                          <span className="text-[9px] opacity-75">
                            {formatPrice(dayData.price)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel ขวา: ปฏิทิน (Desktop only) */}
        <aside className="hidden md:flex w-96 bg-surface border-l border-gray-200 overflow-hidden shrink-0 flex-col">
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Stats Cards */}
            <div className="p-4">
              <PriceCard
                label="ราคาเริ่มต้น"
                price={stats.minPrice}
                subtitle="ต่อคืน"
              />
            </div>

            {/* Calendar Months */}
            <div className="p-4 pt-0 space-y-6">
              {months.map((monthData) => (
                <div key={`${monthData.year}-${monthData.month}`}>
                  <h3 className="text-text-primary font-semibold text-sm mb-2">
                    {monthData.monthName} {monthData.year + 543}
                  </h3>

                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {calendarConfig.dayNames.map((day) => (
                      <div key={day} className="text-center text-text-secondary text-xs py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {monthData.days.map((dayData, idx) => {
                      if (!dayData) return <div key={`empty-${idx}`} />;

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
                          {dayData.price && !dayData.isPast && (
                            <span className="text-[10px] opacity-75">
                              {formatPrice(dayData.price)}
                            </span>
                          )}
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
          </div>
        </aside>
      </div>
    </div>
  );
}

// --- Map component for shared page ---
function SharedMapView({
  latitude,
  longitude,
  minPrice,
}: {
  latitude: number | null;
  longitude: number | null;
  minPrice: number | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    let map: L.Map | null = null;

    async function init() {
      const L = (await import("leaflet")).default;

      if (!mapRef.current) return;

      map = L.map(mapRef.current).setView([latitude!, longitude!], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const priceLabel = minPrice ? formatPrice(minPrice) : "";
      const icon = L.divIcon({
        className: "shared-pin-marker",
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:32px;height:32px;background:#E8622A;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
              <span style="transform:rotate(45deg);font-size:14px;">🏠</span>
            </div>
            ${priceLabel ? `<div style="background:white;color:#1F2937;padding:2px 8px;border-radius:3px;font-size:11px;margin-top:2px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.15);">${priceLabel}/คืน</div>` : ""}
          </div>
        `,
        iconSize: [120, 52],
        iconAnchor: [60, 32],
      });

      L.marker([latitude!, longitude!], { icon }).addTo(map);
    }

    init();

    return () => { map?.remove(); };
  }, [latitude, longitude, minPrice]);

  if (!latitude || !longitude) {
    return (
      <div className="h-full bg-surface flex items-center justify-center text-text-secondary">
        📍 ไม่มีตำแหน่ง
      </div>
    );
  }

  return <div ref={mapRef} className="h-full w-full" />;
}
