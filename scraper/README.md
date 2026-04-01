# 🕷️ Villa Scraper

Python web scraper สำหรับดึงข้อมูล availability จากเว็บไซต์บ้านพัก

## รองรับแหล่งข้อมูล

| Source | Website | Scraper File |
|--------|---------|-------------|
| Deville Groups | devillegroups.com | `scrapers/deville.py` |
| Pool Villa City | poolvillacity.com | `scrapers/poolvillacity.py` |

## วิธีใช้

### 1. ติดตั้ง Dependencies
```bash
cd scraper
pip install -r requirements.txt
playwright install chromium
```

### 2. ตั้งค่า Environment
สร้างไฟล์ `.env` ใน folder `scraper/`:
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

### 3. รัน Scraper
```bash
python main.py
```

## โครงสร้างไฟล์

```
scraper/
├── main.py              # ตัวหลัก — ประสานงาน scraper ทุกตัว
├── config.py            # ค่าตั้งต้น (URL, timeout, etc.)
├── requirements.txt     # Python dependencies
├── scrapers/
│   ├── __init__.py
│   ├── base.py          # Base class สำหรับ scraper
│   ├── deville.py       # Scraper สำหรับ Deville Groups
│   └── poolvillacity.py # Scraper สำหรับ Pool Villa City
└── README.md            # ไฟล์นี้
```

## การเพิ่ม Scraper ใหม่

1. สร้างไฟล์ใหม่ใน `scrapers/` เช่น `scrapers/newsource.py`
2. สืบทอดจาก `BaseScraper` และ implement `scrape()` method
3. เพิ่มเข้าไปใน `SCRAPERS` dict ใน `main.py`

## หมายเหตุ
- Scraper ใช้ Playwright (Chromium) เพราะเว็บต้นทางใช้ JavaScript render
- หน่วงเวลา 1.5 วินาทีระหว่าง request เพื่อป้องกัน rate limit
- Scrape ข้อมูลล่วงหน้า 60 วัน จากวันปัจจุบัน
