// =============================================================
// app/layout.tsx — Root Layout
// Layout หลักของทั้ง application
// - โหลด fonts
// - กำหนด metadata
// - ครอบ children ด้วย global providers
// =============================================================

import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
