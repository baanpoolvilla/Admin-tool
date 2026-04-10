// =============================================================
// app/login/page.tsx — Login Page
// ฟอร์ม login กลางสำหรับเข้าสู่ระบบ Admin/Partner
// =============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl.includes("xxxx.supabase.co") ||
      supabaseAnonKey === "your_anon_key"
    ) {
      setError("ยังไม่ได้ตั้งค่า Supabase ใน .env.local ให้เป็นค่าจริง");
      setIsLoading(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (authError) {
      if (authError.message.includes("Invalid login credentials")) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        setError(`เข้าสู่ระบบไม่สำเร็จ: ${authError.message}`);
      }
      setIsLoading(false);
      return;
    }

    // ดึง role จาก profile โดยตรงเพื่อ redirect ให้ถูกสิทธิ์
    const userId = authData.user?.id;
    if (userId) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (profile?.role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }

        if (profile?.role === "partner") {
          router.replace("/partner/dashboard");
          return;
        }
      } catch {
        // fallback ที่ปลอดภัย: ถ้าหา role ไม่เจอให้เป็น partner
        router.replace("/partner/dashboard");
        return;
      }
    }

    // fallback ที่ปลอดภัย: ไม่มี profile role
    router.replace("/partner/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Baanpoolvilla Logo" 
            className="w-20 h-20 mx-auto mb-2 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }}
          />
          <span className="text-3xl hidden">🏠</span>
          <h2 className="text-text-primary font-bold text-xl mt-2">
            Baanpoolvilla Dashboard
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            เข้าสู่ระบบเพื่อใช้งานระบบ
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-xl border border-gray-200 p-6 space-y-4"
        >
          <div>
            <label className="block text-text-secondary text-sm mb-1.5">
              อีเมล
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-card border border-gray-200 rounded-lg text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1.5">
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-card border border-gray-200 rounded-lg text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}