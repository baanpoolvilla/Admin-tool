// GET /api/availability/all?from=YYYY-MM-DD&to=YYYY-MM-DD
// ดึงวันว่าง+ราคาของทุกบ้าน (public, ไม่ต้อง login)
//
// ตัวอย่าง: /api/availability/all
//           /api/availability/all?from=2026-06-14&to=2026-06-14

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { today, daysFromNow } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || today();
  const to = searchParams.get("to") || daysFromNow(60);

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

  const zoneThaiMap: Record<string, string> = {
    บางแสน: "bangsaen",
    พัทยา: "pattaya",
    สัตหีบ: "sattahip",
    ระยอง: "rayong",
  };
  const rawZone = searchParams.get("zone");
  const zone = rawZone
    ? (zoneThaiMap[rawZone] ?? rawZone)
    : null;

  const supabase = await createServerSupabaseClient();

  let propQuery = supabase
    .from("properties")
    .select("id, property_code, zone")
    .eq("is_active", true)
    .not("property_code", "is", null);

  if (zone) propQuery = propQuery.eq("zone", zone);

  const { data: properties, error: propError } = await propQuery;

  if (propError) {
    return NextResponse.json({ error: propError.message }, { status: 500 });
  }

  const { data: availability, error: availError } = await supabase
    .from("availability")
    .select("property_id, date, price")
    .eq("status", "available")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });

  if (availError) {
    return NextResponse.json({ error: availError.message }, { status: 500 });
  }

  // จัดกลุ่ม availability ตาม property_id
  const availMap: Record<string, { date: string; price: number | null }[]> = {};
  for (const row of availability || []) {
    if (!availMap[row.property_id]) availMap[row.property_id] = [];
    availMap[row.property_id].push({ date: row.date, price: row.price });
  }

  const result = (properties || []).map((p) => ({
    property_code: p.property_code,
    zone: p.zone,
    available_dates: availMap[p.id] || [],
  }));

  return NextResponse.json(result);
}
