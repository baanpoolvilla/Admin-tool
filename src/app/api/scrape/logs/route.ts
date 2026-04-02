// =============================================================
// app/api/scrape/logs/route.ts — Scrape Logs API
// GET → ดึงประวัติ scrape ล่าสุด (10 รายการ)
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

  const { data, error } = await supabase
    .from("scrape_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data || []);
}
