// =============================================================
// components/public/MapView.tsx — แผนที่ Leaflet (Client Component)
// แสดง markers ตำแหน่งบ้านพักทั้งหมด + marker clustering
// ⚠️ Leaflet ไม่รองรับ SSR → ต้อง dynamic import ด้วย ssr: false
// อยู่ตรงกลางของ 3-panel layout
// =============================================================

"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { PropertyWithStats, PropertyZone } from "@/types";
import { mapConfig } from "@/config/map";

type MapViewProps = {
  properties: PropertyWithStats[];
  selectedId: string | null;
  onSelect: (property: PropertyWithStats) => void;
  activeZone?: PropertyZone | "all";
  visible?: boolean;
};

// Zone bounds สำหรับ flyToBounds เมื่อเลือกโซน
const zoneBounds: Record<string, [[number, number], [number, number]]> = {
  bangsaen: [[13.25, 100.85], [13.35, 100.95]],
  pattaya: [[12.85, 100.82], [12.98, 100.92]],
  sattahip: [[12.60, 100.85], [12.75, 100.95]],
  rayong: [[12.60, 101.25], [12.75, 101.45]],
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
          background: #E8622A;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
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
          background: white;
          color: #1F2937;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          margin-top: 2px;
          white-space: nowrap;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: 'Noto Sans Thai', sans-serif;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          ${isSelected ? "font-weight: bold; background: #E8622A; color: white;" : ""}
        ">${name}</div>
      </div>
    `,
    iconSize: [size + 80, size + 20],
    iconAnchor: [(size + 80) / 2, size],
    popupAnchor: [0, -size],
  });
}

function toFiniteCoordinate(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export default function MapView({
  properties,
  selectedId,
  onSelect,
  activeZone,
  visible = true,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    async function initMap() {
      const L = (await import("leaflet")).default;
      // @ts-ignore - leaflet.markercluster augments L
      await import("leaflet.markercluster");

      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current).setView(
        [mapConfig.defaultCenter.lat, mapConfig.defaultCenter.lng],
        mapConfig.defaultZoom
      );

      L.tileLayer(mapConfig.tileUrl, {
        attribution: mapConfig.tileAttribution,
      }).addTo(map);

      mapInstanceRef.current = map;

      // ถ้า init ตอน element เพิ่งโผล่บนจอ ให้ Leaflet คำนวณขนาดอีกครั้ง
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    }

    initMap();

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      clusterGroupRef.current = null;
    };
  }, []);

  // --- อัปเดต Markers ด้วย clustering เมื่อ properties เปลี่ยน ---
  useEffect(() => {
    async function updateMarkers() {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;
      if (!map) return;

      // ลบ cluster group เดิม
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }

      // สร้าง MarkerClusterGroup
      const clusterGroup = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
        spiderfyDistanceMultiplier: 2,
        iconCreateFunction: (cluster: { getChildCount: () => number }) => {
          const count = cluster.getChildCount();
          let size = "small";
          let dim = 36;
          if (count >= 10) { size = "large"; dim = 48; }
          else if (count >= 5) { size = "medium"; dim = 42; }

          return L.divIcon({
            html: `<div style="
              width: ${dim}px;
              height: ${dim}px;
              background: #E8622A;
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${size === "large" ? "16px" : size === "medium" ? "14px" : "13px"};
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            ">${count}</div>`,
            className: "custom-cluster-icon",
            iconSize: L.point(dim, dim),
          });
        },
      });

      properties.forEach((property) => {
        const latitude = toFiniteCoordinate(property.latitude);
        const longitude = toFiniteCoordinate(property.longitude);
        if (latitude === null || longitude === null) return;

        const isSelected = property.id === selectedId;
        const icon = createPinIcon(L, property.name, isSelected);

        const marker = L.marker([latitude, longitude], {
          icon,
          zIndexOffset: isSelected ? 1000 : 0,
        });

        marker.on("click", () => onSelect(property));
        clusterGroup.addLayer(marker);
      });

      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
    }

    updateMarkers();
  }, [properties, selectedId, onSelect]);

  // --- Pan to selected property ---
  useEffect(() => {
    if (!selectedId || !mapInstanceRef.current) return;

    const selected = properties.find((p) => p.id === selectedId);
    const latitude = toFiniteCoordinate(selected?.latitude);
    const longitude = toFiniteCoordinate(selected?.longitude);

    if (latitude === null || longitude === null) return;

    const container = mapInstanceRef.current.getContainer();
    const hasSize = container.clientWidth > 0 && container.clientHeight > 0;
    if (!hasSize) return;

    mapInstanceRef.current.invalidateSize();
    mapInstanceRef.current.flyTo(
      [latitude, longitude],
      mapConfig.selectedZoom,
      { duration: 0.8 }
    );
  }, [selectedId, properties]);

  // --- เมื่อแท็บแผนที่ถูกเปิดบนมือถือ ให้ Leaflet คำนวณขนาดใหม่ ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !visible) return;

    const timeoutId = window.setTimeout(() => {
      map.invalidateSize();
    }, 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [visible]);

  // --- Zone scoping: flyToBounds เมื่อเปลี่ยนโซน ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const container = map.getContainer();
    const hasSize = container.clientWidth > 0 && container.clientHeight > 0;

    // ถ้า map ถูกซ่อนอยู่ (เช่น mobile tab ที่ยังไม่เปิด) ให้ข้ามก่อน
    // เพื่อป้องกัน Leaflet คำนวณ center/bounds แล้วได้ NaN
    if (!hasSize) return;

    map.invalidateSize();

    if (activeZone && activeZone !== "all" && zoneBounds[activeZone]) {
      const bounds = zoneBounds[activeZone];

      const [[southLat, westLng], [northLat, eastLng]] = bounds;
      const isValidBounds =
        Number.isFinite(southLat) &&
        Number.isFinite(westLng) &&
        Number.isFinite(northLat) &&
        Number.isFinite(eastLng);

      if (!isValidBounds) return;

      map.flyToBounds(bounds, { duration: 0.8, padding: [30, 30] });
    } else if (activeZone === "all") {
      // กลับไปมุมมองเริ่มต้น
      map.flyTo(
        [mapConfig.defaultCenter.lat, mapConfig.defaultCenter.lng],
        mapConfig.defaultZoom,
        { duration: 0.8 }
      );
    }
  }, [activeZone, visible]);

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
