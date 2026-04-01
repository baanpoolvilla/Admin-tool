# 05 — Python Scraper Setup (ตั้งค่า Scraper)

## ภาพรวม

Python scraper ใช้ **Playwright** (headless browser) เพื่อ scrape ข้อมูลวันว่าง/จองจาก:
- **devillegroups.com** — ระบบจองบ้านพัก Deville
- **poolvillacity.com** — ระบบจองบ้านพัก Pool Villa City

Scraper จะ:
1. ดึงรายการ properties จาก Supabase (เฉพาะ `source = 'deville' | 'poolvillacity'`)
2. เปิดหน้าเว็บแต่ละ property ด้วย headless browser
3. อ่านปฏิทิน → จับสถานะ (available/booked) + ราคา
4. Upsert ลง Supabase `availability` table

---

## ตั้งค่าในเครื่อง (Local Development)

### Prerequisites:
| เครื่องมือ | Version | ติดตั้ง |
|-----------|---------|--------|
| Python | 3.10+ | [python.org](https://python.org) หรือ `winget install Python.Python.3.11` |
| pip | มากับ Python | - |

### ขั้นตอน:

```powershell
# 1. เข้า folder scraper
cd d:\katawutntp\Admin-tool\villa-dashboard\scraper

# 2. สร้าง virtual environment (แนะนำ)
python -m venv venv
.\venv\Scripts\Activate.ps1    # Windows PowerShell
# source venv/bin/activate     # macOS/Linux

# 3. ติดตั้ง dependencies
pip install -r requirements.txt

# 4. ติดตั้ง browser สำหรับ Playwright
playwright install chromium

# 5. สร้างไฟล์ .env สำหรับ scraper
```

### สร้างไฟล์ `scraper/.env`:

```env
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
```

> ⚠️ Scraper ใช้ `SUPABASE_URL` (ไม่ใช่ `NEXT_PUBLIC_SUPABASE_URL`)
> ⚠️ ใช้ `SUPABASE_SERVICE_KEY` เพราะ scraper ต้อง bypass RLS เพื่อ write ข้อมูล

---

## รัน Scraper ด้วยมือ

```powershell
cd d:\katawutntp\Admin-tool\villa-dashboard\scraper
python main.py
```

### Output ตัวอย่าง:
```
[2024-01-15 07:00:01] Starting villa availability scraper
[2024-01-15 07:00:02] Found 3 properties to scrape
[2024-01-15 07:00:15] ✓ Villa Sunrise (deville): 60 dates scraped, 45 available, 15 booked
[2024-01-15 07:00:28] ✓ Pool Villa Deluxe (poolvillacity): 60 dates scraped, 52 available, 8 booked
[2024-01-15 07:00:30] ✗ Beach House Premium: Error - Calendar not found
[2024-01-15 07:00:31] Scrape complete: 2/3 success, 120 dates updated
```

---

## โครงสร้างไฟล์ Scraper

```
scraper/
├── main.py              # Entry point — orchestrates scraping
├── config.py            # Configuration settings
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (local only)
└── scrapers/
    ├── __init__.py      # Package init
    ├── base.py          # BaseScraper abstract class + ScrapedDate dataclass
    ├── deville.py       # Scraper for devillegroups.com
    └── poolvillacity.py # Scraper for poolvillacity.com
```

---

## Configuration (scraper/config.py)

| ค่า | Default | คำอธิบาย |
|-----|---------|----------|
| `SCRAPE_DAYS_AHEAD` | `60` | จำนวนวันล่วงหน้าที่จะ scrape |
| `REQUEST_DELAY` | `1.5` | หน่วงเวลาระหว่าง request (วินาที) — ป้องกัน rate limit |
| `PAGE_TIMEOUT` | `30000` | Timeout สำหรับโหลดหน้าเว็บ (มิลลิวินาที) |
| `HEADLESS` | `True` | รันแบบไม่แสดงหน้าต่าง browser |
| `BATCH_SIZE` | `50` | จำนวน records ที่ upsert ต่อครั้ง |

### ปรับแต่ง:
แก้ไขไฟล์ `scraper/config.py` โดยตรง หรือตั้งค่าผ่าน environment variable

---

## เพิ่ม Property สำหรับ Scrape

ใน Supabase (Table Editor หรือ Admin Panel) เพิ่ม property ที่มี:

| Field | ค่าที่ต้องการ |
|-------|--------------|
| `source` | `deville` หรือ `poolvillacity` |
| `source_url` | URL ของหน้า property |
| `source_property_id` | รหัส property จากเว็บต้นทาง |
| `is_active` | `true` |

### ตัวอย่าง SQL:
```sql
INSERT INTO properties (name, slug, source, source_url, source_property_id, is_active)
VALUES (
  'Villa Example',
  'villa-example',
  'deville',
  'https://www.devillegroups.com/property/example',
  'DEV001',
  true
);
```

---

## เพิ่ม Scraper ใหม่ (Custom Source)

ถ้าต้องการ scrape จากเว็บไซต์อื่น:

### 1. สร้างไฟล์ `scraper/scrapers/newsite.py`:

```python
from playwright.async_api import async_playwright
from .base import BaseScraper, ScrapedDate
from config import PAGE_TIMEOUT, REQUEST_DELAY

class NewSiteScraper(BaseScraper):
    async def scrape(self, source_url: str, property_code: str) -> list[ScrapedDate]:
        results = []
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            await page.goto(source_url, timeout=PAGE_TIMEOUT)

            # TODO: implement calendar scraping logic
            # ...

            await browser.close()
        return results
```

### 2. Register ใน `scraper/scrapers/__init__.py`:
```python
from .newsite import NewSiteScraper
```

### 3. เพิ่มใน `scraper/main.py`:
```python
from scrapers.newsite import NewSiteScraper

SCRAPERS = {
    "deville": DevilleScraper(),
    "poolvillacity": PoolVillaCityScraper(),
    "newsite": NewSiteScraper(),  # เพิ่มตรงนี้
}
```

### 4. เพิ่ม property ใน Supabase ที่มี `source = 'newsite'`

---

## Debug Mode

### เปิด browser แบบมีหน้าต่าง (ดู scraping ทำงาน):

แก้ `scraper/config.py`:
```python
HEADLESS = False  # เปลี่ยนจาก True เป็น False
```

### เพิ่ม request delay (ถ้าถูก block):
```python
REQUEST_DELAY = 3.0  # เพิ่มจาก 1.5 เป็น 3 วินาที
```

---

## Troubleshooting

### ❌ `ModuleNotFoundError: No module named 'playwright'`
```powershell
pip install -r requirements.txt
playwright install chromium
```

### ❌ `BrowserType.launch: Executable doesn't exist`
```powershell
playwright install chromium
```

### ❌ `Calendar not found` (scraper ไม่เจอปฏิทิน)
→ เว็บไซต์ต้นทางอาจเปลี่ยน HTML structure
→ เปิด `HEADLESS = False` แล้วดูว่าหน้าเว็บโหลดอะไร
→ อัปเดต CSS selectors ใน scraper file ที่เกี่ยวข้อง

### ❌ `TimeoutError: page.goto timed out`
→ เว็บไซต์ต้นทางอาจ down หรือช้า
→ เพิ่ม `PAGE_TIMEOUT = 60000` ใน config.py

### ❌ ราคาเป็น `null` ทั้งหมด
→ เว็บไซต์อาจไม่แสดงราคาในปฏิทิน
→ ตรวจสอบ price selectors ใน scraper file
