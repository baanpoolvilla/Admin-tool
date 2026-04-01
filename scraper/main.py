# =============================================================
# scraper/main.py — Main Scraper Entry Point
# ตัวหลักที่ประสานงาน scraper ทุกตัว
#
# ขั้นตอนการทำงาน:
# 1. เชื่อมต่อ Supabase ด้วย service_role key
# 2. ดึงรายการ properties ที่ active + source = deville/poolvillacity
# 3. เรียก scraper ที่เหมาะสมสำหรับแต่ละ property
# 4. Upsert ผลลัพธ์ลง availability table
# 5. บันทึก log ลง scrape_logs table
# =============================================================

import asyncio
import sys
from datetime import datetime, timezone

from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY
from scrapers.deville import DevilleScraper
from scrapers.poolvillacity import PoolVillaCityScraper


# --- Mapping: source name → scraper class ---
SCRAPERS = {
    "deville": DevilleScraper(),
    "poolvillacity": PoolVillaCityScraper(),
}


async def main():
    """รัน scraper ทั้งหมด"""
    print("=" * 60)
    print("Villa Availability Scraper")
    print(f"เวลาเริ่ม: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    # --- ตรวจสอบ config ---
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Error: SUPABASE_URL และ SUPABASE_SERVICE_KEY ต้องถูกกำหนด")
        sys.exit(1)

    # --- เชื่อมต่อ Supabase ---
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ เชื่อมต่อ Supabase สำเร็จ")

    # --- บันทึก log เริ่มต้น ---
    started_at = datetime.now(timezone.utc).isoformat()
    log_entry = {
        "source": "all",
        "status": "success",
        "properties_updated": 0,
        "dates_updated": 0,
        "started_at": started_at,
    }

    # --- ดึง properties ที่ต้อง scrape ---
    result = supabase.table("properties").select("*").eq("is_active", True).in_("source", ["deville", "poolvillacity"]).execute()

    properties = result.data
    print(f"\n📋 พบ {len(properties)} properties ที่ต้อง scrape")

    total_properties_updated = 0
    total_dates_updated = 0
    errors = []

    # --- วนลูป scrape แต่ละ property ---
    for prop in properties:
        property_name = prop["name"]
        source = prop["source"]
        source_url = prop.get("source_url", "")
        source_property_id = prop.get("source_property_id", "")

        print(f"\n🏠 [{source}] {property_name} (code: {source_property_id})")

        # เลือก scraper ที่เหมาะสม
        scraper = SCRAPERS.get(source)
        if not scraper:
            print(f"  ⚠️ ไม่มี scraper สำหรับ source '{source}' — ข้าม")
            continue

        if not source_url:
            print(f"  ⚠️ ไม่มี source_url — ข้าม")
            continue

        try:
            # เรียก scraper
            scraped_dates = await scraper.scrape(source_url, source_property_id)

            if not scraped_dates:
                print(f"  ⚠️ ไม่พบข้อมูล")
                continue

            # Upsert ผลลัพธ์ลง Supabase
            now_iso = datetime.now(timezone.utc).isoformat()
            upsert_data = [
                {
                    "property_id": prop["id"],
                    "date": sd.date,
                    "status": sd.status,
                    "price": sd.price,
                    "source": "scraper",
                    "scraped_at": now_iso,
                }
                for sd in scraped_dates
            ]

            # Upsert ทีละ batch (50 records)
            batch_size = 50
            for i in range(0, len(upsert_data), batch_size):
                batch = upsert_data[i : i + batch_size]
                supabase.table("availability").upsert(
                    batch, on_conflict="property_id,date"
                ).execute()

            total_properties_updated += 1
            total_dates_updated += len(scraped_dates)
            print(f"  ✅ อัปเดต {len(scraped_dates)} วัน")

        except Exception as e:
            error_msg = f"[{source}] {property_name}: {str(e)}"
            errors.append(error_msg)
            print(f"  ❌ Error: {e}")
            # ไม่หยุดทั้งหมด — ทำต่อกับ property อื่น

    # --- บันทึก log ---
    finished_at = datetime.now(timezone.utc).isoformat()
    log_entry.update({
        "properties_updated": total_properties_updated,
        "dates_updated": total_dates_updated,
        "finished_at": finished_at,
        "status": "error" if errors and total_properties_updated == 0 else "partial" if errors else "success",
        "error_message": "; ".join(errors) if errors else None,
    })

    supabase.table("scrape_logs").insert(log_entry).execute()

    # --- สรุปผล ---
    print("\n" + "=" * 60)
    print("📊 สรุป:")
    print(f"  Properties อัปเดต: {total_properties_updated}/{len(properties)}")
    print(f"  วันที่อัปเดต: {total_dates_updated}")
    print(f"  Errors: {len(errors)}")
    if errors:
        for err in errors:
            print(f"    ❌ {err}")
    print(f"  เวลาจบ: {finished_at}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
