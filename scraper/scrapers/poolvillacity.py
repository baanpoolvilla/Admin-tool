# =============================================================
# scraper/scrapers/poolvillacity.py — Pool Villa City Scraper
# Scrape ข้อมูล availability จาก poolvillacity.co.th
#
# วิธีการ: ใช้ API ตรง (ไม่ต้อง Playwright!)
#   GET /api/customer/house/info/{code}
#   Response มี:
#     - priceHouse.every_day: ราคาตามวันในสัปดาห์
#       [{day: "Mon", sum: 1990, accommodate_number: 2}, ...]
#     - priceHouse.holiday: ราคาพิเศษวันหยุด
#       [{date: ["2026-04-14", ...], sum: 3500}, ...]
#     - priceHouse.book: รายการจอง
#       [{date_start: "2026-04-01", date_end: "2026-04-05", status: {...}}, ...]
# =============================================================

import re
from datetime import datetime, timedelta
import httpx
from .base import BaseScraper, ScrapedDate
from config import SCRAPE_DAYS_AHEAD


POOLVILLACITY_API = "https://api.poolvillacity.co.th/next-villapaza/api"

# Mapping วันในสัปดาห์
DAY_MAP = {
    0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu",
    4: "Fri", 5: "Sat", 6: "Sun",
}


class PoolVillaCityScraper(BaseScraper):
    """Scraper สำหรับ poolvillacity.co.th — ใช้ API, ดึงราคารายวัน"""

    @property
    def source_name(self) -> str:
        return "poolvillacity"

    async def scrape(self, source_url: str, property_code: str) -> list[ScrapedDate]:
        # ดึง house code จาก URL หรือ property_code
        code = property_code
        if not code and source_url:
            match = re.search(r"(CITY-\d+)", source_url)
            if match:
                code = match.group(1)

        if not code:
            raise ValueError("ไม่มี property code สำหรับ poolvillacity")

        print(f"  [poolvillacity] เรียก API: {code}")

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{POOLVILLACITY_API}/customer/house/info/{code}"
            )
            resp.raise_for_status()
            data = resp.json()

        result_data = data.get("result", {})
        price_house = result_data.get("priceHouse", {})

        # 1. ราคาตามวันในสัปดาห์
        weekday_prices = self._build_weekday_prices(
            price_house.get("every_day", [])
        )
        print(f"  [poolvillacity] ราคาตามวัน: {weekday_prices}")

        # 2. ราคาวันหยุด (override weekday)
        holiday_prices = self._build_holiday_prices(
            price_house.get("holiday", [])
        )
        if holiday_prices:
            print(f"  [poolvillacity] วันหยุดพิเศษ: {len(holiday_prices)} วัน")

        # 3. วันที่ถูกจอง
        booked_dates = self._build_booked_dates(
            price_house.get("book", [])
        )
        if booked_dates:
            print(f"  [poolvillacity] วันจอง: {len(booked_dates)} วัน")

        # 4. สร้างผลลัพธ์รายวัน
        today = datetime.now().date()
        end_date = today + timedelta(days=SCRAPE_DAYS_AHEAD)

        results: list[ScrapedDate] = []
        current = today
        while current <= end_date:
            date_str = current.isoformat()

            if date_str in booked_dates:
                results.append(ScrapedDate(
                    date=date_str, status="booked", price=None
                ))
            else:
                # Holiday price → weekday default
                price = holiday_prices.get(date_str)
                if price is None:
                    day_name = DAY_MAP.get(current.weekday(), "Mon")
                    price = weekday_prices.get(day_name)

                results.append(ScrapedDate(
                    date=date_str, status="available", price=price
                ))

            current += timedelta(days=1)

        print(f"  [poolvillacity] scrape เสร็จ: {len(results)} วัน")
        return results

    def _build_weekday_prices(self, every_day: list) -> dict:
        """สร้าง map {day_name: price}"""
        prices = {}
        for entry in every_day:
            day = entry.get("day", "")
            total = entry.get("sum") or entry.get("price", 0)
            if day and total:
                prices[day] = float(total)
        return prices

    def _build_holiday_prices(self, holidays: list) -> dict:
        """สร้าง map {YYYY-MM-DD: price} สำหรับ holiday dates"""
        prices = {}
        for entry in holidays:
            total = entry.get("sum") or entry.get("price", 0)
            if not total:
                continue
            for date_str in entry.get("date", []):
                clean = date_str[:10]
                prices[clean] = float(total)
        return prices

    def _build_booked_dates(self, bookings: list) -> set:
        """สร้าง set ของวันที่จองแล้ว"""
        booked = set()
        for entry in bookings:
            start = entry.get("date_start", "")
            end = entry.get("date_end", "")
            if not start or not end:
                continue
            try:
                s = datetime.fromisoformat(
                    start.replace("Z", "+00:00")
                ).date()
                e = datetime.fromisoformat(
                    end.replace("Z", "+00:00")
                ).date()
                current = s
                while current <= e:
                    booked.add(current.isoformat())
                    current += timedelta(days=1)
            except (ValueError, TypeError):
                continue
        return booked
