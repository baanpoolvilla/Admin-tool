# 06 — Configuration Reference (รายละเอียด Config ทั้งหมด)

## สารบัญ

1. [Environment Variables](#1-environment-variables)
2. [Next.js Config](#2-nextjs-config)
3. [TypeScript Config](#3-typescript-config)
4. [Tailwind CSS Config](#4-tailwind-css-config)
5. [ESLint Config](#5-eslint-config)
6. [PostCSS Config](#6-postcss-config)
7. [App Config Files](#7-app-config-files-srcconfig)
8. [Supabase Clients](#8-supabase-clients)
9. [Middleware](#9-middleware)
10. [Scraper Config](#10-scraper-config)
11. [GitHub Actions Workflow](#11-github-actions-workflow)

---

## 1. Environment Variables

**ไฟล์**: `.env.local` (gitignored — ไม่ถูก commit)
**ตัวอย่าง**: `.env.local.example`

```env
# === Supabase (จำเป็น) ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co     # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                  # Anon key (client-safe)
SUPABASE_SERVICE_KEY=eyJ...                            # Service role key (server-only!)

# === GitHub (optional — สำหรับ trigger scraper) ===
GITHUB_TOKEN=ghp_xxxxx                                 # Personal Access Token
GITHUB_REPO=username/villa-dashboard                   # Repository path

# === App (optional) ===
NEXT_PUBLIC_APP_URL=http://localhost:3000               # App URL
```

### กฎของ Next.js Environment Variables:
| Prefix | แสดงฝั่ง Client? | ใช้ฝั่ง Server? |
|--------|-----------------|----------------|
| `NEXT_PUBLIC_` | ✅ ใช่ — ถูก bundle ใน client JS | ✅ ใช่ |
| ไม่มี prefix | ❌ ไม่ — server-only | ✅ ใช่ |

---

## 2. Next.js Config

**ไฟล์**: `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
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
```

### คำอธิบาย:
| Option | คำอธิบาย |
|--------|----------|
| `images.remotePatterns` | อนุญาตให้ `next/image` โหลดรูปจาก domains เหล่านี้ |
| `*.supabase.co` | รูปจาก Supabase Storage |
| `www.devillegroups.com` | รูปจาก Deville Groups |
| `*.poolvillacity.com` | รูปจาก Pool Villa City |

### เพิ่ม domain ใหม่:
ถ้าต้อง load รูปจาก domain อื่น → เพิ่มใน `remotePatterns` array

---

## 3. TypeScript Config

**ไฟล์**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Key settings:
| Option | Value | คำอธิบาย |
|--------|-------|----------|
| `strict` | `true` | เปิด strict type checking ทั้งหมด |
| `paths.@/*` | `./src/*` | Import shortcut: `@/components/...` = `./src/components/...` |
| `moduleResolution` | `bundler` | ใช้ module resolution แบบ bundler (Next.js + SWC) |
| `jsx` | `preserve` | ให้ SWC จัดการ JSX transform แทน tsc |

---

## 4. Tailwind CSS Config

**ไฟล์**: `tailwind.config.ts`

### Custom Colors (Dark Theme):

| Token | Hex | ใช้ทำอะไร |
|-------|-----|----------|
| `background` | `#0F1117` | พื้นหลังหลัก |
| `surface` | `#1A1D26` | พื้นผิว panel |
| `card` | `#22263A` | พื้นหลัง card |
| `accent` | `#4F9EFF` | สี accent (ปุ่ม, link) |
| `available` | `#2ED573` | สถานะว่าง (เขียว) |
| `booked` | `#FF4757` | สถานะจอง (แดง) |
| `blocked` | `#8892A4` | สถานะ blocked (เทา) |
| `text-primary` | `#FFFFFF` | ข้อความหลัก |
| `text-secondary` | `#8892A4` | ข้อความรอง |

### Custom Fonts:
| Token | Fonts | ใช้ทำอะไร |
|-------|-------|----------|
| `sans` | Inter, Noto Sans Thai | ข้อความทั่วไป + ภาษาไทย |
| `thai` | Noto Sans Thai | ข้อความภาษาไทยโดยเฉพาะ |
| `mono` | JetBrains Mono | Code / monospace |

### ตัวอย่างใช้งาน:
```tsx
<div className="bg-background text-text-primary">
  <div className="bg-card rounded-lg p-4">
    <span className="text-available">ว่าง</span>
    <span className="text-booked">จอง</span>
  </div>
</div>
```

---

## 5. ESLint Config

**ไฟล์**: `.eslintrc.json`

```json
{
  "extends": "next/core-web-vitals"
}
```

ใช้ Next.js ESLint config พร้อม Core Web Vitals rules:
- ตรวจจับ `<img>` ที่ควรใช้ `<Image>`
- ตรวจจับ `<a>` ที่ควรใช้ `<Link>`
- และอื่นๆ

---

## 6. PostCSS Config

**ไฟล์**: `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Standard Next.js + Tailwind CSS setup — ไม่ต้องแก้ไข

---

## 7. App Config Files (`src/config/`)

### `src/config/calendar.ts`
```typescript
export const calendarConfig = {
  monthsToShow: 2,           // จำนวนเดือนที่แสดงในปฏิทิน
  scrapeDaysAhead: 60,       // ช่วงวันที่ scrape ล่วงหน้า
  dayNames: ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"],
  monthNames: ["มกราคม", ..., "ธันวาคม"],
  dateFormat: "YYYY-MM-DD",
};
```

### `src/config/map.ts`
```typescript
export const mapConfig = {
  defaultCenter: { lat: 12.9236, lng: 100.8825 },  // พัทยา
  defaultZoom: 12,
  selectedZoom: 15,
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileAttribution: '&copy; OpenStreetMap contributors',
  markerSize: { default: 10, selected: 14 },
};
```

### ปรับ default center:
ถ้าบ้านพักอยู่ในพื้นที่อื่น → แก้ `defaultCenter` ใน `map.ts`

### `src/config/site.ts`
```typescript
export const siteConfig = {
  name: "Villa Dashboard",
  description: "ระบบแสดงข้อมูลบ้านพัก...",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  adminNav: [...],          // เมนู admin sidebar
  publicNav: [...],          // เมนู public navbar
};
```

### `src/config/theme.ts`
```typescript
export const theme = {
  calendar: {
    available: { bg: "bg-green-500/20", border: "border-green-500", ... },
    booked: { bg: "bg-red-500/20", border: "border-red-500", ... },
    blocked: { bg: "bg-gray-500/20", border: "border-gray-500", ... },
    past: { opacity: "opacity-30" },
  },
  map: {
    available: "#2ED573",
    booked: "#FF4757",
    selected: "#4F9EFF",
  },
};
```

### `src/config/index.ts` (Barrel export):
```typescript
export { calendarConfig } from "./calendar";
export { mapConfig } from "./map";
export { siteConfig } from "./site";
export { theme } from "./theme";
```

---

## 8. Supabase Clients

### สรุป Supabase clients 3 ตัว:

| ไฟล์ | ใช้ที่ไหน | Key ที่ใช้ | สิทธิ์ |
|------|----------|-----------|--------|
| `src/lib/supabase/client.ts` | Client Components (`"use client"`) | `anon` key | ถูก filter ด้วย RLS |
| `src/lib/supabase/server.ts` | Server Components, API Routes | `anon` key + cookies | มี session — รู้ตัวตนผู้ใช้ |
| `src/lib/supabase/admin.ts` | Server-only (scraper, admin ops) | `service_role` key | Full access — bypass RLS ⚠️ |

### เลือกใช้ client ไหน:
- **อ่านข้อมูล public** → `client.ts` หรือ `server.ts`
- **CRUD ที่ต้อง login** → `server.ts` (ตรวจ auth ด้วย cookies)
- **Scraper / bulk operations** → `admin.ts` (bypass RLS)

---

## 9. Middleware

**ไฟล์**: `src/middleware.ts`

### ทำหน้าที่:
1. ตรวจสอบ session ของ Supabase Auth
2. ถ้าเข้า `/admin/*` (ยกเว้น `/admin/login`) โดยไม่ได้ login → redirect ไป `/admin/login`
3. ถ้า login แล้วเข้า `/admin/login` → redirect ไป `/admin/dashboard`

### Route matching:
```typescript
export const config = {
  matcher: ["/admin/:path*"],  // middleware ทำงานเฉพาะ /admin/* routes
};
```

### ถ้าต้องการเพิ่ม protected routes:
แก้ไข `matcher` pattern หรือเพิ่ม logic ใน middleware function

---

## 10. Scraper Config

**ไฟล์**: `scraper/config.py`

| ค่า | Default | คำอธิบาย |
|-----|---------|----------|
| `SUPABASE_URL` | `""` | URL ของ Supabase (ใช้ env var) |
| `SUPABASE_SERVICE_KEY` | `""` | Service role key (ใช้ env var) |
| `SCRAPE_DAYS_AHEAD` | `60` | จำนวนวันที่จะ scrape ล่วงหน้า |
| `REQUEST_DELAY` | `1.5` | Delay ระหว่าง request (วินาที) |
| `PAGE_TIMEOUT` | `30000` | Page load timeout (ms) |
| `HEADLESS` | `True` | ซ่อนหน้าต่าง browser |

**ไฟล์**: `scraper/requirements.txt`

| Package | Version | Purpose |
|---------|---------|---------|
| `playwright` | 1.49.1 | Headless browser |
| `python-dotenv` | 1.0.1 | Load .env file |
| `supabase` | 2.11.0 | Supabase client |
| `httpx` | 0.28.1 | HTTP client |
| `python-dateutil` | 2.9.0 | Date parsing |

---

## 11. GitHub Actions Workflow

**ไฟล์**: `.github/workflows/scrape.yml`

| Setting | Value | คำอธิบาย |
|---------|-------|----------|
| **Schedule** | `0 */12 * * *` | ทุก 12 ชั่วโมง (07:00, 19:00 ไทย) |
| **Runner** | `ubuntu-latest` | Ubuntu Linux runner |
| **Python** | `3.11` | Python version |
| **Timeout** | `30 minutes` | Maximum execution time |
| **Secrets used** | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | ตั้งใน GitHub Settings |

---

## โครงสร้างไฟล์ทั้งหมด (File Tree)

```
villa-dashboard/
├── .env.local               # Environment variables (SECRET — gitignored)
├── .env.local.example       # Template for .env.local
├── .eslintrc.json           # ESLint configuration
├── .gitignore               # Git ignore rules
├── next.config.js           # Next.js configuration
├── next-env.d.ts            # Next.js TypeScript declarations
├── package.json             # Dependencies & scripts
├── package-lock.json        # Dependency lock file
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── README.md                # Project readme
│
├── .github/workflows/
│   └── scrape.yml           # GitHub Actions workflow
│
├── docs/
│   ├── schema.sql           # Database schema (SQL)
│   └── setup/               # Setup guides (this folder)
│       ├── README.md
│       ├── 01-supabase-setup.md
│       ├── 02-local-development.md
│       ├── 03-vercel-deployment.md
│       ├── 04-github-actions.md
│       ├── 05-scraper-setup.md
│       └── 06-configuration-reference.md
│
├── scraper/                 # Python scraper
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   └── scrapers/
│       ├── __init__.py
│       ├── base.py
│       ├── deville.py
│       └── poolvillacity.py
│
└── src/                     # Next.js application
    ├── middleware.ts         # Auth middleware
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── admin/
    │   │   ├── layout.tsx
    │   │   ├── login/page.tsx
    │   │   ├── dashboard/page.tsx
    │   │   ├── calendar/page.tsx
    │   │   └── properties/
    │   │       ├── page.tsx
    │   │       ├── new/page.tsx
    │   │       └── [id]/page.tsx
    │   └── api/
    │       ├── availability/route.ts
    │       ├── properties/route.ts
    │       ├── properties/[id]/route.ts
    │       └── scrape/trigger/route.ts
    ├── components/
    │   ├── public/
    │   │   ├── CalendarView.tsx
    │   │   ├── MapView.tsx
    │   │   ├── PropertyCard.tsx
    │   │   └── PropertyList.tsx
    │   └── ui/
    │       ├── LoadingSpinner.tsx
    │       ├── PriceCard.tsx
    │       └── StatusBadge.tsx
    ├── config/
    │   ├── index.ts
    │   ├── calendar.ts
    │   ├── map.ts
    │   ├── site.ts
    │   └── theme.ts
    ├── hooks/
    │   ├── useAvailability.ts
    │   └── useProperties.ts
    ├── lib/
    │   ├── utils.ts
    │   └── supabase/
    │       ├── admin.ts
    │       ├── client.ts
    │       └── server.ts
    └── types/
        ├── index.ts
        ├── availability.ts
        ├── database.ts
        └── property.ts
```
