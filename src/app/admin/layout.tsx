// =============================================================
// app/admin/layout.tsx — Admin Layout (Server Component)
// Layout สำหรับทุกหน้า /admin/*
// export dynamic = 'force-dynamic' ensures lambdas exist for
// all middleware-matched admin routes on Vercel
// =============================================================

import AdminClientLayout from "./AdminClientLayout";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
