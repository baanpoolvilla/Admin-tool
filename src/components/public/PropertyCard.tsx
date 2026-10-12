// =============================================================
// components/public/PropertyCard.tsx — การ์ดบ้านพัก (Client Component)
// แสดงในแผง Property List ด้านซ้าย
// - ชื่อ, ที่อยู่, ราคา, จำนวนวันว่าง
// - คลิกเพื่อเลือกดูบ้านนั้น + ปุ่มแชร์
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
  const handleShareAgent = (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = property.property_code || property.id;
    const url = `${window.location.origin}/villa/${code}?view=agent`;
    navigator.clipboard.writeText(url).then(() => {
      alert("คัดลอกลิงก์สำหรับ Agent แล้ว!");
    });
  };

  const handleShareCustomer = (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = property.property_code || property.id;
    const url = `${window.location.origin}/villa/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("คัดลอกลิงก์สำหรับลูกค้าแล้ว!");
    });
  };

  return (
    <button
      onClick={() => onSelect(property)}
      className={cn(
        "w-full text-left rounded-lg border p-3 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg",
        isSelected
          ? "border-accent bg-orange-50 shadow-accent/20 shadow-md"
          : "border-gray-200 bg-card hover:border-gray-200"
      )}
    >
      {/* --- Status + ราคา --- */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* Badge: สถานะ availability */}
        <span
          className={cn(
            "text-xs px-2 py-1 rounded font-medium",
            property.available_days > 0
              ? "bg-green-500/80 text-white"
              : "bg-red-500/80 text-white"
          )}
        >
          {property.available_days > 0
            ? `${property.available_days} วันว่าง`
            : "จองเต็ม"}
        </span>

        {/* Badge: ราคา */}
        {property.base_price && (
          <span className="text-text-primary text-xs font-medium">
            {formatPrice(property.base_price)}/คืน
          </span>
        )}
      </div>

      {/* --- รหัสบ้าน + ชื่อบ้าน --- */}
      {property.property_code && (
        <p className="text-accent text-[11px] font-medium truncate">
          {property.property_code}
        </p>
      )}
      <h3 className="text-text-primary font-semibold text-sm truncate">
        {property.name}
      </h3>

      {property.address && (
        <p className="text-text-secondary text-xs mt-1 truncate">
          📍 {property.address}
        </p>
      )}

      {/* --- สถิติ --- */}
      <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary flex-wrap">
        <span>🛏 {property.bedrooms}</span>
        <span>🚿 {property.bathrooms}</span>
        <span>👥 {property.max_guests}{property.extra_guests ? `+${property.extra_guests}` : ""}</span>
        {property.pets_allowed && <span>🐾</span>}
      </div>

      {/* --- ราคาเริ่มต้น + Actions --- */}
      <div className="flex items-center justify-between mt-2">
        {property.min_price ? (
          <p className="text-accent text-xs">
            ราคาเริ่มต้น {formatPrice(property.min_price)}/คืน
          </p>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {/* ปุ่มรายละเอียด */}
          {property.detail_url && (
            <a
              href={property.detail_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-text-secondary hover:text-accent text-sm cursor-pointer transition-colors"
              title="รายละเอียด"
            >
              📋
            </a>
          )}
          {/* ปุ่มแชร์สำหรับ Agent */}
          <span
            onClick={handleShareAgent}
            className="text-text-secondary hover:text-accent text-sm cursor-pointer transition-colors"
            title="แชร์สำหรับ Agent"
          >
            🤝
          </span>
          {/* ปุ่มแชร์สำหรับลูกค้า */}
          <span
            onClick={handleShareCustomer}
            className="text-text-secondary hover:text-accent text-sm cursor-pointer transition-colors"
            title="แชร์สำหรับลูกค้า"
          >
            🔗
          </span>
        </div>
      </div>
    </button>
  );
}
