// =============================================================
// app/admin/properties/[id]/page.tsx — Edit Property
// ฟอร์มแก้ไขข้อมูลบ้านพัก (โหลดข้อมูลจาก API)
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { generateSlug } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { PropertySource, PropertyZone, Property } from "@/types";

type PartnerOption = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
};

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [partnerId, setPartnerId] = useState<string>("");
  const [partnerError, setPartnerError] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    property_code: "",
    source: "manual" as PropertySource,
    zone: "" as string,
    source_url: "",
    source_property_id: "",
    description: "",
    address: "",
    location: "",
    max_guests: "10",
    extra_guests: "0",
    bedrooms: "1",
    bathrooms: "1",
    base_price: "",
    pets_allowed: false,
    thumbnail_url: "",
    is_active: true,
    price_markup: "",
    detail_url: "",
  });

  // --- โหลดข้อมูล property ---
  useEffect(() => {
    if (!id) return;

    async function loadProperty() {
      const res = await fetch(`/api/properties/${id}`);
      if (!res.ok) {
        setError("ไม่พบข้อมูลบ้านพัก");
        setIsLoading(false);
        return;
      }
      const data: Property = await res.json();

      setForm({
        name: data.name,
        slug: data.slug,
        property_code: data.property_code || "",
        source: data.source,
        zone: data.zone || "",
        source_url: data.source_url || "",
        source_property_id: data.source_property_id || "",
        description: data.description || "",
        address: data.address || "",
        location: data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : "",
        max_guests: data.max_guests.toString(),
        extra_guests: data.extra_guests?.toString() || "0",
        bedrooms: data.bedrooms.toString(),
        bathrooms: data.bathrooms.toString(),
        base_price: data.base_price?.toString() || "",
        pets_allowed: data.pets_allowed ?? false,
        thumbnail_url: data.thumbnail_url || "",
        is_active: data.is_active,
        price_markup: data.price_markup?.toString() || "",
        detail_url: data.detail_url || "",
      });
      setPartnerId(data.partner_id || "");
      setIsLoading(false);
    }
    loadProperty();
  }, [id]);

  // --- โหลดรายชื่อ partners ---
  useEffect(() => {
    fetch("/api/admin/partners")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPartners(data);
        } else if (data.error) {
          setPartnerError(data.error);
        }
      })
      .catch((e) => setPartnerError(String(e)));
  }, []);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name, slug: generateSlug(name) }));
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const payload = {
      name: form.name,
      slug: form.slug,
      property_code: form.property_code || null,
      source: form.source,
      zone: form.zone || null,
      source_url: form.source_url || null,
      source_property_id: form.source_property_id || null,
      description: form.description || null,
      address: form.address || null,
      latitude: form.location ? parseFloat(form.location.split(",")[0].trim()) : null,
      longitude: form.location ? parseFloat(form.location.split(",")[1]?.trim()) : null,
      max_guests: parseInt(form.max_guests),
      extra_guests: parseInt(form.extra_guests) || 0,
      bedrooms: parseInt(form.bedrooms),
      bathrooms: parseInt(form.bathrooms),
      base_price: form.base_price ? parseFloat(form.base_price) : null,
      pets_allowed: form.pets_allowed,
      thumbnail_url: form.thumbnail_url || null,
      is_active: form.is_active,
      partner_id: partnerId || null,
      price_markup: form.price_markup ? parseFloat(form.price_markup) : null,
      detail_url: form.detail_url || null,
    };

    const res = await fetch(`/api/properties/${id}`, {
      method: "PUT",
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

  if (isLoading) return <LoadingSpinner size="lg" />;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        แก้ไขบ้านพัก
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-surface rounded-xl border border-gray-200 p-6 space-y-6"
      >
        {/* --- ข้อมูลหลัก --- */}
        <fieldset>
          <legend className="text-text-primary font-semibold text-sm mb-4 border-b border-gray-200 pb-2 w-full">
            ข้อมูลหลัก
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-text-secondary text-sm mb-1">ชื่อบ้าน *</label>
              <input type="text" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div className="col-span-2">
              <label className="block text-text-secondary text-sm mb-1">Slug *</label>
              <input type="text" required value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">โซน *</label>
              <select value={form.zone} onChange={(e) => setForm((prev) => ({ ...prev, zone: e.target.value }))} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent">
                <option value="">-- เลือกโซน --</option>
                <option value="bangsaen">บางแสน</option>
                <option value="pattaya">พัทยา</option>
                <option value="sattahip">สัตหีบ</option>
                <option value="rayong">ระยอง</option>
              </select>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">รหัสบ้าน</label>
              <input type="text" value={form.property_code} onChange={(e) => setForm((prev) => ({ ...prev, property_code: e.target.value }))} placeholder="BPV-001" className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">รหัสเว็บต้นทาง</label>
              <input type="text" value={form.source_property_id} onChange={(e) => setForm((prev) => ({ ...prev, source_property_id: e.target.value }))} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div className="col-span-2">
              <label className="block text-text-secondary text-sm mb-1">URL ต้นทาง</label>
              <input type="url" value={form.source_url} onChange={(e) => setForm((prev) => ({ ...prev, source_url: e.target.value }))} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
            </div>
          </div>
        </fieldset>

        {/* --- รายละเอียด --- */}
        <fieldset>
          <legend className="text-text-primary font-semibold text-sm mb-4 border-b border-gray-200 pb-2 w-full">
            รายละเอียด
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-text-secondary text-sm mb-1">คำอธิบาย</label>
              <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent resize-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-text-secondary text-sm mb-1">ที่อยู่</label>
              <input type="text" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div className="col-span-2">
              <label className="block text-text-secondary text-sm mb-1">ตำแหน่งหมุด (lat, lng)</label>
              <input type="text" placeholder="12.879930, 100.976737" value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
            </div>
          </div>
        </fieldset>

        {/* --- ราคา & ห้อง --- */}
        <fieldset>
          <legend className="text-text-primary font-semibold text-sm mb-4 border-b border-gray-200 pb-2 w-full">
            ราคา & ห้อง
          </legend>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1">ราคาฐาน (฿/คืน)</label>
              <input type="number" value={form.base_price} onChange={(e) => setForm((prev) => ({ ...prev, base_price: e.target.value }))} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">ผู้เข้าพักสูงสุด</label>
              <input type="number" value={form.max_guests} onChange={(e) => setForm((prev) => ({ ...prev, max_guests: e.target.value }))} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">ห้องนอน</label>
              <input type="number" value={form.bedrooms} onChange={(e) => setForm((prev) => ({ ...prev, bedrooms: e.target.value }))} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">ห้องน้ำ</label>
              <input type="number" value={form.bathrooms} onChange={(e) => setForm((prev) => ({ ...prev, bathrooms: e.target.value }))} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">เสริมกี่คน</label>
              <input type="number" value={form.extra_guests} onChange={(e) => setForm((prev) => ({ ...prev, extra_guests: e.target.value }))} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div className="col-span-2 lg:col-span-4 flex items-center gap-3">
              <input type="checkbox" id="pets_allowed" checked={form.pets_allowed} onChange={(e) => setForm((prev) => ({ ...prev, pets_allowed: e.target.checked }))} className="w-4 h-4 accent-accent" />
              <label htmlFor="pets_allowed" className="text-text-primary text-sm">🐾 รับสัตว์เลี้ยง</label>
            </div>
          </div>
        </fieldset>

        {/* --- รูปภาพ + Active --- */}
        <div>
          <label className="block text-text-secondary text-sm mb-1">Thumbnail URL</label>
          <input type="url" value={form.thumbnail_url} onChange={(e) => setForm((prev) => ({ ...prev, thumbnail_url: e.target.value }))} className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" />
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 accent-accent" />
          <label htmlFor="is_active" className="text-text-primary text-sm">เปิดใช้งาน (Active)</label>
        </div>

        {/* --- ราคาบวกเพิ่ม & ลิงก์รายละเอียด --- */}
        <fieldset>
          <legend className="text-text-primary font-semibold text-sm mb-4 border-b border-gray-200 pb-2 w-full">
            หน้าแชร์ & ลิงก์
          </legend>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1">ราคาบวกเพิ่ม (฿) - บวกทุกวัน</label>
              <input 
                type="number" 
                value={form.price_markup} 
                onChange={(e) => setForm((prev) => ({ ...prev, price_markup: e.target.value }))} 
                placeholder="0" 
                className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" 
              />
              <p className="text-xs text-text-secondary mt-1">
                ราคาที่แสดงในหน้าแชร์ = ราคาจริง + ราคาบวกเพิ่ม
              </p>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">ลิงก์รายละเอียด</label>
              <input 
                type="url" 
                value={form.detail_url} 
                onChange={(e) => setForm((prev) => ({ ...prev, detail_url: e.target.value }))} 
                placeholder="https://..." 
                className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent" 
              />
              <p className="text-xs text-text-secondary mt-1">
                ลิงก์ไปยังหน้ารายละเอียดภายนอก (เช่น Facebook, Line)
              </p>
            </div>
          </div>
        </fieldset>

        {/* --- Partner Assignment --- */}
        <fieldset>
          <legend className="text-text-primary font-semibold text-sm mb-4 border-b border-gray-200 pb-2 w-full">
            พาร์ทเนอร์
          </legend>
          <div>
            <label className="block text-text-secondary text-sm mb-1">เลือกพาร์ทเนอร์</label>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full px-4 py-2 bg-card border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">-- ไม่มีพาร์ทเนอร์ --</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name || p.email || p.id} ({p.role})
                </option>
              ))}
            </select>
            {partnerError && (
              <p className="text-red-600 text-xs mt-1">❌ โหลด partners ไม่ได้: {partnerError}</p>
            )}
            {!partnerError && partners.length === 0 && (
              <p className="text-text-secondary text-xs mt-1">ยังไม่มี partner ในระบบ (ตรวจสอบ Supabase profiles table)</p>
            )}
            <p className="text-xs text-text-secondary mt-1">
              เลือก partner ที่จะมีสิทธิ์แก้ไขบ้านพักนี้
            </p>
          </div>
        </fieldset>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors">
            {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <a href="/admin/properties" className="px-6 py-2.5 bg-card text-text-secondary rounded-lg hover:bg-card/80 transition-colors">ยกเลิก</a>
        </div>
      </form>
    </div>
  );
}
