// =============================================================
// lib/auth.ts — Auth Helper Functions
// ดึงข้อมูล user profile (role) จาก Supabase
// =============================================================

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types";

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // ถ้ายังไม่มี profile → สร้างเป็น partner (default)
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        role: "partner",
      })
      .select()
      .single();

    return newProfile as UserProfile | null;
  }

  return profile as UserProfile;
}
