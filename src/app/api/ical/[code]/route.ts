// =============================================================
// app/api/ical/[code]/route.ts — iCal Export Feed (Public)
// GET → คืนไฟล์ .ics ที่มีวันที่ booked/blocked ของ property นั้น
//
// Smart Order (หรือระบบอื่น) นำ URL นี้ไปกรอกใน "ช่องทาง → iCal → นำเข้า"
// ตัวอย่าง URL: https://yourdomain.com/api/ical/BPV001
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateICal, groupConsecutiveDates } from "@/lib/ical";

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const supabase = createServiceRoleClient();

  const { data: property, error: propError } = await supabase
    .from("properties")
    .select("id, name, property_code")
    .eq("property_code", code)
    .eq("is_active", true)
    .single();

  if (propError || !property) {
    return new NextResponse("Property not found", { status: 404 });
  }

  const from = new Date().toISOString().split("T")[0];
  const to = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: rows, error: availError } = await supabase
    .from("availability")
    .select("date")
    .eq("property_id", property.id)
    .in("status", ["booked", "blocked"])
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });

  if (availError) {
    return new NextResponse("Failed to fetch availability", { status: 500 });
  }

  const dates = (rows || []).map((r) => r.date as string);
  const ranges = groupConsecutiveDates(dates);
  const icsText = generateICal(
    property.property_code ?? code,
    property.name,
    ranges
  );

  return new NextResponse(icsText, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${code}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
