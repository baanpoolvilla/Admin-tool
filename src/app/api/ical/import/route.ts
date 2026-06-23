// =============================================================
// app/api/ical/import/route.ts — iCal Import (Authenticated)
// POST → ดึง iCal จาก URL ภายนอก แล้ว upsert วันที่เป็น "booked"
//
// Body: { property_code: string, url: string }
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { parseICal, icalEventToDates } from "@/lib/ical";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.property_code || !body.url) {
    return NextResponse.json(
      { error: "property_code and url are required" },
      { status: 400 }
    );
  }

  const { property_code, url } = body as { property_code: string; url: string };

  // Validate URL — only http/https allowed
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("bad protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const adminClient = createServiceRoleClient();

  // หา property
  const { data: property, error: propError } = await adminClient
    .from("properties")
    .select("id, name, property_code, partner_id")
    .eq("property_code", property_code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (propError || !property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  // ตรวจ permission
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "partner";
  if (role !== "admin" && property.partner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch iCal feed
  let icalText: string;
  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: { "User-Agent": "VillaDashboard/1.0 iCal-Import" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `iCal fetch failed: HTTP ${res.status}` },
        { status: 400 }
      );
    }
    icalText = await res.text();
  } catch (err) {
    return NextResponse.json(
      { error: `Cannot reach iCal URL: ${err instanceof Error ? err.message : "timeout"}` },
      { status: 400 }
    );
  }

  // Parse + filter only future dates
  const events = parseICal(icalText);
  const todayStr = new Date().toISOString().split("T")[0];
  const allDates = new Set<string>();

  for (const event of events) {
    for (const date of icalEventToDates(event)) {
      if (date >= todayStr) allDates.add(date);
    }
  }

  if (allDates.size === 0) {
    return NextResponse.json({
      imported: 0,
      events: events.length,
      message: "ไม่พบวันที่ในอนาคตจาก iCal feed",
    });
  }

  // Upsert booked dates (ไม่ทับ price ที่มีอยู่)
  const entries = Array.from(allDates).map((date) => ({
    property_id: property.id,
    date,
    status: "booked" as const,
    source: "manual" as const,
    notes: `ical:${parsedUrl.hostname}`,
  }));

  const { error: upsertError } = await adminClient
    .from("availability")
    .upsert(entries, { onConflict: "property_id,date" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: allDates.size,
    events: events.length,
    message: `นำเข้าสำเร็จ ${allDates.size} วัน จาก ${events.length} รายการจอง`,
  });
}
