# 01 — Supabase Setup (สร้าง Supabase Project)

## ขั้นตอนที่ 1: สร้าง Supabase Project

1. ไปที่ [https://supabase.com](https://supabase.com) → กด **Start your project**
2. Login ด้วย GitHub Account
3. กด **New Project**
4. กรอกข้อมูล:
   - **Organization**: เลือก org ที่มี หรือสร้างใหม่
   - **Project Name**: `villa-dashboard` (หรือชื่ออื่นที่ต้องการ)
   - **Database Password**: ตั้ง password ที่ปลอดภัย (เก็บไว้ — ใช้ตอน connect database โดยตรง)
   - **Region**: เลือก `Southeast Asia (Singapore)` เพื่อ latency ต่ำสุดสำหรับไทย
   - **Plan**: Free tier เพียงพอสำหรับเริ่มต้น
5. กด **Create new project** → รอประมาณ 1-2 นาที

---

## ขั้นตอนที่ 2: เก็บ API Keys

หลังสร้าง Project เสร็จ:

1. ไปที่ **Project Settings** → **API** (ในเมนูซ้าย)
2. คัดลอก keys เหล่านี้:

| Key | ตำแหน่งใน Dashboard | ใช้ในไฟล์ |
|-----|---------------------|-----------|
| **Project URL** | `API Settings` → `Project URL` | `.env.local` → `NEXT_PUBLIC_SUPABASE_URL` |
| **anon (public)** | `API Settings` → `Project API keys` → `anon` | `.env.local` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role (secret)** | `API Settings` → `Project API keys` → `service_role` | `.env.local` → `SUPABASE_SERVICE_KEY` |

> ⚠️ **สำคัญ**: `service_role` key มีสิทธิ์เต็ม (bypass RLS) — ห้าม expose ฝั่ง client!

---

## ขั้นตอนที่ 3: รัน Database Schema

1. ไปที่ **SQL Editor** (เมนูซ้าย)
2. กด **New query**
3. เปิดไฟล์ `docs/schema.sql` ใน repository แล้ว copy ทั้งหมด
4. Paste ลงใน SQL Editor
5. กด **Run** (หรือ `Ctrl+Enter`)

ควรเห็น output:
```
Success. No rows returned.
```

### ตรวจสอบว่า tables ถูกสร้างแล้ว:

ไปที่ **Table Editor** (เมนูซ้าย) → ควรเห็น 3 tables:
- ✅ `properties` — ข้อมูลบ้านพัก
- ✅ `availability` — วันว่าง/จอง
- ✅ `scrape_logs` — ประวัติ scrape

---

## ขั้นตอนที่ 4: ตั้งค่า Row Level Security (RLS)

Schema SQL ที่รันไปแล้วจะสร้าง RLS policies ให้อัตโนมัติ แต่ให้ตรวจสอบ:

1. ไปที่ **Authentication** → **Policies** (เมนูซ้าย)
2. ตรวจสอบว่า RLS **enabled** สำหรับทุก table

### Policies ที่ต้องมี:

**ตาราง `properties`:**
| Policy Name | Target | Roles | Action |
|-------------|--------|-------|--------|
| `Public read active properties` | SELECT | `anon` | `is_active = true` |
| `Admin full access` | ALL | `authenticated` | `true` |

**ตาราง `availability`:**
| Policy Name | Target | Roles | Action |
|-------------|--------|-------|--------|
| `Public read availability` | SELECT | `anon` | `true` |
| `Admin full access` | ALL | `authenticated` | `true` |
| `Service role full access` | ALL | `service_role` | `true` |

**ตาราง `scrape_logs`:**
| Policy Name | Target | Roles | Action |
|-------------|--------|-------|--------|
| `Admin read logs` | SELECT | `authenticated` | `true` |
| `Service role full access` | ALL | `service_role` | `true` |

> 💡 ถ้า policies ยังไม่มี → ไปที่ SQL Editor แล้วรัน RLS ส่วนของ `schema.sql` อีกครั้ง

---

## ขั้นตอนที่ 5: สร้าง Admin User

1. ไปที่ **Authentication** → **Users** (เมนูซ้าย)
2. กด **Add user** → **Create new user**
3. กรอก:
   - **Email**: `admin@yourdomain.com` (อีเมลที่ต้องการ)
   - **Password**: ตั้ง password ที่ปลอดภัย
   - **Auto Confirm User**: ✅ เปิด (เพื่อไม่ต้อง verify email)
4. กด **Create user**

> 📝 User นี้จะใช้ login เข้า Admin Panel ที่ `/admin/login`

---

## ขั้นตอนที่ 6: ตั้งค่า Auth (Optional)

### ปิด Email Confirmation (สำหรับ Development):
1. **Authentication** → **Providers** → **Email**
2. ปิด **Confirm email** toggle
3. กด **Save**

### ตั้งค่า Redirect URLs:
1. **Authentication** → **URL Configuration**
2. กรอก:
   - **Site URL**: `http://localhost:3000` (development) หรือ URL ของ Vercel
   - **Redirect URLs**: เพิ่ม `http://localhost:3000/**` และ `https://your-app.vercel.app/**`

---

## ขั้นตอนที่ 7: เพิ่มข้อมูลทดสอบ (Optional)

ใน SQL Editor รันคำสั่งนี้เพื่อเพิ่ม property ตัวอย่าง:

```sql
INSERT INTO properties (name, slug, source, max_guests, bedrooms, bathrooms, base_price, is_active)
VALUES
  ('Villa Sunrise', 'villa-sunrise', 'manual', 10, 3, 2, 5000.00, true),
  ('Pool Villa Deluxe', 'pool-villa-deluxe', 'manual', 8, 2, 2, 3500.00, true),
  ('Beach House Premium', 'beach-house-premium', 'manual', 12, 4, 3, 8000.00, true);
```

---

## สรุป Keys ที่ต้องเก็บ

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

→ ใส่ค่าเหล่านี้ใน `.env.local` (ดู [02-local-development.md](./02-local-development.md))
