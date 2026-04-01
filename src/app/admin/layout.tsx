// =============================================================
// app/admin/layout.tsx — Admin Layout
// Layout สำหรับทุกหน้า /admin/*
// - Sidebar navigation
// - User info + Logout
// =============================================================

"use client";

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

  // หน้า login ไม่ต้องแสดง sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <div className="h-screen flex">
      {/* --- Sidebar --- */}
      <aside className="w-64 bg-surface border-r border-white/5 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <h1 className="text-text-primary font-bold text-lg">
            🏠 Villa Admin
          </h1>
          <p className="text-text-secondary text-xs mt-1">
            ระบบจัดการบ้านพัก
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {siteConfig.adminNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
                pathname === item.href
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-text-secondary hover:bg-card hover:text-text-primary"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Bottom: Public view link + Logout */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <a
            href="/"
            className="block text-text-secondary text-sm hover:text-accent transition-colors"
          >
            ← กลับหน้าหลัก
          </a>
          <button
            onClick={handleLogout}
            className="w-full text-left text-red-400 text-sm hover:text-red-300 transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
