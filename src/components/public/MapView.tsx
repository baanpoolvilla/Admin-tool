// =============================================================
// components/public/MapView.tsx — แผนที่ Leaflet (Client Component)
// แสดง markers ตำแหน่งบ้านพักทั้งหมด
// ⚠️ Leaflet ไม่รองรับ SSR → ต้อง dynamic import ด้วย ssr: false
// อยู่ตรงกลางของ 3-panel layout
// =============================================================

"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { PropertyWithStats } from "@/types";
import { mapConfig } from "@/config/map";

type MapViewProps = {
  properties: PropertyWithStats[];
  selectedId: string | null;
  onSelect: (property: PropertyWithStats) => void;
};

// สร้าง custom pin icon พร้อมชื่อ (สีเดียว - แดง)
function createPinIcon(
  L: typeof import("leaflet"),
  name: string,
  isSelected: boolean
) {
  const size = isSelected ? 36 : 28;

  return L.divIcon({
    className: "custom-pin-marker",
    html: `
      <div class="pin-container" style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: ${size + 80}px;
      ">
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: #E53935;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            font-size: ${isSelected ? "14px" : "12px"};
          ">🏠</span>
        </div>
        <div style="
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          margin-top: 2px;
          white-space: nowrap;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: 'Noto Sans Thai', sans-serif;
          ${isSelected ? "font-weight: bold; background: #E53935;" : ""}
        ">${name}</div>
      </div>
    `,
    iconSize: [size + 80, size + 20],
    iconAnchor: [(size + 80) / 2, size],
    popupAnchor: [0, -size],
  });
}

export default function MapView({
  properties,
  selectedId,
  onSelect,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Dynamic import Leaflet (ไม่รองรับ SSR)
    async function initMap() {
      const L = (await import("leaflet")).default;

      if (!mapRef.current || mapInstanceRef.current) return;

      // สร้าง map instance
      const map = L.map(mapRef.current).setView(
        [mapConfig.defaultCenter.lat, mapConfig.defaultCenter.lng],
        mapConfig.defaultZoom
      );

      // เพิ่ม tile layer (OpenStreetMap — ฟรี)
      L.tileLayer(mapConfig.tileUrl, {
        attribution: mapConfig.tileAttribution,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // --- อัปเดต Markers เมื่อ properties เปลี่ยน ---
  useEffect(() => {
    async function updateMarkers() {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;
      if (!map) return;

      // ลบ markers เดิม
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      properties.forEach((property) => {
        if (!property.latitude || !property.longitude) return;

        const isSelected = property.id === selectedId;

        // สร้าง custom pin icon พร้อมชื่อ
        const icon = createPinIcon(L, property.name, isSelected);

        const marker = L.marker([property.latitude, property.longitude], {
          icon,
          zIndexOffset: isSelected ? 1000 : 0,
        }).addTo(map);

        // คลิกที่ marker → เลือก property (เหมือนกดจากรายการซ้าย)
        marker.on("click", () => onSelect(property));

        markersRef.current.push(marker);
      });
    }

    updateMarkers();
  }, [properties, selectedId, onSelect]);

  // --- Pan to selected property ---
  useEffect(() => {
    if (!selectedId || !mapInstanceRef.current) return;

    const selected = properties.find((p) => p.id === selectedId);
    if (selected?.latitude && selected?.longitude) {
      mapInstanceRef.current.flyTo(
        [selected.latitude, selected.longitude],
        mapConfig.selectedZoom,
        { duration: 0.8 }
      );
    }
  }, [selectedId, properties]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-sm rounded-lg p-2 text-xs z-[1000]">
        <p className="text-text-secondary text-[10px]">📍 คลิกหมุดเพื่อดูรายละเอียด</p>
      </div>
    </div>
  );
}
