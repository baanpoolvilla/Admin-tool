// =============================================================
// api/admin/partners/route.ts — List Partners API
// GET: ดึงรายชื่อ partner ทั้งหมด (สำหรับ admin เลือก assign)
// =============================================================

import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  // 1) ตรวจ session ด้วย anon client (ใช้ cookies)
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) query profiles ด้วย service role คย bypass RLS ทั้งหมด
  const adminClient = createServiceRoleClient();
  const { data: partners, error } = await adminClient
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("role", "partner")
    .order("email", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(partners || []);
}
