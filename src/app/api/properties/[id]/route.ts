// =============================================================
// app/api/properties/[id]/route.ts — Single Property API
// GET    → ดึงข้อมูลบ้านเดียว
// PUT    → อัปเดตข้อมูลบ้าน (ต้อง login)
// DELETE → ลบบ้าน (ต้อง login)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

type RouteParams = { params: Promise<{ id: string }> };

// --- GET: ดึง Property เดียว ---
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

// --- PUT: อัปเดต Property ---
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // ตรวจสอบ authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: PropertyUpdate = await request.json();
  body.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("properties")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// --- DELETE: ลบ Property ---
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // ตรวจสอบ authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
