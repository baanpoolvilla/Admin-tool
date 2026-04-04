// =============================================================
// api/partner/properties/route.ts — Partner Properties API
// GET: ดึงเฉพาะบ้านพักของ partner ที่ login อยู่
// =============================================================

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ดึงเฉพาะ properties ที่ partner_id ตรงกับ user
  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .eq("partner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(properties || []);
}
