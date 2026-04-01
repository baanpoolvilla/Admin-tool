# 📖 Villa Dashboard — คู่มือตั้งค่าและ Deploy ทั้งหมด

## สารบัญ (Table of Contents)

| ไฟล์ | เนื้อหา |
|------|---------|
| [01-supabase-setup.md](./01-supabase-setup.md) | สร้าง Supabase Project, รัน SQL Schema, ตั้งค่า RLS, Auth |
| [02-local-development.md](./02-local-development.md) | ติดตั้ง Node.js, npm install, ตั้งค่า .env.local, รัน dev server |
| [03-vercel-deployment.md](./03-vercel-deployment.md) | Deploy ขึ้น Vercel, ตั้งค่า Environment Variables, Custom Domain |
| [04-github-actions.md](./04-github-actions.md) | ตั้งค่า GitHub Actions สำหรับ Auto Scraper ทุก 12 ชม. |
| [05-scraper-setup.md](./05-scraper-setup.md) | ตั้งค่า Python Scraper, ทดสอบในเครื่อง, Debug |
| [06-configuration-reference.md](./06-configuration-reference.md) | รายละเอียด Config Files ทั้งหมด |

---

## Quick Start (เริ่มต้นเร็ว)

```bash
# 1. Clone repository
git clone https://github.com/<your-username>/villa-dashboard.git
cd villa-dashboard

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.local.example .env.local
# แก้ไขค่าใน .env.local ตาม docs/setup/01-supabase-setup.md

# 4. Run database schema
# ไปที่ Supabase Dashboard → SQL Editor → paste docs/schema.sql → Run

# 5. Start development server
npm run dev
# เปิด http://localhost:3000
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Public    │  │ Admin    │  │ API Routes       │   │
│  │ Pages     │  │ Panel    │  │ /api/properties  │   │
│  │ (SSR)     │  │ (Auth)   │  │ /api/availability│   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                 Supabase (Backend)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Database  │  │ Auth     │  │ Storage          │   │
│  │ (Postgres)│  │ (JWT)    │  │ (Images)         │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
└───────────────────────▲─────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────┐
│             GitHub Actions (Scraper)                 │
│  ┌──────────────────────────────────────────────┐    │
│  │ Python Playwright → Scrape every 12 hours    │    │
│  │ deville.py / poolvillacity.py → Supabase     │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```
