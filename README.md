# 🏠 Villa Availability Dashboard

ระบบแสดงข้อมูลบ้านพัก ปฏิทินว่าง และราคา สำหรับ Admin

**Stack:** Next.js 14 + Python Playwright + Supabase + GitHub Actions

---

## 📁 โครงสร้างโปรเจค

```
villa-dashboard/
├── src/                              # ===== Next.js Source Code =====
│   ├── app/                          # App Router pages
│   │   ├── layout.tsx                # Root layout (fonts, metadata)
│   │   ├── page.tsx                  # หน้าหลัก — 3-panel dashboard
│   │   ├── globals.css               # Global styles + Tailwind
│   │   ├── admin/                    # Admin panel
│   │   │   ├── layout.tsx            # Admin layout (sidebar)
│   │   │   ├── login/page.tsx        # หน้า login
│   │   │   ├── dashboard/page.tsx    # Admin dashboard
│   │   │   ├── properties/           # CRUD บ้านพัก
│   │   │   │   ├── page.tsx          # ตารางรายการบ้าน
│   │   │   │   ├── new/page.tsx      # เพิ่มบ้านใหม่
│   │   │   │   └── [id]/page.tsx     # แก้ไขบ้าน
│   │   │   └── calendar/page.tsx     # จัดการปฏิทินด้วยตนเอง
│   │   └── api/                      # API Routes
│   │       ├── properties/route.ts   # GET/POST properties
│   │       ├── properties/[id]/      # GET/PUT/DELETE single property
│   │       ├── availability/route.ts # GET/POST/DELETE availability
│   │       └── scrape/trigger/       # POST trigger GitHub Actions
│   │
│   ├── components/                   # ===== React Components =====
│   │   ├── public/                   # Components สำหรับหน้า public
│   │   │   ├── PropertyList.tsx      # แผงรายการบ้าน (ซ้าย)
│   │   │   ├── PropertyCard.tsx      # การ์ดบ้านแต่ละหลัง
│   │   │   ├── MapView.tsx           # แผนที่ Leaflet (กลาง)
│   │   │   └── CalendarView.tsx      # ปฏิทิน + ราคา (ขวา)
│   │   └── ui/                       # Shared UI components
│   │       ├── LoadingSpinner.tsx     # Loading indicator
│   │       ├── StatusBadge.tsx        # Badge สถานะ
│   │       └── PriceCard.tsx         # การ์ดแสดงราคา
│   │
│   ├── config/                       # ===== Configuration =====
│   │   ├── site.ts                   # ชื่อเว็บ, เมนู navigation
│   │   ├── theme.ts                  # สี, design tokens
│   │   ├── map.ts                    # Leaflet map settings
│   │   ├── calendar.ts              # Calendar settings (ชื่อเดือน/วัน)
│   │   └── index.ts                  # Barrel export
│   │
│   ├── lib/                          # ===== Libraries & Utils =====
│   │   ├── supabase/
│   │   │   ├── client.ts             # Supabase client (browser)
│   │   │   ├── server.ts             # Supabase client (server + cookies)
│   │   │   └── admin.ts              # Supabase admin (service role)
│   │   └── utils.ts                  # Helper functions
│   │
│   ├── types/                        # ===== TypeScript Types =====
│   │   ├── database.ts               # Supabase DB types
│   │   ├── property.ts               # Property types
│   │   ├── availability.ts           # Availability types
│   │   └── index.ts                  # Barrel export
│   │
│   ├── hooks/                        # ===== React Hooks =====
│   │   ├── useProperties.ts          # Hook ดึงข้อมูล properties
│   │   └── useAvailability.ts        # Hook ดึงข้อมูล availability
│   │
│   └── middleware.ts                 # Auth middleware (protect /admin/*)
│
├── scraper/                          # ===== Python Web Scraper =====
│   ├── main.py                       # Entry point — ประสานงาน scrapers
│   ├── config.py                     # Scraper configuration
│   ├── requirements.txt              # Python dependencies
│   ├── scrapers/
│   │   ├── base.py                   # Base scraper class
│   │   ├── deville.py                # Deville Groups scraper
│   │   └── poolvillacity.py          # Pool Villa City scraper
│   └── README.md                     # วิธีใช้ scraper
│
├── docs/                             # ===== Documentation =====
│   └── schema.sql                    # Supabase SQL schema
│
├── .github/workflows/
│   └── scrape.yml                    # GitHub Actions (auto scrape ทุก 12 ชม.)
│
├── .env.local.example                # ตัวอย่าง environment variables
├── package.json                      # Node.js dependencies
├── tailwind.config.ts                # Tailwind CSS config
├── tsconfig.json                     # TypeScript config
├── next.config.js                    # Next.js config
└── .gitignore
```

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repo>
cd villa-dashboard
npm install
```

### 2. ตั้งค่า Supabase
1. สร้างโปรเจคที่ [supabase.com](https://supabase.com)
2. ไปที่ **SQL Editor** → รัน SQL จาก `docs/schema.sql`
3. คัดลอก `.env.local.example` → `.env.local` แล้วใส่ค่า:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

### 3. สร้าง Admin User
ไปที่ Supabase Dashboard → **Authentication** → **Users** → **Add User**

### 4. เพิ่ม Properties
เข้า `/admin/login` → `/admin/properties` → เพิ่มบ้านพัก

### 5. รัน Scraper ครั้งแรก
```bash
cd scraper
pip install -r requirements.txt
playwright install chromium
python main.py
```

### 6. รัน Development Server
```bash
npm run dev
```
เปิด [http://localhost:3000](http://localhost:3000)

### 7. ตั้งค่า GitHub Actions (Optional)
1. Push code ไป GitHub
2. ไปที่ **Settings → Secrets → Actions** → เพิ่ม:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
3. Scraper จะรันอัตโนมัติทุก 12 ชั่วโมง

---

## 📝 Notes

### Config Files
| ไฟล์ | หน้าที่ |
|------|---------|
| `src/config/site.ts` | ชื่อเว็บ, เมนู |
| `src/config/theme.ts` | สีสถานะ, design tokens |
| `src/config/map.ts` | จุดกลางแผนที่, zoom level |
| `src/config/calendar.ts` | ชื่อวัน/เดือน ภาษาไทย |

### Supabase Clients
| ไฟล์ | ใช้ที่ | Key |
|------|--------|-----|
| `lib/supabase/client.ts` | Client Components | anon key |
| `lib/supabase/server.ts` | Server Components, API Routes | anon key + cookies |
| `lib/supabase/admin.ts` | Server-only (scraper ops) | service role key |
