// =============================================================
// app/api/properties/route.ts — Properties API
// GET  → ดึงรายการบ้านทั้งหมด (public: เฉพาะ active, admin: ทั้งหมด)
// POST → สร้างบ้านใหม่ (ต้อง login)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { today, daysFromNow } from "@/lib/utils";
import type { Database } from "@/types/database";

// Mock data — ใช้เมื่อ Supabase ยังไม่ได้ตั้งค่า
const MOCK_PROPERTIES = [
  {
    id: "mock-001",
    name: "Villa Sunrise Pattaya",
    slug: "villa-sunrise-pattaya",
    property_code: null,
    source: "manual",
    source_url: null,
    source_property_id: null,
    description: "บ้านพักตากอากาศริมทะเล วิวสวย สระว่ายน้ำส่วนตัว",
    address: "ถ.พัทยาใต้ เมืองพัทยา ชลบุรี",
    latitude: 12.9236,
    longitude: 100.8825,
    max_guests: 10,
    extra_guests: 5,
    bedrooms: 3,
    bathrooms: 2,
    base_price: 5000,
    pets_allowed: true,
    thumbnail_url: null,
    images: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    available_days: 45,
    total_days: 60,
    avg_price: 5000,
    min_price: 3500,
    is_available_today: true,
  },
];

type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];

// --- GET: ดึงรายการ Properties ---
export async function GET(request: NextRequest) {
  // ถ้า Supabase ยังไม่ได้ตั้งค่า → คืน mock data ทันที
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!supabaseUrl || supabaseUrl.includes("your-project") || supabaseUrl.includes("xxxx")) {
    return NextResponse.json(MOCK_PROPERTIES);
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch {
    return NextResponse.json(MOCK_PROPERTIES);
  }
  const { searchParams } = new URL(request.url);

  // ตรวจสอบ role ของ user
  const { data: { user } } = await supabase.auth.getUser();
  let role: "admin" | "partner" | null = null;

  if (user) {
    const adminClient = createServiceRoleClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = (profile?.role as "admin" | "partner" | undefined) ?? "partner";
  }

  const isAdmin = role === "admin";
  const isPartner = role === "partner";

  // source filter (optional): ?source=deville
  const sourceFilter = searchParams.get("source");
  // date range filter (optional): ?available_from=2026-04-03&available_to=2026-04-05
  const availableFrom = searchParams.get("available_from");
  const availableTo = searchParams.get("available_to");

  // Query properties
  let query = supabase.from("properties").select("*");

  // Public user จะเห็นเฉพาะ active
  if (!user) {
    query = query.eq("is_active", true);
  }

  // Partner เห็นเฉพาะบ้านของตัวเอง
  if (isPartner && user) {
    query = query.eq("partner_id", user.id);
  }

  if (sourceFilter) {
    query = query.eq("source", sourceFilter);
  }

  query = query.order("name", { ascending: true });

  const { data: properties, error } = await query;

  if (error) {
    return NextResponse.json(MOCK_PROPERTIES);
  }

  // เพิ่มข้อมูลสรุป availability สำหรับแต่ละ property
  const todayStr = today();
  const endStr = daysFromNow(60);

  const propertiesWithStats = await Promise.all(
    (properties || []).map(async (property) => {
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
      const todayAvailability = availability?.find((a) => a.date === todayStr);

      const markup = typeof property.price_markup === "number" ? property.price_markup : 0;

      return {
        ...property,
        available_days: available.length,
        total_days: availability?.length || 0,
        avg_price: prices.length > 0
          ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) + markup
          : null,
        min_price: prices.length > 0
          ? Math.min(...prices) + markup
          : null,
        is_available_today: todayAvailability?.status === "available",
      };
    })
  );

  // --- Date range filter: filter properties available for ALL dates in range ---
  if (availableFrom && availableTo) {
    // Generate list of dates in range
    const rangeDates: string[] = [];
    const start = new Date(availableFrom);
    const end = new Date(availableTo);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      rangeDates.push(d.toISOString().split("T")[0]);
    }

    const filtered = propertiesWithStats.filter((property) => {
      // We need to check availability for the requested range
      // Re-use the already-fetched availability data if range is within 60 days
      return true; // placeholder - actual filtering below
    });

    // For each property, check if ALL dates in range are available
    const filteredWithRange = await Promise.all(
      propertiesWithStats.map(async (property) => {
        const { data: rangeAvail } = await supabase
          .from("availability")
          .select("date, status")
          .eq("property_id", property.id)
          .in("date", rangeDates);

        const availableDates = new Set(
          (rangeAvail || [])
            .filter((a) => a.status === "available")
            .map((a) => a.date)
        );

        const allAvailable = rangeDates.every((d) => availableDates.has(d));
        return allAvailable ? property : null;
      })
    );

    return NextResponse.json(filteredWithRange.filter(Boolean));
  }

  return NextResponse.json(propertiesWithStats);
}

// --- POST: สร้าง Property ใหม่ ---
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // ตรวจสอบ authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createServiceRoleClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: PropertyInsert = await request.json();

  const { data, error } = await supabase
    .from("properties")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
