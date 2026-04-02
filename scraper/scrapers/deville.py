# =============================================================
# scraper/scrapers/deville.py — Deville Groups Scraper
# Scrape ข้อมูล availability จาก devillegroups.com
#
# ใช้ API ตรง (ไม่ต้องใช้ Playwright):
#   - GET getBookings.php?hid={code}&day=YYYY-MM → JSON ข้อมูลจอง
#   - GET nsp.php?bk_day=YYYY-MM-DD&bk_hid={code} → ราคา
#
# getBookings.php response:
#   {
#     status: "success",
#     dt:   [{chkin, chkout, night, st}],   // st: "deville"|"owner"|"waiting"|"repair"
#     hld:  [{chkin, chkout, night, st}],   // st: "holiday"|"hotpro"
#     fire: [{chkin, chkout, night, st}]    // promotions
#   }
#
# สถานะ:
#   - st="deville" / "owner" / "booking" → booked (ติดจอง)
#   - st="waiting"                       → booked (รอโอน/มีจองแล้ว)
#   - st="repair"                        → blocked (ปิดปรับปรุง)
#   - ไม่มีในข้อมูล                      → available (ว่าง)
# =============================================================

import asyncio
import re
import httpx
from datetime import datetime, timedelta
from .base import BaseScraper, ScrapedDate
from config import SCRAPE_DAYS_AHEAD


DEVILLE_API_BASE = "https://www.devillegroups.com/acldl"
DEVILLE_BOOKINGS_URL = f"{DEVILLE_API_BASE}/getBookings.php"
DEVILLE_NSP_URL = f"{DEVILLE_API_BASE}/nsp.php"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": f"{DEVILLE_API_BASE}/",
}


class DevilleScraper(BaseScraper):
    """Scraper สำหรับ devillegroups.com — ดึงสถานะ + ราคารายวัน ผ่าน HTTP API"""

    @property
    def source_name(self) -> str:
        return "deville"

    async def scrape(self, source_url: str, property_code: str) -> list[ScrapedDate]:
        # property_code อาจเป็น "DV-2307" → ต้องใช้แค่ "2307" สำหรับ API
        api_code = property_code.replace("DV-", "") if property_code.startswith("DV-") else property_code

        today = datetime.now().date()
        end_date = today + timedelta(days=SCRAPE_DAYS_AHEAD)
        months_to_scrape = self._get_months_range(today, end_date)

        # สร้างวันทั้งหมดในช่วง → default available
        all_dates: dict[str, ScrapedDate] = {}
        current = today
        while current <= end_date:
            ds = current.strftime("%Y-%m-%d")
            all_dates[ds] = ScrapedDate(date=ds, status="available", price=None)
            current += timedelta(days=1)

        # ดึง booking data จาก API ทุกเดือน
        async with httpx.AsyncClient(timeout=20, headers=HEADERS) as client:
            for ym in months_to_scrape:
                print(f"  [deville] ดึง bookings: {ym}")
                try:
                    resp = await client.get(
                        DEVILLE_BOOKINGS_URL,
                        params={"hid": api_code, "day": ym},
                    )
                    if resp.status_code != 200:
                        print(f"  [deville] HTTP {resp.status_code} สำหรับ {ym}")
                        continue

                    data = resp.json()
                    if data.get("status") != "success":
                        print(f"  [deville] API error สำหรับ {ym}")
                        continue

                    # Process bookings (dt)
                    for bk in data.get("dt", []):
                        status = self._booking_status(bk.get("st", ""))
                        self._mark_range(all_dates, bk["chkin"], bk["chkout"], status)

                    # Process repairs/blocked from hld
                    for hld in data.get("hld", []):
                        if hld.get("st") == "holiday":
                            continue  # วันหยุด = ยังว่างอยู่
                        self._mark_range(all_dates, hld["chkin"], hld["chkout"], "blocked")

                except Exception as e:
                    print(f"  [deville] Error fetching {ym}: {e}")

                await self._delay(0.5)

            # ดึงราคาสำหรับวันที่ว่าง
            available_dates = [sd for sd in all_dates.values() if sd.status == "available"]
            if available_dates:
                print(f"  [deville] ดึงราคา {len(available_dates)} วัน...")
                await self._fetch_prices(client, available_dates, api_code)

        results = list(all_dates.values())
        print(f"  [deville] scrape เสร็จ: {len(results)} วัน")
        return results

    def _booking_status(self, st: str) -> str:
        """แปลง booking status จาก API เป็นสถานะภายใน"""
        st_lower = st.lower()
        if st_lower == "repair":
            return "blocked"
        if st_lower == "waiting":
            return "booked"
        # deville, owner, booking → booked
        return "booked"

    def _mark_range(
        self,
        all_dates: dict[str, ScrapedDate],
        chkin: str,
        chkout: str,
        status: str,
    ):
        """ทำเครื่องหมายวันในช่วง [chkin, chkout) เป็นสถานะที่กำหนด"""
        try:
            start = datetime.strptime(chkin, "%Y-%m-%d").date()
            end = datetime.strptime(chkout, "%Y-%m-%d").date()
            current = start
            while current < end:
                ds = current.strftime("%Y-%m-%d")
                if ds in all_dates:
                    all_dates[ds].status = status
                current += timedelta(days=1)
        except (ValueError, KeyError) as e:
            print(f"  [deville] ข้าม range {chkin}-{chkout}: {e}")

    async def _fetch_prices(
        self, client: httpx.AsyncClient, dates: list[ScrapedDate], hid: str
    ):
        """ดึงราคาจาก nsp.php สำหรับวันที่ว่าง"""
        for sd in dates:
            try:
                resp = await client.get(
                    DEVILLE_NSP_URL,
                    params={"bk_day": sd.date, "bk_hid": hid},
                )
                if resp.status_code == 200:
                    price = self._parse_nsp_response(resp.text)
                    if price is not None:
                        sd.price = price
                await asyncio.sleep(0.3)  # rate limit
            except Exception as e:
                print(f"  [deville] ดึงราคา {sd.date} ผิดพลาด: {e}")

    def _parse_nsp_response(self, html: str) -> float | None:
        """
        Parse response จาก nsp.php
        ตัวอย่าง: '<p>5,000 / 12 ท่าน</p>'
        ดึงเฉพาะตัวเลขแรก = ราคา
        """
        match = re.search(r"([\d,]+)\s*/\s*\d+\s*ท่าน", html)
        if match:
            price_str = match.group(1).replace(",", "")
            try:
                return float(price_str)
            except ValueError:
                pass
        return None

    def _get_months_range(self, start, end) -> list[str]:
        """สร้าง list ของ YYYY-MM"""
        months = []
        current = start.replace(day=1)
        while current <= end:
            months.append(current.strftime("%Y-%m"))
            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 1)
        return months
