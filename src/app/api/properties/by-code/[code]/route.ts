// =============================================================
// app/api/properties/by-code/[code]/route.ts — Lookup by property_code
// GET → ดึงข้อมูลบ้านจาก property_code (public)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { today, daysFromNow } from "@/lib/utils";

type RouteParams = { params: Promise<{ code: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const normalizedCode = code.trim();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!supabaseUrl || supabaseUrl.includes("your-project") || supabaseUrl.includes("xxxx")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createServerSupabaseClient();

  const { data: propertyByCode } = await supabase
    .from("properties")
    .select("*")
    .eq("is_active", true)
    .ilike("property_code", normalizedCode)
    .maybeSingle();

  let property = propertyByCode;

  // fallback: รองรับลิงก์ที่ส่ง id มาตรงๆ
  if (!property) {
    const { data: propertyById } = await supabase
      .from("properties")
      .select("*")
      .eq("id", normalizedCode)
      .eq("is_active", true)
      .maybeSingle();
    property = propertyById;
  }

  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // เพิ่ม availability stats
  const todayStr = today();
  const endStr = daysFromNow(60);

  const { data: availability } = await supabase
    .from("availability")
    .select("date, status, price")
    .eq("property_id", property.id)
    .gte("date", todayStr)
    .lte("date", endStr);

  const available = availability?.filter((a) => a.status === "available") || [];
  const prices = available
    .map((a) => a.price)
    .filter((p): p is number => p !== null);

  return NextResponse.json({
    ...property,
    available_days: available.length,
    total_days: availability?.length || 0,
    avg_price: prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : null,
    min_price: prices.length > 0
      ? Math.min(...prices)
      : null,
    is_available_today: availability?.find((a) => a.date === todayStr)?.status === "available",
  });
}
