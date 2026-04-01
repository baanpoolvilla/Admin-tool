// =============================================================
// app/admin/login/page.tsx — Admin Login Page
// ฟอร์ม login ด้วย email + password (Supabase Auth)
// =============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
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

    const { error: authError } = await supabase.auth.signInWithPassword({
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

    router.replace("/admin/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">🏠</h1>
          <h2 className="text-text-primary font-bold text-xl mt-2">
            Villa Admin
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            เข้าสู่ระบบเพื่อจัดการบ้านพัก
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-xl border border-white/5 p-6 space-y-4"
        >
          {/* Email */}
          <div>
            <label className="block text-text-secondary text-sm mb-1.5">
              อีเมล
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-card border border-white/10 rounded-lg text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
              placeholder="admin@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-text-secondary text-sm mb-1.5">
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-card border border-white/10 rounded-lg text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        {/* Back to public */}
        <p className="text-center mt-4">
          <a
            href="/"
            className="text-text-secondary text-sm hover:text-accent transition-colors"
          >
            ← กลับหน้าหลัก
          </a>
        </p>
      </div>
    </div>
  );
}
