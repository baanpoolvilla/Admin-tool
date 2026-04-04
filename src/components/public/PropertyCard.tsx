// =============================================================
// components/public/PropertyCard.tsx — การ์ดบ้านพัก (Client Component)
// แสดงในแผง Property List ด้านซ้าย
// - thumbnail, ชื่อ, ที่อยู่, ราคา, จำนวนวันว่าง
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

// ตรวจสอบว่าเป็น URL ภายนอก (http/https) หรือไม่
function isExternalUrl(url: string | null): boolean {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

export default function PropertyCard({
  property,
  isSelected,
  onSelect,
}: PropertyCardProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = property.property_code || property.id;
    const url = `${window.location.origin}/villa/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("คัดลอกลิงก์แล้ว!");
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
      {/* --- Thumbnail + Status Overlay --- */}
      <div className="relative aspect-video rounded-md overflow-hidden bg-surface mb-3">
        {/* แสดง thumbnail เฉพาะเมื่อไม่ใช่ URL ภายนอก */}
        {property.thumbnail_url && !isExternalUrl(property.thumbnail_url) ? (
          <img
            src={property.thumbnail_url}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary text-3xl">
            🏠
          </div>
        )}

        {/* Badge: ราคา (มุมขวาบน) */}
        {property.base_price && (
          <span className="absolute top-2 right-2 bg-white/90 shadow-sm text-white text-xs px-2 py-1 rounded">
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
          {/* ปุ่มแชร์ */}
          <span
            onClick={handleShare}
            className="text-text-secondary hover:text-accent text-sm cursor-pointer transition-colors"
            title="แชร์"
          >
            🔗
          </span>
        </div>
      </div>
    </button>
  );
}
