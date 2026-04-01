// =============================================================
// lib/supabase/client.ts — Supabase Client (Browser / Client Component)
// ใช้ใน Client Components (use client) เช่น forms, interactivity
// ⚠️ ใช้ anon key เท่านั้น → ข้อมูลถูก filter ด้วย RLS
// =============================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  // Note: Database generic omitted due to @supabase/ssr@0.5 type inference issue
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
