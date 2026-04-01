// =============================================================
// lib/supabase/admin.ts — Supabase Admin Client (Service Role)
// ใช้ใน server-side เท่านั้น สำหรับ operations ที่ต้องข้าม RLS
// เช่น scraper upsert, admin bulk operations
// ⚠️ ห้ามใช้ฝั่ง client — service key มีสิทธิ์เต็ม!
// =============================================================

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables"
    );
  }

  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
