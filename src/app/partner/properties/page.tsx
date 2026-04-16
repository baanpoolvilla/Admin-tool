// =============================================================
// app/partner/properties/page.tsx — Partner Properties List
// แสดงรายการบ้านพักของ partner พร้อมแก้ไขได้
// =============================================================

"use client";

import { useEffect, useState } from "react";

type PartnerProperty = {
  id: string;
  name: string;
  property_code: string | null;
  zone: string | null;
  is_active: boolean;
  max_guests: number;
  extra_guests: number;
  bedrooms: number;
  bathrooms: number;
  pets_allowed: boolean;
  description: string | null;
  address: string | null;
  thumbnail_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function PartnerPropertiesPage() {
  const [properties, setProperties] = useState<PartnerProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PartnerProperty>>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = () => {
    fetch("/api/partner/properties")
      .then((res) => res.json())
      .then((data) => {
        setProperties(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  const handleEdit = (property: PartnerProperty) => {
    setEditingId(property.id);
    setEditForm({
      name: property.name,
      description: property.description,
      address: property.address,
      max_guests: property.max_guests,
      extra_guests: property.extra_guests,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      pets_allowed: property.pets_allowed,
    });
    setSaveStatus(null);
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaveStatus("กำลังบันทึก...");

    try {
      const res = await fetch(`/api/partner/properties/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setSaveStatus("บันทึกสำเร็จ!");
        setEditingId(null);
        fetchProperties();
      } else {
        const data = await res.json();
        setSaveStatus(`เกิดข้อผิดพลาด: ${data.error}`);
      }
    } catch {
      setSaveStatus("ไม่สามารถบันทึกได้");
    }
  };

  const zoneLabel: Record<string, string> = {
    bangsaen: "บางแสน",
    pattaya: "พัทยา",
    sattahip: "สัตหีบ",
    rayong: "ระยอง",
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">บ้านพักของฉัน</h1>
        <p className="text-text-secondary text-sm mt-1">
          แก้ไขข้อมูลบ้านพักที่คุณดูแล
        </p>
      </div>

      {saveStatus && (
        <div className="mb-4 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-accent">
          {saveStatus}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-accent border-t-transparent" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p className="text-4xl mb-4">🏠</p>
          <p>ยังไม่มีบ้านพักที่กำหนดให้คุณ</p>
          <p className="text-sm mt-1">โปรดติดต่อ Admin เพื่อเพิ่มบ้านพัก</p>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Property Header */}
              <div className="flex items-center gap-4 p-4">
                {/* Thumbnail */}
                <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
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
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {property.property_code && (
                      <span className="text-accent text-xs font-medium">
                        {property.property_code}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        property.is_active
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {property.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <h3 className="text-text-primary font-semibold truncate">
                    {property.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                    {property.zone && (
                      <span>📍 {zoneLabel[property.zone] || property.zone}</span>
                    )}
                    <span>🛏 {property.bedrooms}</span>
                    <span>🚿 {property.bathrooms}</span>
                    <span>👥 {property.max_guests}</span>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() =>
                    editingId === property.id
                      ? setEditingId(null)
                      : handleEdit(property)
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                    editingId === property.id
                      ? "bg-gray-100 text-text-secondary"
                      : "bg-accent text-white hover:bg-accent/90"
                  }`}
                >
                  {editingId === property.id ? "ยกเลิก" : "✏️ แก้ไข"}
                </button>
              </div>

              {/* Edit Form (collapsible) */}
              {editingId === property.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-text-secondary text-sm mb-1">
                        ชื่อบ้านพัก
                      </label>
                      <input
                        type="text"
                        value={editForm.name || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
                      />
                    </div>

                    {/* Max Guests */}
                    <div>
                      <label className="block text-text-secondary text-sm mb-1">
                        จำนวนคนสูงสุด
                      </label>
                      <input
                        type="number"
                        value={editForm.max_guests ?? ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            max_guests: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
                      />
                    </div>

                    {/* Extra Guests */}
                    <div>
                      <label className="block text-text-secondary text-sm mb-1">
                        คนเพิ่มเติม
                      </label>
                      <input
                        type="number"
                        value={editForm.extra_guests ?? ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            extra_guests: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
                      />
                    </div>

                    {/* Bedrooms */}
                    <div>
                      <label className="block text-text-secondary text-sm mb-1">
                        ห้องนอน
                      </label>
                      <input
                        type="number"
                        value={editForm.bedrooms ?? ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bedrooms: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
                      />
                    </div>

                    {/* Bathrooms */}
                    <div>
                      <label className="block text-text-secondary text-sm mb-1">
                        ห้องน้ำ
                      </label>
                      <input
                        type="number"
                        value={editForm.bathrooms ?? ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bathrooms: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
                      />
                    </div>

                    {/* Pets */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.pets_allowed || false}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            pets_allowed: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      <label className="text-text-secondary text-sm">
                        🐾 รับสัตว์เลี้ยง
                      </label>
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-text-secondary text-sm mb-1">
                        ที่อยู่
                      </label>
                      <input
                        type="text"
                        value={editForm.address || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, address: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-text-secondary text-sm mb-1">
                        รายละเอียด
                      </label>
                      <textarea
                        rows={3}
                        value={editForm.description || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent resize-none"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                    >
                      💾 บันทึก
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
