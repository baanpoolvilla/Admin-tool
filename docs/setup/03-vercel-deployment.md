# 03 — Vercel Deployment (Deploy ขึ้น Vercel)

## ขั้นตอนที่ 1: สมัคร / Login Vercel

1. ไปที่ [https://vercel.com](https://vercel.com)
2. กด **Sign Up** → เลือก **Continue with GitHub**
3. อนุญาตให้ Vercel เข้าถึง GitHub repositories

---

## ขั้นตอนที่ 2: Push Code ขึ้น GitHub

ถ้ายังไม่มี repository บน GitHub:

```powershell
# อยู่ใน folder villa-dashboard
cd d:\katawutntp\Admin-tool\villa-dashboard

git init
git add .
git commit -m "Initial commit: Villa Dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/villa-dashboard.git
git push -u origin main
```

---

## ขั้นตอนที่ 3: Import Project ใน Vercel

1. ใน Vercel Dashboard → กด **Add New...** → **Project**
2. เลือก **Import Git Repository**  
3. เลือก Repository `villa-dashboard`
4. ตั้งค่า:
   - **Framework Preset**: `Next.js` (Vercel จะ detect อัตโนมัติ)
   - **Root Directory**: `.` (default)
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

---

## ขั้นตอนที่ 4: ตั้งค่า Environment Variables

⚠️ **สำคัญมาก** — ต้องตั้งค่าก่อน Deploy

ใน Vercel → Project Settings → **Environment Variables**:

กด **Add** แล้วเพิ่มทีละตัว:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Production, Preview, Development |
| `SUPABASE_SERVICE_KEY` | `eyJhbGci...` | Production, Preview, Development |
| `GITHUB_TOKEN` | `ghp_xxxxx` | Production |
| `GITHUB_REPO` | `your-username/villa-dashboard` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |

### วิธีเพิ่ม Environment Variable:
1. กรอก **Key** (ชื่อตัวแปร)
2. กรอก **Value** (ค่าจริง)
3. เลือก Environment: ✅ Production, ✅ Preview, ✅ Development
4. กด **Save**

> 💡 **tip**: สามารถ paste ทั้ง `.env.local` ไฟล์ได้โดยกด "Paste .env" ที่มุมขวาบน

---

## ขั้นตอนที่ 5: Deploy

1. กลับไปหน้า Project Overview
2. กด **Deploy** (หรือ Vercel จะ deploy อัตโนมัติเมื่อ push ขึ้น GitHub)
3. รอ build เสร็จ (ประมาณ 1-2 นาที)
4. เมื่อเสร็จจะได้ URL: `https://villa-dashboard-xxxx.vercel.app`

---

## ขั้นตอนที่ 6: ตั้งค่า Custom Domain (Optional)

1. ใน Vercel → Project Settings → **Domains**
2. กรอก domain ที่ต้องการ เช่น `villa.yourdomain.com`
3. Vercel จะแสดง DNS records ที่ต้อง configure:
   - **Type**: `CNAME`
   - **Name**: `villa` (subdomain)
   - **Value**: `cname.vercel-dns.com`
4. ไปที่ DNS provider (เช่น Cloudflare, Namecheap) แล้วเพิ่ม record
5. รอ DNS propagate (อาจใช้เวลา 1-48 ชม.)

---

## ขั้นตอนที่ 7: อัปเดต Supabase Redirect URLs

หลัง deploy ขึ้น Vercel แล้ว ต้องอัปเดต Supabase:

1. ไปที่ Supabase Dashboard → **Authentication** → **URL Configuration**
2. อัปเดต **Site URL**: `https://your-app.vercel.app`
3. เพิ่ม **Redirect URLs**:
   - `https://your-app.vercel.app/**`
   - `https://villa.yourdomain.com/**` (ถ้ามี custom domain)

---

## Auto Deploy (deploy อัตโนมัติ)

Vercel จะ deploy อัตโนมัติเมื่อ:
- **Push ไป `main` branch** → Deploy ขึ้น Production
- **Push ไป branch อื่น** → Deploy เป็น Preview (ได้ URL preview แยก)
- **เปิด Pull Request** → Deploy preview + comment URL ใน PR

ไม่ต้อง configure เพิ่มเติม — Vercel จัดการให้อัตโนมัติ

---

## Build Settings (ตั้งค่า Build)

ตั้งค่าเหล่านี้อยู่ใน Vercel → Project Settings → **General**:

| ตั้งค่า | ค่า | หมายเหตุ |
|---------|-----|----------|
| Framework Preset | Next.js | Auto-detected |
| Node.js Version | 18.x หรือ 20.x | ใน Settings → General |
| Build Command | `next build` | Default |
| Output Directory | `.next` | Default |
| Install Command | `npm install` | Default |

---

## vercel.json (Optional)

โปรเจกต์นี้ไม่จำเป็นต้องมี `vercel.json` เพราะใช้ค่า default ของ Next.js
แต่ถ้าต้องการ customize:

```json
{
  "framework": "nextjs",
  "regions": ["sin1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "s-maxage=60, stale-while-revalidate=300" }
      ]
    }
  ]
}
```

| Option | คำอธิบาย |
|--------|----------|
| `regions` | Server region — `sin1` = Singapore (ใกล้ไทย) |
| `headers` | Custom HTTP headers สำหรับ API routes |

> 💡 สร้างไฟล์ `vercel.json` ที่ root ของ project ถ้าต้องการ

---

## Monitoring & Logs

### ดู Build Logs:
Vercel → Project → **Deployments** → เลือก deployment → **Build Logs**

### ดู Runtime Logs:
Vercel → Project → **Logs** → เลือก Serverless Function

### ดู Analytics:
Vercel → Project → **Analytics** (ต้อง enable ก่อน)

---

## Troubleshooting

### ❌ Build failed: Module not found
→ ตรวจสอบว่า import paths ถูกต้อง (`@/` = `./src/`)
→ ลอง `npm install` ในเครื่องแล้ว push ขึ้นไป

### ❌ 500 Internal Server Error
→ ตรวจสอบ Environment Variables ใน Vercel ว่าครบทุกตัว
→ ดู Runtime Logs ใน Vercel Dashboard

### ❌ Auth ไม่ทำงาน (redirect loop)
→ ตรวจสอบ Supabase Redirect URLs ว่ามี Vercel URL
→ ตรวจสอบว่า `NEXT_PUBLIC_APP_URL` ตรงกับ Vercel URL

### ❌ Images ไม่แสดง
→ ตรวจสอบ `next.config.js` ว่ามี remote patterns สำหรับ domain ที่ใช้
