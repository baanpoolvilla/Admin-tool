// =============================================================
// lib/supabase/server.ts — Supabase Client (Server Component / Route Handler)
// ใช้ใน Server Components และ API Routes
// ⚠️ ใช้ anon key + cookies เพื่อรู้ตัวตนผู้ใช้ (Auth session)
// =============================================================

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  // Note: Database generic omitted due to @supabase/ssr@0.5 type inference issue
  // Types resolve to 'never' instead of proper table types
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll ถูกเรียกจาก Server Component → ไม่สามารถ set cookie ได้
            // ไม่เป็นไร เพราะ middleware จะจัดการ refresh token ให้
          }
        },
      },
    }
  );
}

// Service role client — bypass RLS ทั้งหมด (ใช้เฉพาะ server-side admin operations)
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}
