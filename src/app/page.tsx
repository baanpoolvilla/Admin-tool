// =============================================================
// app/page.tsx — Public Dashboard (3-Panel Layout)
// หน้าหลักแสดงข้อมูลบ้านพัก:
//   ซ้าย:  PropertyList  → รายการบ้าน + filter
//   กลาง: MapView        → แผนที่ Leaflet
//   ขวา:  CalendarView   → ปฏิทินว่าง/จอง + ราคา
// =============================================================

"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import PropertyList from "@/components/public/PropertyList";
import CalendarView from "@/components/public/CalendarView";
import { useProperties } from "@/hooks/useProperties";
import { useAvailability } from "@/hooks/useAvailability";
import type { PropertyWithStats } from "@/types";

// Dynamic import MapView — Leaflet ไม่รองรับ SSR
const MapView = dynamic(() => import("@/components/public/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-surface text-text-secondary">
      กำลังโหลดแผนที่...
    </div>
  ),
});

export default function PublicDashboard() {
  // --- State: property ที่เลือกอยู่ ---
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyWithStats | null>(null);

  // --- Data Fetching ---
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { availability, isLoading: availabilityLoading } = useAvailability(
    selectedProperty?.id || null
  );

  // --- Handler: เลือก property ---
  const handleSelectProperty = useCallback((property: PropertyWithStats) => {
    setSelectedProperty(property);
  }, []);

  // --- State สำหรับ mobile tab ---
  const [mobileTab, setMobileTab] = useState<"list" | "map" | "calendar">("list");

  return (
    <div className="h-screen flex flex-col">
      {/* --- Top Bar --- */}
      <header className="bg-surface border-b border-white/5 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-text-primary font-bold text-lg md:text-xl">
          🏠 Villa Dashboard
        </h1>
        <a
          href="/admin/login"
          className="text-text-secondary text-sm hover:text-accent transition-colors"
        >
          Admin →
        </a>
      </header>

      {/* --- Mobile Tab Bar (แสดงเฉพาะบนมือถือ) --- */}
      <div className="md:hidden bg-surface border-b border-white/5 flex">
        <button
          onClick={() => setMobileTab("list")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mobileTab === "list" ? "text-accent border-b-2 border-accent" : "text-text-secondary"
          }`}
        >
          📋 รายการ
        </button>
        <button
          onClick={() => setMobileTab("map")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mobileTab === "map" ? "text-accent border-b-2 border-accent" : "text-text-secondary"
          }`}
        >
          🗺️ แผนที่
        </button>
        <button
          onClick={() => setMobileTab("calendar")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mobileTab === "calendar" ? "text-accent border-b-2 border-accent" : "text-text-secondary"
          }`}
        >
          📅 ปฏิทิน
        </button>
      </div>

      {/* --- Desktop: 3-Panel Layout / Mobile: Tab Content --- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel ซ้าย: รายการบ้าน */}
        <aside className={`${
          mobileTab === "list" ? "flex" : "hidden"
        } md:flex w-full md:w-80 bg-surface md:border-r border-white/5 overflow-hidden shrink-0 flex-col`}>
          <PropertyList
            properties={properties}
            selectedId={selectedProperty?.id || null}
            onSelect={(property) => {
              handleSelectProperty(property);
              // บนมือถือ: เลือกบ้านแล้วไปหน้าปฏิทิน
              if (window.innerWidth < 768) {
                setMobileTab("calendar");
              }
            }}
            isLoading={propertiesLoading}
          />
        </aside>

        {/* Panel กลาง: แผนที่ */}
        <main className={`${
          mobileTab === "map" ? "flex" : "hidden"
        } md:flex flex-1 relative`}>
          <MapView
            properties={properties}
            selectedId={selectedProperty?.id || null}
            onSelect={(property) => {
              handleSelectProperty(property);
              // บนมือถือ: เลือกบ้านแล้วไปหน้าปฏิทิน
              if (window.innerWidth < 768) {
                setMobileTab("calendar");
              }
            }}
          />
        </main>

        {/* Panel ขวา: ปฏิทิน + ราคา */}
        <aside className={`${
          mobileTab === "calendar" ? "flex" : "hidden"
        } md:flex w-full md:w-96 bg-surface md:border-l border-white/5 overflow-hidden shrink-0 flex-col`}>
          <CalendarView
            property={selectedProperty}
            availability={availability}
            isLoading={availabilityLoading}
          />
        </aside>
      </div>
    </div>
  );
}
