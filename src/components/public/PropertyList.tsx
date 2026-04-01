// =============================================================
// components/public/PropertyList.tsx — แผงรายการบ้าน (Client Component)
// แสดงรายการบ้านทั้งหมดพร้อม filter ตาม source
// อยู่ด้านซ้ายของ 3-panel layout
// =============================================================

"use client";

import { useState } from "react";
import PropertyCard from "./PropertyCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { PropertyWithStats, PropertyZone } from "@/types";

type PropertyListProps = {
  properties: PropertyWithStats[];
  selectedId: string | null;
  onSelect: (property: PropertyWithStats) => void;
  isLoading: boolean;
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
}: PropertyListProps) {
  const [filter, setFilter] = useState<ZoneFilter>("all");

  // กรอง properties ตามโซน
  const filtered =
    filter === "all"
      ? properties
      : properties.filter((p) => p.zone === filter);

  return (
    <div className="flex flex-col h-full">
      {/* --- Header + Filter --- */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-text-primary font-bold text-lg mb-3">
          🏠 บ้านพัก ({filtered.length})
        </h2>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-1">
          {zoneFilters.map((zf) => (
            <button
              key={zf.value}
              onClick={() => setFilter(zf.value)}
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
      </div>

      {/* --- Property Cards (scrollable) --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">
            ไม่พบบ้านพัก
          </p>
        ) : (
          filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isSelected={selectedId === property.id}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
