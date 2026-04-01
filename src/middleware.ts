// =============================================================
// middleware.ts — Auth Middleware
// ป้องกัน route /admin/* → ถ้ายังไม่ login จะ redirect ไป /admin/login
// ใช้ Supabase SSR เพื่อตรวจสอบ session
// =============================================================

import { createServerClient } from "@supabase/ssr";
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

  // ถ้าเข้า /admin/* (ยกเว้น /admin/login) โดยไม่ได้ login → redirect
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (isAdminRoute && !isLoginPage && !user) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // ถ้า login แล้วเข้า /admin/login → redirect ไป dashboard
  if (isLoginPage && user) {
    const dashboardUrl = new URL("/admin/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

// กำหนดว่า middleware ทำงานกับ routes ไหนบ้าง
export const config = {
  matcher: ["/admin/:path*"],
};
