"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const partnerNav = [
  { label: "📊 Dashboard", href: "/partner/dashboard" },
  { label: "🏠 บ้านพักของฉัน", href: "/partner/properties" },
  { label: "📅 ปฏิทินของฉัน", href: "/partner/calendar" },
];

export default function PartnerClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = "user-role=; path=/; max-age=0";
    document.cookie = "user-role-user-id=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:flex-row">
      {/* --- Sidebar --- */}
      <aside className="w-full md:w-64 bg-surface border-b md:border-b-0 md:border-r border-gray-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-3 md:p-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-text-primary font-bold text-base md:text-lg">
                🏠 Partner Panel
              </h1>
              <p className="text-text-secondary text-xs mt-0.5 md:mt-1">
                จัดการบ้านพักของคุณ
              </p>
            </div>
            {userEmail && (
              <span className="md:hidden text-[11px] text-text-secondary truncate max-w-[52vw] text-right">
                👤 {userEmail}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 md:p-4">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {partnerNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2.5 rounded-lg text-sm transition-colors",
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

        {/* Bottom: links + Logout */}
        <div className="p-3 md:p-4 border-t border-gray-200 flex flex-col md:block gap-2 md:space-y-2">
          <a
            href="/"
            className="text-text-secondary text-sm hover:text-accent transition-colors"
          >
            ← กลับหน้าหลัก
          </a>
          <button
            onClick={handleLogout}
            className="w-full text-left text-red-500 text-sm hover:text-red-600 transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Top bar */}
        <div className="hidden md:flex h-12 border-b border-gray-200 bg-surface items-center justify-end px-6 shrink-0">
          {userEmail && (
            <span className="text-xs md:text-sm text-text-secondary truncate max-w-full">
              👤 {userEmail}
            </span>
          )}
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
