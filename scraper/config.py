# =============================================================
# scraper/config.py — Scraper Configuration
# ค่าตั้งต้นสำหรับ scraper ทั้งหมด
# แยกออกจาก logic เพื่อให้แก้ไขง่าย
# =============================================================

import os
from dotenv import load_dotenv

# โหลด .env (ถ้ามี — ใน GitHub Actions จะใช้ secrets แทน)
load_dotenv()

# --- Supabase Connection ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# --- Scraper Settings ---
# จำนวนวันที่จะ scrape ล่วงหน้า
SCRAPE_DAYS_AHEAD = 60

# หน่วงเวลาระหว่าง request (วินาที) — ป้องกัน rate limit
REQUEST_DELAY = 1.5

# Timeout สำหรับ Playwright (มิลลิวินาที)
PAGE_TIMEOUT = 30000

# ใช้ headless browser (True ใน production, False สำหรับ debug)
HEADLESS = True

# --- URL Patterns ---
DEVILLE_URL_PATTERN = "https://www.devillegroups.com/acld/?s={property_code}"
