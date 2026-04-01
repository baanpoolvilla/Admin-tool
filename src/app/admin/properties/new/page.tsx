// =============================================================
// app/admin/properties/new/page.tsx — Add New Property
// ฟอร์มเพิ่มบ้านพักใหม่
// =============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateSlug } from "@/lib/utils";
import type { PropertySource, PropertyZone } from "@/types";

export default function NewPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- Form State ---
  const [form, setForm] = useState({
    name: "",
    slug: "",
    source: "manual" as PropertySource,
    zone: "" as string,
    source_url: "",
    source_property_id: "",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    max_guests: "10",
    bedrooms: "1",
    bathrooms: "1",
    base_price: "",
    thumbnail_url: "",
    is_active: true,
  });

  // --- Auto-generate slug จากชื่อ ---
  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const payload = {
      name: form.name,
      slug: form.slug,
      source: form.source,
      zone: form.zone || null,
      source_url: form.source_url || null,
      source_property_id: form.source_property_id || null,
      description: form.description || null,
      address: form.address || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      max_guests: parseInt(form.max_guests),
      bedrooms: parseInt(form.bedrooms),
      bathrooms: parseInt(form.bathrooms),
      base_price: form.base_price ? parseFloat(form.base_price) : null,
      thumbnail_url: form.thumbnail_url || null,
      is_active: form.is_active,
    };

    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "เกิดข้อผิดพลาด");
      setIsSubmitting(false);
      return;
    }

    router.push("/admin/properties");
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        เพิ่มบ้านพักใหม่
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-surface rounded-xl border border-white/5 p-6 space-y-6"
      >
        {/* --- ข้อมูลหลัก --- */}
        <fieldset>
          <legend className="text-text-primary font-semibold text-sm mb-4 border-b border-white/5 pb-2 w-full">
            ข้อมูลหลัก
          </legend>

          <div className="grid grid-cols-2 gap-4">
            {/* ชื่อ */}
            <div className="col-span-2">
              <label className="block text-text-secondary text-sm mb-1">
                ชื่อบ้าน *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
                placeholder="Pool Villa Pattaya"
              />
            </div>

            {/* Slug */}
            <div className="col-span-2">
              <label className="block text-text-secondary text-sm mb-1">
                Slug * (auto-generated)
              </label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            {/* Zone */}
            <div>
              <label className="block text-text-secondary text-sm mb-1">
                โซน *
              </label>
              <select
                value={form.zone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    zone: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">-- เลือกโซน --</option>
                <option value="bangsaen">บางแสน</option>
                <option value="pattaya">พัทยา</option>
                <option value="sattahip">สัตหีบ</option>
                <option value="rayong">ระยอง</option>
              </select>
            </div>

            {/* Source Property ID */}
            <div>
              <label className="block text-text-secondary text-sm mb-1">
                รหัสบ้านในเว็บต้นทาง
              </label>
              <input
                type="text"
                value={form.source_property_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    source_property_id: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
                placeholder="2304"
              />
            </div>

            {/* Source URL */}
            <div className="col-span-2">
              <label className="block text-text-secondary text-sm mb-1">
                URL ต้นทาง (สำหรับ scraper)
              </label>
              <input
                type="url"
                value={form.source_url}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, source_url: e.target.value }))
                }
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
                placeholder="https://www.devillegroups.com/acld/?s=2304"
              />
            </div>
          </div>
        </fieldset>

        {/* --- รายละเอียด --- */}
        <fieldset>
          <legend className="text-text-primary font-semibold text-sm mb-4 border-b border-white/5 pb-2 w-full">
            รายละเอียด
          </legend>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-text-secondary text-sm mb-1">
                คำอธิบาย
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-text-secondary text-sm mb-1">
                ที่อยู่
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: e.target.value }))
                }
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, latitude: e.target.value }))
                }
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
                placeholder="12.9236"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, longitude: e.target.value }))
                }
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
                placeholder="100.8825"
              />
            </div>
          </div>
        </fieldset>

        {/* --- ราคา & ห้อง --- */}
        <fieldset>
          <legend className="text-text-primary font-semibold text-sm mb-4 border-b border-white/5 pb-2 w-full">
            ราคา & ห้อง
          </legend>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1">
                ราคาฐาน (฿/คืน)
              </label>
              <input
                type="number"
                value={form.base_price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, base_price: e.target.value }))
                }
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                ผู้เข้าพักสูงสุด
              </label>
              <input
                type="number"
                value={form.max_guests}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, max_guests: e.target.value }))
                }
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                ห้องนอน
              </label>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bedrooms: e.target.value }))
                }
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                ห้องน้ำ
              </label>
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bathrooms: e.target.value }))
                }
                className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </fieldset>

        {/* --- รูปภาพ --- */}
        <fieldset>
          <legend className="text-text-primary font-semibold text-sm mb-4 border-b border-white/5 pb-2 w-full">
            รูปภาพ
          </legend>

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              Thumbnail URL
            </label>
            <input
              type="url"
              value={form.thumbnail_url}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, thumbnail_url: e.target.value }))
              }
              className="w-full px-4 py-2 bg-card border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
        </fieldset>

        {/* --- Active toggle --- */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, is_active: e.target.checked }))
            }
            className="w-4 h-4 accent-accent"
          />
          <label htmlFor="is_active" className="text-text-primary text-sm">
            เปิดใช้งาน (Active)
          </label>
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <a
            href="/admin/properties"
            className="px-6 py-2.5 bg-card text-text-secondary rounded-lg hover:bg-card/80 transition-colors"
          >
            ยกเลิก
          </a>
        </div>
      </form>
    </div>
  );
}
