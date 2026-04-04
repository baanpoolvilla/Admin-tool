// =============================================================
// app/api/admin/migrate/route.ts — One-time Migration Runner
// POST → รัน SQL migration เพิ่ม columns ใหม่
// ต้อง login เป็น admin เท่านั้น
// =============================================================

import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST() {
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

  // ตรวจสอบว่ามี columns อยู่แล้วหรือไม่
  const { data: existingCheck } = await adminClient
    .from("properties")
    .select("price_markup, detail_url")
    .limit(1);

  if (existingCheck !== null) {
    return NextResponse.json({ 
      success: true, 
      message: "Columns already exist (price_markup, detail_url)" 
    });
  }

  // ใช้ rpc เพื่อรัน SQL ถ้า Supabase มีฟังก์ชัน exec_sql
  // หรือใช้ service role client เพื่อ insert/update ตาม schema
  try {
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1];
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!projectRef || !serviceKey) {
      return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 });
    }

    // ใช้ Supabase Management API เพื่อรัน SQL
    const sql = `
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_markup NUMERIC DEFAULT NULL;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS detail_url TEXT DEFAULT NULL;
    `;

    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
      const err = await res.text();
      // ลอง method อื่น — Supabase REST introspection
      return NextResponse.json({ 
        error: "Management API failed — please run SQL manually in Supabase Dashboard",
        sql: sql.trim(),
        detail: err 
      }, { status: 422 });
    }

    return NextResponse.json({ success: true, message: "Migration completed successfully!" });
  } catch (e) {
    return NextResponse.json({ 
      error: String(e),
      sql: "ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_markup NUMERIC DEFAULT NULL;\nALTER TABLE properties ADD COLUMN IF NOT EXISTS detail_url TEXT DEFAULT NULL;"
    }, { status: 500 });
  }
}
