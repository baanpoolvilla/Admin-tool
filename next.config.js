/** @type {import('next').NextConfig} */

// =============================================================
// next.config.ts — Next.js Configuration
// - ตั้งค่า Next.js App Router
// - กำหนด image domains สำหรับ remote images
// - ตั้งค่า experimental features ที่ต้องการ
// =============================================================

const nextConfig = {
  // อนุญาตให้โหลดรูปจากแหล่งภายนอก (Supabase Storage, Scraper sources)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "www.devillegroups.com",
      },
      {
        protocol: "https",
        hostname: "*.poolvillacity.com",
      },
    ],
  },
};

module.exports = nextConfig;
