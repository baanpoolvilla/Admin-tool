# 04 — GitHub Actions (ตั้งค่า Auto Scraper)

## ภาพรวม

GitHub Actions จะรัน Python scraper **อัตโนมัติทุก 12 ชั่วโมง** (00:00 และ 12:00 UTC)
เพื่อดึงข้อมูลวันว่าง/จอง จากเว็บไซต์ต้นทาง แล้วบันทึกลง Supabase

```
GitHub Actions Runner
  └─ Python 3.11
      └─ Playwright (Headless Chromium)
          ├─ scrape devillegroups.com
          ├─ scrape poolvillacity.com
          └─ upsert → Supabase (availability table)
```

---

## ขั้นตอนที่ 1: Push Code ขึ้น GitHub

ตรวจสอบว่า repository มีไฟล์ `.github/workflows/scrape.yml`:

```
villa-dashboard/
├── .github/
│   └── workflows/
│       └── scrape.yml    ← ไฟล์ workflow
├── scraper/
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   └── scrapers/
│       ├── __init__.py
│       ├── base.py
│       ├── deville.py
│       └── poolvillacity.py
```

---

## ขั้นตอนที่ 2: ตั้งค่า GitHub Secrets

1. ไปที่ GitHub Repository → **Settings**
2. เมนูซ้าย → **Secrets and variables** → **Actions**
3. กด **New repository secret** แล้วเพิ่ม:

| Secret Name | Value | ได้จากไหน |
|-------------|-------|-----------|
| `SUPABASE_URL` | `https://xxxxxxxxxx.supabase.co` | Supabase Dashboard → API |
| `SUPABASE_SERVICE_KEY` | `eyJhbGci...` (service_role key) | Supabase Dashboard → API |

### วิธีเพิ่ม Secret:
1. กด **New repository secret**
2. **Name**: `SUPABASE_URL`
3. **Secret**: paste URL ของ Supabase project
4. กด **Add secret**
5. ทำซ้ำสำหรับ `SUPABASE_SERVICE_KEY`

> ⚠️ GitHub Secrets จะแสดงเป็น `***` หลังบันทึก — ดูค่าไม่ได้อีก ต้อง update ใหม่ถ้าจะเปลี่ยน

---

## ขั้นตอนที่ 3: ตรวจสอบ Workflow File

ไฟล์ `.github/workflows/scrape.yml`:

```yaml
name: Scrape Villa Availability

on:
  # รันอัตโนมัติทุก 12 ชั่วโมง
  schedule:
    - cron: "0 */12 * * *"   # 00:00 UTC, 12:00 UTC (07:00, 19:00 เวลาไทย)

  # รัน manual ได้จาก GitHub UI
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: pip install -r scraper/requirements.txt

      - name: Install Playwright browsers
        run: playwright install chromium

      - name: Run scraper
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: python scraper/main.py
```

---

## ขั้นตอนที่ 4: ทดสอบ Manual Run

1. ไปที่ GitHub Repository → **Actions** tab
2. เลือก workflow **"Scrape Villa Availability"** (เมนูซ้าย)
3. กด **Run workflow** (ปุ่มสีน้ำเงิน ขวาบน)
4. เลือก branch: `main`
5. กด **Run workflow**

### ดูผลลัพธ์:
- กดเข้า workflow run ที่เพิ่งรัน
- กด **scrape** job → ดู logs ของแต่ละ step
- ควรเห็น output เช่น:
  ```
  Starting scrape for 3 properties...
  ✓ Villa Sunrise: 60 dates scraped
  ✓ Pool Villa Deluxe: 60 dates scraped
  Done! 2 properties updated, 120 dates total
  ```

---

## ขั้นตอนที่ 5: ปรับแต่ง Schedule (Optional)

### เปลี่ยนความถี่:

| Cron Expression | ความถี่ | เวลาไทย (UTC+7) |
|----------------|---------|-----------------|
| `0 */12 * * *` | ทุก 12 ชม. | 07:00, 19:00 |
| `0 */6 * * *` | ทุก 6 ชม. | 07:00, 13:00, 19:00, 01:00 |
| `0 0 * * *` | วันละครั้ง | 07:00 |
| `0 */4 * * *` | ทุก 4 ชม. | 07:00, 11:00, 15:00, 19:00, 23:00, 03:00 |

แก้ไขใน `.github/workflows/scrape.yml`:
```yaml
schedule:
  - cron: "0 */6 * * *"    # เปลี่ยนเป็นทุก 6 ชั่วโมง
```

> 💡 GitHub Actions Free tier: 2,000 minutes/เดือน สำหรับ private repo
> Public repo: ไม่จำกัด

---

## ขั้นตอนที่ 6: Trigger จาก Admin Panel (Optional)

Admin Panel มีปุ่ม **"Trigger Scrape"** ที่เรียก GitHub Actions ผ่าน API

### ต้องการ:
1. **GitHub Personal Access Token (PAT)** ที่มี scope `repo`
2. ตั้งค่าใน `.env.local` (local) หรือ Vercel Environment Variables (production):

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=your-username/villa-dashboard
```

### สร้าง GitHub PAT:
1. GitHub → **Settings** → **Developer Settings** → **Personal access tokens** → **Tokens (classic)**
2. กด **Generate new token (classic)**
3. ตั้งชื่อ: `villa-dashboard-scraper`
4. เลือก scope: ✅ `repo` (Full control of private repositories)
5. กด **Generate token**
6. **คัดลอก token** (จะเห็นได้ครั้งเดียว!)

### API Endpoint:
```
POST /api/scrape/trigger
Authorization: ต้อง login เป็น admin
```

Endpoint นี้จะเรียก GitHub API:
```
POST https://api.github.com/repos/{owner}/{repo}/actions/workflows/scrape.yml/dispatches
```

---

## Monitoring Workflow Runs

### ดู History:
GitHub → **Actions** tab → เลือก workflow → ดู run history

### ตั้งค่า Notification:
GitHub → **Settings** → **Notifications** → เปิด **Actions** notifications
→ จะได้ email เมื่อ workflow fail

### ดู Scrape Logs ใน Supabase:
```sql
SELECT * FROM scrape_logs ORDER BY started_at DESC LIMIT 10;
```

---

## Troubleshooting

### ❌ Workflow ไม่ run ตาม schedule
→ GitHub จะไม่รัน scheduled workflow ถ้า repo ไม่มี activity ใน 60 วัน
→ แก้: push commit หรือ manual run หนึ่งครั้ง

### ❌ `SUPABASE_URL` not found
→ ตรวจสอบว่าตั้ง GitHub Secrets ถูกชื่อ (`SUPABASE_URL` ไม่ใช่ `NEXT_PUBLIC_SUPABASE_URL`)

### ❌ Playwright install failed
→ GitHub Actions runner ต้องการ `playwright install chromium`
→ ตรวจสอบ step ใน workflow yml

### ❌ Scraper timeout
→ Default timeout: 30 minutes
→ ถ้ามี property เยอะ ให้เพิ่ม: `timeout-minutes: 60`

### ❌ Rate limiting
→ Scraper มี delay ระหว่าง request (1.5 วินาที)
→ ถ้าถูก block ให้เพิ่ม delay ใน `scraper/config.py`: `REQUEST_DELAY = 3.0`
