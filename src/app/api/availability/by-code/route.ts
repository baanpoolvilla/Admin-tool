// =============================================================
// app/api/availability/by-code/route.ts
// GET → ดึงวันว่างของบ้านพักตาม property_code (public, ไม่ต้อง login)
//
// Query params:
//   code  (required) — property_code ของบ้าน เช่น "BPV001"
//   from  (optional) — วันเริ่มต้น YYYY-MM-DD  (default: วันนี้)
//   to    (optional) — วันสิ้นสุด YYYY-MM-DD   (default: 60 วันข้างหน้า)
//
// ตัวอย่าง: /api/availability/by-code?code=BPV001&from=2026-06-10&to=2026-07-31
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { today, daysFromNow } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const from = searchParams.get("from") || today();
  const to = searchParams.get("to") || daysFromNow(60);

  if (!code) {
    return NextResponse.json(
      { error: "code (property_code) is required" },
      { status: 400 }
    );
  }

  // ตรวจ format วันที่
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from) || !dateRegex.test(to)) {
    return NextResponse.json(
      { error: "from and to must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  if (from > to) {
    return NextResponse.json(
      { error: "from must be before or equal to to" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // หาบ้านจาก property_code
  const { data: property, error: propError } = await supabase
    .from("properties")
    .select("id, name, property_code, zone, base_price, price_markup, bedrooms, bathrooms, max_guests, thumbnail_url")
    .eq("property_code", code)
    .eq("is_active", true)
    .single();

  if (propError || !property) {
    return NextResponse.json(
      { error: `Property with code "${code}" not found` },
      { status: 404 }
    );
  }

  // ดึงวันว่างในช่วงที่กำหนด
  const { data: availability, error: availError } = await supabase
    .from("availability")
    .select("date, price")
    .eq("property_id", property.id)
    .eq("status", "available")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });

  if (availError) {
    return NextResponse.json({ error: availError.message }, { status: 500 });
  }

  const availableDates = (availability || []).map((row) => ({
    date: row.date,
    price: row.price,
  }));

  return NextResponse.json({
    property_code: property.property_code,
    zone: property.zone,
    available_dates: availableDates,
  });
}
