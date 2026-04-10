// =============================================================
// middleware.ts — Auth Middleware
// ป้องกัน route /admin/* → ถ้ายังไม่ login จะ redirect ไป /admin/login
// ใช้ Supabase SSR เพื่อตรวจสอบ session
// =============================================================

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ตรวจสอบ session (refresh token ถ้าจำเป็น)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isPartnerRoute = request.nextUrl.pathname.startsWith("/partner");
  const isAdminLoginPage = request.nextUrl.pathname === "/admin/login";
  const isHomeLoginPage = request.nextUrl.pathname === "/login";
  const isAnyLoginPage = isAdminLoginPage || isHomeLoginPage;
  const isDashboardRoot = request.nextUrl.pathname === "/";

  // ป้องกัน dashboard หลัก (/) — ต้อง login
  if (isDashboardRoot && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminRoute && !isAnyLoginPage && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ป้องกัน partner routes — ต้อง login
  if (isPartnerRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ตรวจสอบ role เพื่อป้องกัน partner เข้า /admin/* และ admin เข้า /partner/*
  if (user && (isAdminRoute || isPartnerRoute || isAnyLoginPage)) {
    // อ่าน role จาก cookie โดยต้องผูกกับ user id ปัจจุบันเท่านั้น
    const cookieRole = request.cookies.get("user-role")?.value;
    const cookieRoleUserId = request.cookies.get("user-role-user-id")?.value;
    let role =
      cookieRoleUserId && cookieRoleUserId === user.id ? cookieRole : undefined;

    if (!role || (role !== "admin" && role !== "partner")) {
      // ไม่มี cookie → query DB (slow path — ครั้งเดียว)
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      role = profile?.role ?? "partner";

      // เซ็ต cookie เพื่อไม่ต้อง query DB ครั้งต่อไป
      supabaseResponse.cookies.set("user-role", role as string, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 ชั่วโมง
      });
      supabaseResponse.cookies.set("user-role-user-id", user.id, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 ชั่วโมง
      });
    }

    // ถ้า login แล้วเข้า page login ใดๆ → redirect ตาม role
    if (isAnyLoginPage) {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/partner/dashboard", request.url));
    }

    // partner พยายามเข้า /admin/* → redirect ไป /partner/dashboard
    if (isAdminRoute && !isAnyLoginPage && role !== "admin") {
      return NextResponse.redirect(new URL("/partner/dashboard", request.url));
    }

    // admin พยายามเข้า /partner/* → redirect ไป /admin/dashboard
    if (isPartnerRoute && role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

// กำหนดว่า middleware ทำงานกับ routes ไหนบ้าง
export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/partner/:path*"],
};
