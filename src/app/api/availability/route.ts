// =============================================================
// app/api/availability/route.ts — Availability API
// GET  → ดึงข้อมูลวันว่าง/จอง ตาม property_id + ช่วงวัน
// POST → เพิ่ม/อัปเดตวันว่าง (Manual entry, ต้อง login)
// DELETE → ลบ entry (ต้อง login)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

// --- GET: ดึง Availability ---
// Query params: ?property_id=xxx&from=2025-03-01&to=2025-04-30
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);

  const propertyId = searchParams.get("property_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!propertyId) {
    return NextResponse.json(
      { error: "property_id is required" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("availability")
    .select("*")
    .eq("property_id", propertyId)
    .order("date", { ascending: true });

  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// --- POST: Upsert Availability (Manual) ---
// Body: { property_id, date, status, price?, notes? }
// หรือ Body: { property_id, dates: [...], status, price? } (bulk)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // ตรวจสอบ authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.property_id) {
    return NextResponse.json({ error: "property_id is required" }, { status: 400 });
  }

  const adminClient = createServiceRoleClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "partner";

  if (role !== "admin") {
    const { data: property } = await adminClient
      .from("properties")
      .select("id, partner_id")
      .eq("id", body.property_id)
      .single();

    if (!property || property.partner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // รองรับทั้ง single date และ bulk dates
  const entries = body.dates
    ? body.dates.map((date: string) => ({
        property_id: body.property_id,
        date,
        status: body.status,
        price: body.price ?? null,
        source: "manual" as const,
        notes: body.notes ?? null,
      }))
    : [
        {
          property_id: body.property_id,
          date: body.date,
          status: body.status,
          price: body.price ?? null,
          source: "manual" as const,
          notes: body.notes ?? null,
        },
      ];

  const { data, error } = await supabase
    .from("availability")
    .upsert(entries, { onConflict: "property_id,date" })
    .select();

  // บางโปรเจกต์ยังไม่มี unique constraint ที่รองรับ onConflict(property_id,date)
  // fallback เป็น update ก่อน แล้ว insert เมื่อยังไม่มี row
  if (error && error.message.includes("ON CONFLICT specification")) {
    const fallbackRows: unknown[] = [];

    for (const entry of entries) {
      const { data: updatedRows, error: updateError } = await supabase
        .from("availability")
        .update({
          status: entry.status,
          price: entry.price,
          source: entry.source,
          notes: entry.notes,
        })
        .eq("property_id", entry.property_id)
        .eq("date", entry.date)
        .select();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      if (updatedRows && updatedRows.length > 0) {
        fallbackRows.push(...updatedRows);
        continue;
      }

      const { data: insertedRow, error: insertError } = await supabase
        .from("availability")
        .insert(entry)
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      fallbackRows.push(insertedRow);
    }

    return NextResponse.json(fallbackRows);
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// --- DELETE: ลบ Availability Entry ---
// Query params: ?property_id=xxx&date=2025-03-28
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);

  // ตรวจสอบ authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const propertyId = searchParams.get("property_id");
  const date = searchParams.get("date");

  if (!propertyId || !date) {
    return NextResponse.json(
      { error: "property_id and date are required" },
      { status: 400 }
    );
  }

  const adminClient = createServiceRoleClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "partner";

  if (role !== "admin") {
    const { data: property } = await adminClient
      .from("properties")
      .select("id, partner_id")
      .eq("id", propertyId)
      .single();

    if (!property || property.partner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("property_id", propertyId)
    .eq("date", date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
