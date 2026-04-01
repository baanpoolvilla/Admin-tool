# =============================================================
# scraper/scrapers/deville.py — Deville Groups Scraper
# Scrape ข้อมูล availability จาก devillegroups.com
#
# โครงสร้างเว็บ:
#   - Calendar อยู่ใน iframe: cld.php?hId={code}&ym=YYYY-MM
#   - แต่ละวันเป็น <td data-day="YYYY-MM-DD" class="bk ...">
#   - AJAX getBookings.php เพิ่มสี/สถานะหลัง page load
#   - คลิกวันที่ว่าง → AJAX GET nsp.php?bk_day=&bk_hid= → ราคา
#
# สี + class:
#   - class "repair" / orange = ปิดปรับปรุง (blocked)
#   - class "owner"  / red   = ติดจอง (booked)
#   - class "waiting" / green = รอโอน/มีจองแล้ว (booked)
#   - class "booking" / red   = ติดจอง (booked)
#   - yellow                  = วันหยุด (available)
#   - ไม่มีสี (class "bk")   = ว่าง (available)
#
# ราคาจาก nsp.php response:
#   <h3>วันที่ 1 เม.ย.69</h3>
#   <p>5,000 / 12 ท่าน</p>
# =============================================================

import asyncio
import re
import httpx
from datetime import datetime, timedelta
from playwright.async_api import async_playwright
from .base import BaseScraper, ScrapedDate
from config import HEADLESS, PAGE_TIMEOUT, SCRAPE_DAYS_AHEAD


DEVILLE_IFRAME_BASE = "https://www.devillegroups.com/acld/cld.php"
DEVILLE_NSP_URL = "https://www.devillegroups.com/acld/nsp.php"


class DevilleScraper(BaseScraper):
    """Scraper สำหรับ devillegroups.com — ดึงสถานะ + ราคารายวัน"""

    @property
    def source_name(self) -> str:
        return "deville"

    async def scrape(self, source_url: str, property_code: str) -> list[ScrapedDate]:
        results: list[ScrapedDate] = []

        today = datetime.now().date()
        end_date = today + timedelta(days=SCRAPE_DAYS_AHEAD)
        months_to_scrape = self._get_months_range(today, end_date)

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=HEADLESS)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 720},
                locale="th-TH",
            )

            try:
                for ym in months_to_scrape:
                    url = f"{DEVILLE_IFRAME_BASE}?hId={property_code}&ym={ym}"
                    print(f"  [deville] เปิด calendar: {ym}")

                    page = await context.new_page()
                    page.set_default_timeout(PAGE_TIMEOUT)

                    await page.goto(url, wait_until="networkidle")
                    await asyncio.sleep(3)  # รอ AJAX getBookings.php

                    month_results = await self._parse_calendar_page(
                        page, today, end_date
                    )
                    results.extend(month_results)

                    await page.close()
                    await self._delay(1)

            except Exception as e:
                print(f"  [deville] Error: {e}")
                raise
            finally:
                await browser.close()

        # Deduplicate
        seen: set[str] = set()
        unique: list[ScrapedDate] = []
        for r in results:
            if r.date not in seen:
                seen.add(r.date)
                unique.append(r)

        # ดึงราคาสำหรับวันที่ว่าง ผ่าน HTTP ตรง (เร็วกว่าคลิก)
        available_dates = [r for r in unique if r.status == "available"]
        if available_dates:
            print(f"  [deville] ดึงราคา {len(available_dates)} วัน...")
            await self._fetch_prices(available_dates, property_code)

        print(f"  [deville] scrape เสร็จ: {len(unique)} วัน")
        return unique

    async def _fetch_prices(self, dates: list[ScrapedDate], hid: str):
        """ดึงราคาจาก nsp.php สำหรับวันที่ว่าง (ใช้ HTTP ตรง)"""
        async with httpx.AsyncClient(timeout=15) as client:
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

    async def _parse_calendar_page(self, page, start_date, end_date):
        """Parse td[data-day] จากหน้า calendar iframe"""
        results = []

        tds = await page.query_selector_all("td[data-day]")
        for td in tds:
            try:
                date_str = await td.get_attribute("data-day")
                if not date_str:
                    continue

                cell_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                if cell_date < start_date or cell_date > end_date:
                    continue

                cls = await td.get_attribute("class") or ""
                bg_color = await page.evaluate(
                    "(el) => el.style.backgroundColor || "
                    "window.getComputedStyle(el).backgroundColor",
                    td,
                )

                status = self._determine_status(cls, bg_color)

                results.append(ScrapedDate(
                    date=date_str,
                    status=status,
                    price=None,  # ราคาจะเติมทีหลังจาก nsp.php
                ))

            except Exception as e:
                print(f"  [deville] ข้าม cell: {e}")
                continue

        return results

    def _determine_status(self, css_class: str, bg_color: str) -> str:
        """แปลง class + สีเป็นสถานะ"""
        cls_lower = css_class.lower()

        # Class-based (server + JS-rendered)
        if "repair" in cls_lower:
            return "blocked"
        if "owner" in cls_lower or "booking" in cls_lower:
            return "booked"
        if "waiting" in cls_lower:
            return "booked"

        # Color-based
        color = self._parse_color(bg_color)
        if color:
            r, g, b = color
            if r > 200 and g < 80 and b < 80:      # red → booked
                return "booked"
            if g > 200 and r < 80 and b < 80:       # green → booked
                return "booked"
            if r > 200 and 80 < g < 160 and b < 50: # orange → blocked
                return "blocked"
            # yellow → วันหยุด (ว่าง)

        return "available"

    def _parse_color(self, color_str: str):
        """แปลง rgb/rgba/named color เป็น (r,g,b)"""
        if not color_str:
            return None

        match = re.search(
            r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", color_str
        )
        if match:
            r, g, b = int(match.group(1)), int(match.group(2)), int(match.group(3))
            if r == 0 and g == 0 and b == 0:
                alpha_match = re.search(r",\s*([\d.]+)\s*\)", color_str)
                if alpha_match and float(alpha_match.group(1)) == 0:
                    return None
            return (r, g, b)

        named = color_str.strip().lower()
        return {
            "red": (255, 0, 0),
            "green": (0, 255, 0),
            "orange": (255, 124, 0),
            "yellow": (255, 255, 0),
        }.get(named)

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
