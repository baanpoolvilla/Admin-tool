// =============================================================
// app/admin/properties/page.tsx — Property List (Admin)
// ตารางแสดง properties ทั้งหมด + actions (Edit, Delete, Toggle)
// =============================================================

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProperties } from "@/hooks/useProperties";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdminPropertiesPage() {
  const { properties, isLoading, mutate } = useProperties();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProperties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return properties;

    return properties.filter((property) => {
      const matchName = property.name.toLowerCase().includes(query);
      const matchCode = property.property_code?.toLowerCase().includes(query);
      return matchName || Boolean(matchCode);
    });
  }, [properties, searchQuery]);

  const getZoneLabel = (zone: string | null) => {
    if (zone === "bangsaen") return "บางแสน";
    if (zone === "pattaya") return "พัทยา";
    if (zone === "sattahip") return "สัตหีบ";
    if (zone === "rayong") return "ระยอง";
    return "-";
  };

  // --- Toggle Active ---
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await fetch(`/api/properties/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !currentActive }),
    });
    mutate();
  };

  // --- Delete ---
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ต้องการลบ "${name}" หรือไม่?`)) return;
    await fetch(`/api/properties/${id}`, { method: "DELETE" });
    mutate();
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            จัดการบ้านพัก
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {searchQuery ? `${filteredProperties.length}/${properties.length}` : properties.length} รายการ
          </p>
        </div>
        <div className="w-full md:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อบ้าน หรือ รหัสบ้าน"
            className="w-full px-3 py-2 bg-card border border-gray-200 rounded-lg text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:border-accent"
          />
        </div>
        <a
          href="/admin/properties/new"
          className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          + เพิ่มบ้านใหม่
        </a>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 text-text-secondary text-sm font-medium">
                  ชื่อ
                </th>
                <th className="text-left p-4 text-text-secondary text-sm font-medium">
                  รหัส
                </th>
                <th className="text-left p-4 text-text-secondary text-sm font-medium">
                  โซน
                </th>
                <th className="text-left p-4 text-text-secondary text-sm font-medium">
                  ห้องนอน
                </th>
                <th className="text-left p-4 text-text-secondary text-sm font-medium">
                  ราคาฐาน
                </th>
                <th className="text-left p-4 text-text-secondary text-sm font-medium">
                  วันว่าง
                </th>
                <th className="text-left p-4 text-text-secondary text-sm font-medium">
                  สถานะ
                </th>
                <th className="text-right p-4 text-text-secondary text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((property) => (
                <tr
                  key={property.id}
                  className="border-b border-gray-200 hover:bg-card/50 transition-colors"
                >
                  {/* ชื่อ */}
                  <td className="p-4">
                    <div>
                      <p className="text-text-primary font-medium text-sm">
                        {property.name}
                      </p>
                      {property.source_url && (
                        <p className="text-text-secondary text-xs truncate max-w-[200px]">
                          {property.source_url}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* รหัสบ้าน */}
                  <td className="p-4 text-text-primary text-sm">
                    {property.property_code || <span className="text-text-secondary">-</span>}
                  </td>

                  {/* โซน */}
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-card text-text-secondary">
                      {getZoneLabel(property.zone)}
                    </span>
                  </td>

                  {/* ห้องนอน */}
                  <td className="p-4 text-text-primary text-sm">
                    {property.bedrooms}
                  </td>

                  {/* ราคาฐาน */}
                  <td className="p-4 text-text-primary text-sm">
                    {formatPrice(property.base_price)}
                  </td>

                  {/* วันว่าง */}
                  <td className="p-4">
                    <span
                      className={`text-sm font-medium ${
                        property.available_days > 0
                          ? "text-available"
                          : "text-booked"
                      }`}
                    >
                      {property.available_days} วัน
                    </span>
                  </td>

                  {/* สถานะ Active */}
                  <td className="p-4">
                    <button
                      onClick={() =>
                        handleToggleActive(property.id, property.is_active)
                      }
                      className={`px-2 py-1 rounded-full text-xs ${
                        property.is_active
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {property.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right space-x-2">
                    <Link
                      href={`/admin/properties/${property.id}`}
                      className="text-accent hover:text-accent/80 text-sm"
                    >
                      แก้ไข
                    </Link>
                    <button
                      onClick={() => handleDelete(property.id, property.name)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProperties.length === 0 && (
            <p className="text-text-secondary text-sm text-center py-12">
              {properties.length === 0 ? (
                <>
                  ยังไม่มีบ้านพัก —{" "}
                  <a href="/admin/properties/new" className="text-accent">
                    เพิ่มบ้านใหม่
                  </a>
                </>
              ) : (
                "ไม่พบบ้านพักตามคำค้นหา"
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
