// =============================================================
// app/admin/layout.tsx — Admin Layout
// Layout สำหรับทุกหน้า /admin/*
// - Sidebar navigation
// - User info + Logout
// =============================================================

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  // หน้า login ไม่ต้องแสดง sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* --- Sidebar --- */}
      <aside className="w-full md:w-64 bg-surface border-b md:border-b-0 md:border-r border-gray-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-3 md:p-6 border-b border-gray-200">
          <h1 className="text-text-primary font-bold text-base md:text-lg">
            🏠 Villa Admin
          </h1>
          <p className="text-text-secondary text-xs mt-0.5 md:mt-1">
            ระบบจัดการบ้านพัก
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 md:p-4">
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
            {siteConfig.adminNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap",
                  pathname === item.href
                    ? "bg-orange-50 text-accent font-medium"
                    : "text-text-secondary hover:bg-card hover:text-text-primary"
                )}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Bottom: Public view link + Logout */}
        <div className="p-3 md:p-4 border-t border-gray-200 flex md:block items-center gap-4 md:space-y-2">
          <a
            href="/"
            className="text-text-secondary text-sm hover:text-accent transition-colors"
          >
            ← กลับหน้าหลัก
          </a>
          <button
            onClick={handleLogout}
            className="text-left text-red-500 text-sm hover:text-red-600 transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Top bar */}
        <div className="h-11 md:h-12 border-b border-gray-200 bg-surface flex items-center justify-end px-3 md:px-6 shrink-0">
          {userEmail && (
            <span className="text-xs md:text-sm text-text-secondary truncate max-w-full">
              🔑 {userEmail}
            </span>
          )}
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
