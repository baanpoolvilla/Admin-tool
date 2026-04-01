// =============================================================
// components/public/PropertyCard.tsx — การ์ดบ้านพัก (Client Component)
// แสดงในแผง Property List ด้านซ้าย
// - thumbnail, ชื่อ, ที่อยู่, ราคา, จำนวนวันว่าง
// - คลิกเพื่อเลือกดูบ้านนั้น
// =============================================================

"use client";

import { cn, formatPrice } from "@/lib/utils";
import type { PropertyWithStats } from "@/types";

type PropertyCardProps = {
  property: PropertyWithStats;
  isSelected: boolean;
  onSelect: (property: PropertyWithStats) => void;
};

export default function PropertyCard({
  property,
  isSelected,
  onSelect,
}: PropertyCardProps) {
  return (
    <button
      onClick={() => onSelect(property)}
      className={cn(
        "w-full text-left rounded-lg border p-3 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg",
        isSelected
          ? "border-accent bg-accent/10 shadow-accent/20 shadow-md"
          : "border-white/5 bg-card hover:border-white/10"
      )}
    >
      {/* --- Thumbnail + Status Overlay --- */}
      <div className="relative aspect-video rounded-md overflow-hidden bg-surface mb-3">
        {property.thumbnail_url ? (
          <img
            src={property.thumbnail_url}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary">
            🏠
          </div>
        )}

        {/* Badge: ราคา (มุมขวาบน) */}
        {property.base_price && (
          <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatPrice(property.base_price)}/คืน
          </span>
        )}

        {/* Badge: สถานะ availability (มุมซ้ายล่าง) */}
        <span
          className={cn(
            "absolute bottom-2 left-2 text-xs px-2 py-1 rounded font-medium",
            property.available_days > 0
              ? "bg-green-500/80 text-white"
              : "bg-red-500/80 text-white"
          )}
        >
          {property.available_days > 0
            ? `${property.available_days} วันว่าง`
            : "จองเต็ม"}
        </span>
      </div>

      {/* --- ข้อมูลบ้าน --- */}
      <h3 className="text-text-primary font-semibold text-sm truncate">
        {property.name}
      </h3>

      {property.address && (
        <p className="text-text-secondary text-xs mt-1 truncate">
          📍 {property.address}
        </p>
      )}

      {/* --- สถิติ --- */}
      <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
        <span>🛏 {property.bedrooms}</span>
        <span>🚿 {property.bathrooms}</span>
        <span>👥 {property.max_guests}</span>
      </div>

      {/* --- ราคาเฉลี่ย --- */}
      {property.avg_price && (
        <p className="text-accent text-xs mt-2">
          ราคาเฉลี่ย {formatPrice(property.avg_price)}/คืน
        </p>
      )}
    </button>
  );
}
