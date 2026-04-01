# =============================================================
# scraper/scrapers/base.py — Base Scraper Class
# คลาสแม่สำหรับ scraper ทุกตัว
# กำหนด interface และ shared logic
# =============================================================

import asyncio
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional
from dataclasses import dataclass


@dataclass
class ScrapedDate:
    """ผลลัพธ์จากการ scrape วันเดียว"""
    date: str                           # YYYY-MM-DD
    status: str                         # 'available' | 'booked'
    price: Optional[float] = None       # ราคาต่อคืน (บาท), None ถ้าดึงไม่ได้


class BaseScraper(ABC):
    """
    Base class สำหรับ scraper ทุกตัว
    
    วิธีใช้:
        scraper = DevilleScraper()
        results = await scraper.scrape(source_url, property_code)
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """ชื่อ source เช่น 'deville', 'poolvillacity'"""
        pass

    @abstractmethod
    async def scrape(self, source_url: str, property_code: str) -> list[ScrapedDate]:
        """
        Scrape ข้อมูล availability จาก URL ที่กำหนด
        
        Args:
            source_url: URL ของหน้าบ้านพัก
            property_code: รหัสบ้านพักในเว็บต้นทาง
            
        Returns:
            list ของ ScrapedDate
        """
        pass

    def _now_iso(self) -> str:
        """เวลาปัจจุบันในรูปแบบ ISO (UTC)"""
        return datetime.now(timezone.utc).isoformat()

    async def _delay(self, seconds: float = 1.5):
        """หน่วงเวลาเพื่อป้องกัน rate limit"""
        await asyncio.sleep(seconds)
