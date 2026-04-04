// =============================================================
// components/public/PropertyList.tsx — แผงรายการบ้าน (Client Component)
// แสดงรายการบ้านทั้งหมดพร้อม filter ตาม source
// อยู่ด้านซ้ายของ 3-panel layout
// =============================================================

"use client";

import { useState, useRef, useEffect } from "react";
import PropertyCard from "./PropertyCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DateRangePicker from "@/components/ui/DateRangePicker";
import type { PropertyWithStats, PropertyZone } from "@/types";

type PropertyListProps = {
  properties: PropertyWithStats[];
  selectedId: string | null;
  onSelect: (property: PropertyWithStats) => void;
  isLoading: boolean;
  dateRange: { from: string; to: string } | null;
  onDateRangeChange: (range: { from: string; to: string } | null) => void;
  onZoneChange?: (zone: "all" | PropertyZone) => void;
  scrollToSelected?: boolean; // เมื่อเป็น true จะเลื่อนไปยังการ์ดที่เลือก
};

type ZoneFilter = "all" | PropertyZone;

// --- ตัวกรองโซน ---
const zoneFilters: { label: string; value: ZoneFilter }[] = [
  { label: "ทั้งหมด", value: "all" },
  { label: "บางแสน", value: "bangsaen" },
  { label: "พัทยา", value: "pattaya" },
  { label: "สัตหีบ", value: "sattahip" },
  { label: "ระยอง", value: "rayong" },
];

export default function PropertyList({
  properties,
  selectedId,
  onSelect,
  isLoading,
  dateRange,
  onDateRangeChange,
  onZoneChange,
  scrollToSelected,
}: PropertyListProps) {
  const [filter, setFilter] = useState<ZoneFilter>("all");
  const [onlyAvailableToday, setOnlyAvailableToday] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [guestCount, setGuestCount] = useState("");
  const [onlyPetsAllowed, setOnlyPetsAllowed] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to selected card when scrollToSelected changes
  useEffect(() => {
    if (scrollToSelected && selectedId && scrollContainerRef.current) {
      const cardEl = scrollContainerRef.current.querySelector(`[data-property-id="${selectedId}"]`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [scrollToSelected, selectedId]);

  // กรอง properties ตามโซน + ว่างวันนี้ + จำนวนคน + สัตว์เลี้ยง
  const filtered = properties.filter((p) => {
    if (filter !== "all" && p.zone !== filter) return false;
    if (onlyAvailableToday && !p.is_available_today) return false;
    if (onlyPetsAllowed && !p.pets_allowed) return false;
    if (guestCount) {
      const needed = parseInt(guestCount);
      if (!isNaN(needed)) {
        const totalCapacity = p.max_guests + (p.extra_guests || 0);
        if (totalCapacity < needed) return false;
      }
    }
    return true;
  });

  // เรียงลำดับตามจำนวนรวมที่ใกล้เคียงที่สุด
  const sorted = guestCount
    ? [...filtered].sort((a, b) => {
        const needed = parseInt(guestCount) || 0;
        const diffA = Math.abs((a.max_guests + (a.extra_guests || 0)) - needed);
        const diffB = Math.abs((b.max_guests + (b.extra_guests || 0)) - needed);
        return diffA - diffB;
      })
    : filtered;

  return (
    <div className="flex flex-col h-full">
      {/* --- Header + Filter --- */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-text-primary font-bold text-lg mb-3">
          🏠 บ้านพัก ({sorted.length})
        </h2>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-1">
          {zoneFilters.map((zf) => (
            <button
              key={zf.value}
              onClick={() => {
                setFilter(zf.value);
                onZoneChange?.(zf.value);
              }}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                filter === zf.value
                  ? "bg-accent text-white"
                  : "bg-card text-text-secondary hover:bg-card/80"
              }`}
            >
              {zf.label}
            </button>
          ))}
        </div>

        {/* Available today toggle */}
        <div className="flex flex-wrap gap-1 mt-2">
          <button
            onClick={() => setOnlyAvailableToday((v) => !v)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              onlyAvailableToday
                ? "bg-green-600 text-white"
                : "bg-card text-text-secondary hover:bg-card/80"
            }`}
          >
            🟢 ว่างวันนี้
          </button>
          <button
            onClick={() => setOnlyPetsAllowed((v) => !v)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              onlyPetsAllowed
                ? "bg-amber-600 text-white"
                : "bg-card text-text-secondary hover:bg-card/80"
            }`}
          >
            🐾 รับสัตว์เลี้ยง
          </button>
        </div>

        {/* Guest count filter */}
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-xs whitespace-nowrap">👥 จำนวนคน</span>
            <div className="flex items-center bg-card border border-gray-200 rounded overflow-hidden">
              <button
                onClick={() => {
                  const val = parseInt(guestCount) || 0;
                  if (val > 1) setGuestCount(String(val - 1));
                  else setGuestCount("");
                }}
                className="px-2.5 py-1 text-text-secondary hover:text-gray-900 hover:bg-gray-100 text-sm transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                placeholder="—"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-12 text-center py-1 bg-transparent text-text-primary text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => {
                  const val = parseInt(guestCount) || 0;
                  setGuestCount(String(val + 1));
                }}
                className="px-2.5 py-1 text-text-secondary hover:text-gray-900 hover:bg-gray-100 text-sm transition-colors"
              >
                +
              </button>
            </div>
            {guestCount && (
              <button
                onClick={() => setGuestCount("")}
                className="text-text-secondary text-xs hover:text-gray-900 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Date range filter */}
        <div className="mt-3 space-y-2 relative" ref={datePickerRef}>
          <p className="text-text-secondary text-xs">📅 ค้นหาวันว่าง</p>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full px-3 py-2 bg-card border border-gray-200 rounded-lg text-text-primary text-xs text-left hover:border-accent/50 transition-colors"
          >
            {dateRange ? (
              <span className="text-accent">
                {dateRange.from === dateRange.to
                  ? dateRange.from
                  : `${dateRange.from} → ${dateRange.to}`}
              </span>
            ) : (
              <span className="text-text-secondary">คลิกเพื่อเลือกวัน...</span>
            )}
          </button>
          {showDatePicker && (
            <div className="absolute top-full left-0 z-50 mt-2">
              <DateRangePicker
                value={dateRange}
                onChange={(range) => {
                  onDateRangeChange(range);
                  setShowDatePicker(false);
                }}
                onClose={() => setShowDatePicker(false)}
              />
            </div>
          )}
          {dateRange && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-accent">
                กรองบ้านว่าง {dateRange.from === dateRange.to
                  ? dateRange.from
                  : `${dateRange.from} ถึง ${dateRange.to}`}
              </p>
              <button
                onClick={() => onDateRangeChange(null)}
                className="text-xs text-text-secondary hover:text-accent transition-colors"
              >
                ✕ ล้าง
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- Property Cards (scrollable) --- */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollContainerRef}>
        {isLoading ? (
          <LoadingSpinner />
        ) : sorted.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">
            ไม่พบบ้านพัก
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sorted.map((property) => (
              <div key={property.id} data-property-id={property.id}>
                <PropertyCard
                  property={property}
                  isSelected={selectedId === property.id}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
