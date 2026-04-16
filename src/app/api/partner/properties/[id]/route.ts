// =============================================================
// api/partner/properties/[id]/route.ts — Partner Property Edit API
// PUT: แก้ไขบ้านพักเฉพาะที่เป็นของ partner เท่านั้น
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ตรวจสอบว่า property เป็นของ partner นี้จริง
  const { data: existingProperty } = await supabase
    .from("properties")
    .select("id, partner_id")
    .eq("id", params.id)
    .single();

  if (!existingProperty || existingProperty.partner_id !== user.id) {
    return NextResponse.json(
      { error: "ไม่มีสิทธิ์แก้ไขบ้านพักนี้" },
      { status: 403 }
    );
  }

  const body = await request.json();

  // อนุญาตให้แก้ไขได้เฉพาะบาง fields
  const allowedFields = [
    "name",
    "description",
    "address",
    "max_guests",
    "extra_guests",
    "bedrooms",
    "bathrooms",
    "pets_allowed",
    "thumbnail_url",
    "images",
    "latitude",
    "longitude",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะแก้ไข" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("properties")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
