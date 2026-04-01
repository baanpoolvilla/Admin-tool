"""Test scraping all 3 URLs — daily prices"""
import asyncio
from scrapers.deville import DevilleScraper
from scrapers.poolvillacity import PoolVillaCityScraper

TESTS = [
    ("poolvillacity", "https://poolvillacity.co.th/CITY-1194", "CITY-1194"),
    ("deville", "https://www.devillegroups.com/acld/?s=510", "510"),
    ("deville", "https://www.devillegroups.com/acld/?s=183", "183"),
]

async def main():
    scrapers = {
        "deville": DevilleScraper(),
        "poolvillacity": PoolVillaCityScraper(),
    }
    summary = []

    for source, url, code in TESTS:
        print("\n" + "=" * 70)
        print(f"[{source}] {code}")
        print(f"URL: {url}")
        print("=" * 70)

        scraper = scrapers[source]
        try:
            results = await scraper.scrape(url, code)
            avail = [r for r in results if r.status == "available"]
            booked = [r for r in results if r.status == "booked"]
            blocked = [r for r in results if r.status == "blocked"]

            print(f"\nTotal: {len(results)} | Available: {len(avail)} | Booked: {len(booked)} | Blocked: {len(blocked)}")
            print(f"\n{'วันที่':12s} | {'สถานะ':10s} | ราคา")
            print("-" * 40)
            for r in sorted(results, key=lambda x: x.date):
                price_str = f"฿{r.price:,.0f}" if r.price else "-"
                print(f"{r.date:12s} | {r.status:10s} | {price_str}")

            summary.append({"name": f"{source}-{code}", "ok": True,
                            "total": len(results), "avail": len(avail), "booked": len(booked)})
        except Exception as e:
            print(f"\nFAILED: {e}")
            import traceback; traceback.print_exc()
            summary.append({"name": f"{source}-{code}", "ok": False, "error": str(e)})

    print("\n" + "#" * 70)
    print("SUMMARY")
    for s in summary:
        if s["ok"]:
            print(f"  [OK]   {s['name']:30s} → {s['total']} days (avail={s['avail']}, booked={s['booked']})")
        else:
            print(f"  [FAIL] {s['name']:30s} → {s['error'][:60]}")

asyncio.run(main())
