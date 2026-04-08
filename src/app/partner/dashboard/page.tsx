// =============================================================
// app/partner/dashboard/page.tsx — Partner Dashboard
// แสดงภาพรวมบ้านพักของ partner
// =============================================================

"use client";

import { useEffect, useState } from "react";

type PartnerProperty = {
  id: string;
  name: string;
  property_code: string | null;
  zone: string | null;
  is_active: boolean;
  base_price: number | null;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  thumbnail_url: string | null;
};

export default function PartnerDashboardPage() {
  const [properties, setProperties] = useState<PartnerProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/partner/properties")
      .then((res) => res.json())
      .then((data) => {
        setProperties(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const totalProperties = properties.length;
  const activeProperties = properties.filter((p) => p.is_active).length;

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Partner Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">ภาพรวมบ้านพักของคุณ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-text-secondary text-sm">บ้านพักทั้งหมด</p>
          <p className="text-3xl font-bold text-text-primary mt-2">
            {isLoading ? "..." : totalProperties}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-text-secondary text-sm">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {isLoading ? "..." : activeProperties}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-text-secondary text-sm">Inactive</p>
          <p className="text-3xl font-bold text-text-secondary mt-2">
            {isLoading ? "..." : totalProperties - activeProperties}
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/partner/properties"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-accent/50 hover:shadow-md transition-all shadow-sm"
        >
          <h3 className="text-text-primary font-semibold">🏠 จัดการบ้านพัก</h3>
          <p className="text-text-secondary text-sm mt-1">
            แก้ไขข้อมูลบ้านพักของคุณ
          </p>
        </a>

        <a
          href="/partner/calendar"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-accent/50 hover:shadow-md transition-all shadow-sm"
        >
          <h3 className="text-text-primary font-semibold">📅 จัดการปฏิทิน</h3>
          <p className="text-text-secondary text-sm mt-1">
            กำหนดวันว่าง และราคา
          </p>
        </a>

        <a
          href="/"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-accent/50 hover:shadow-md transition-all shadow-sm"
        >
          <h3 className="text-text-primary font-semibold">👁 ดูหน้า Public</h3>
          <p className="text-text-secondary text-sm mt-1">
            แผนที่ + ปฏิทิน
          </p>
        </a>
      </div>
    </div>
  );
}
