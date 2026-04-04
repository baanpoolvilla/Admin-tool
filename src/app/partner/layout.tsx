// =============================================================
// app/partner/layout.tsx — Partner Layout (Server Component)
// Layout สำหรับหน้า /partner/* พร้อม sidebar
// export dynamic = 'force-dynamic' ensures lambdas exist for
// all middleware-matched partner routes on Vercel
// =============================================================

import PartnerClientLayout from "./PartnerClientLayout";

export const dynamic = "force-dynamic";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PartnerClientLayout>{children}</PartnerClientLayout>;
}
