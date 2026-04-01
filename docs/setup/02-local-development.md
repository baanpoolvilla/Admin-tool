# 02 — Local Development (ตั้งค่า Development ในเครื่อง)

## Prerequisites (สิ่งที่ต้องมี)

| เครื่องมือ | Version ขั้นต่ำ | วิธีติดตั้ง |
|-----------|----------------|-------------|
| **Node.js** | v18+ (แนะนำ LTS) | `winget install OpenJS.NodeJS.LTS` หรือ [nodejs.org](https://nodejs.org) |
| **npm** | v9+ (มากับ Node.js) | ติดตั้งมากับ Node.js |
| **Git** | v2+ | `winget install Git.Git` หรือ [git-scm.com](https://git-scm.com) |

ตรวจสอบ:
```powershell
node --version    # ควรได้ v18.x.x ขึ้นไป
npm --version     # ควรได้ v9.x.x ขึ้นไป
git --version     # ควรได้ git version 2.x.x
```

---

## ขั้นตอนที่ 1: Clone Repository

```powershell
git clone https://github.com/<your-username>/villa-dashboard.git
cd villa-dashboard
```

---

## ขั้นตอนที่ 2: ติดตั้ง Dependencies

```powershell
npm install
```

จะติดตั้ง packages ทั้งหมดใน `node_modules/` (ประมาณ 400+ packages)

---

## ขั้นตอนที่ 3: ตั้งค่า Environment Variables

### 3.1 คัดลอก example file

```powershell
Copy-Item .env.local.example .env.local
```

### 3.2 แก้ไข `.env.local`

เปิดไฟล์ `.env.local` แล้วใส่ค่าจริง:

```env
# === Supabase ===
# ได้จาก: Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# === GitHub (สำหรับ trigger scraper จาก Admin Panel) ===
# ได้จาก: GitHub → Settings → Developer settings → Personal access tokens
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=your-username/villa-dashboard

# === App URL ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### รายละเอียด Environment Variables

| Variable | ประเภท | จำเป็น | คำอธิบาย |
|----------|--------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ | URL ของ Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ | Anon key (ถูก filter ด้วย RLS) |
| `SUPABASE_SERVICE_KEY` | Secret | ✅ | Service role key (bypass RLS) — ใช้ server-side เท่านั้น |
| `GITHUB_TOKEN` | Secret | ❌ | GitHub PAT สำหรับ trigger scraper workflow |
| `GITHUB_REPO` | Public | ❌ | Repository path (owner/repo) |
| `NEXT_PUBLIC_APP_URL` | Public | ❌ | URL ของแอพ (default: localhost:3000) |

> ⚠️ ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_` จะถูกส่งไปฝั่ง client browser
> ตัวแปรอื่นจะอยู่ server-side เท่านั้น

---

## ขั้นตอนที่ 4: รัน Development Server

```powershell
npm run dev
```

เปิด browser ที่ **http://localhost:3000**

### หน้าที่พร้อมใช้งาน:

| URL | หน้า | ต้อง Login? |
|-----|------|------------|
| `http://localhost:3000` | หน้าหลัก (Public) — แผนที่ + ปฏิทิน + รายการบ้าน | ❌ |
| `http://localhost:3000/admin/login` | หน้า Login สำหรับ Admin | ❌ |
| `http://localhost:3000/admin/dashboard` | Admin Dashboard — สรุปภาพรวม | ✅ |
| `http://localhost:3000/admin/properties` | จัดการบ้านพัก (CRUD) | ✅ |
| `http://localhost:3000/admin/properties/new` | เพิ่มบ้านพักใหม่ | ✅ |
| `http://localhost:3000/admin/calendar` | จัดการปฏิทินวันว่าง/จอง | ✅ |

---

## ขั้นตอนที่ 5: ทดสอบ API

### ทดสอบดึงข้อมูล Properties (ไม่ต้อง login):
```powershell
curl http://localhost:3000/api/properties
```

### ทดสอบดึงข้อมูล Availability:
```powershell
curl "http://localhost:3000/api/availability?property_id=<uuid>"
```

---

## คำสั่ง npm ที่ใช้บ่อย

| คำสั่ง | ใช้ทำอะไร |
|--------|----------|
| `npm run dev` | เปิด dev server (hot reload) ที่ port 3000 |
| `npm run build` | Build สำหรับ production |
| `npm start` | รัน production server (ต้อง build ก่อน) |
| `npm run lint` | ตรวจสอบ code ด้วย ESLint |

---

## Troubleshooting

### ❌ `npx` หรือ `npm` ไม่รู้จัก
```powershell
# แก้ไข execution policy (Windows)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

# รีเปิด terminal แล้วลองใหม่
```

### ❌ Build error: Type error with Supabase
ถ้าเจอ `Type error: Argument of type ... is not assignable to parameter of type 'never'`
→ เกิดจาก `@supabase/ssr@0.5.x` กับ `@supabase/supabase-js@2.100+` มี type inference bug
→ Database generic ถูกลบออกแล้วในไฟล์ client — ไม่ต้องแก้เพิ่มเติม

### ❌ Leaflet map ไม่แสดงผล
→ Leaflet ต้องใช้ CSS: `import "leaflet/dist/leaflet.css"` (อยู่ใน `MapView.tsx` แล้ว)
→ ตรวจสอบว่า component ใช้ `"use client"` directive

### ❌ ไม่สามารถ login ได้
→ ตรวจสอบว่าสร้าง user ใน Supabase แล้ว (ดู [01-supabase-setup.md](./01-supabase-setup.md) ขั้นตอนที่ 5)
→ ตรวจสอบว่า `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ถูกต้อง
