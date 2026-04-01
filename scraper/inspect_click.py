"""Inspect deville click popup + poolvillacity daily price API"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # ========== DEVILLE: inspect click popup ==========
        print("=" * 70)
        print("DEVILLE: Click popup inspection")
        print("=" * 70)

        page = await browser.new_page()
        await page.goto(
            "https://www.devillegroups.com/acld/cld.php?hId=183&ym=2026-04",
            wait_until="networkidle",
        )
        await asyncio.sleep(3)

        # Dump full page JS to see click handlers
        js_scripts = await page.evaluate("""() => {
            const scripts = document.querySelectorAll('script');
            return Array.from(scripts).map(s => s.textContent).join('\\n===SCRIPT===\\n');
        }""")
        with open("deville_scripts.txt", "w", encoding="utf-8") as f:
            f.write(js_scripts)
        print(f"Saved JS scripts ({len(js_scripts)} chars)")

        # Find available (not booked/blocked) cells and try clicking one
        available_tds = await page.query_selector_all("td.bk")
        print(f"Available cells (class=bk): {len(available_tds)}")

        # Try clicking first available cell
        for td in available_tds:
            cls = await td.get_attribute("class") or ""
            if "repair" in cls or "owner" in cls:
                continue
            date = await td.get_attribute("data-day")
            text = (await td.inner_text()).strip()
            print(f"\nClicking cell: date={date} text={text} class='{cls}'")
            await td.click()
            await asyncio.sleep(2)

            # Check for SweetAlert2 popup
            swal = await page.query_selector(".swal2-popup, .swal2-container, .swal2-html-container")
            if swal:
                swal_text = (await swal.inner_text()).strip()
                print(f"SweetAlert2 popup found: '{swal_text}'")
                # Close it
                ok_btn = await page.query_selector(".swal2-confirm")
                if ok_btn:
                    await ok_btn.click()
                    await asyncio.sleep(0.5)
            else:
                # Check any popup/dialog
                popup = await page.evaluate("""() => {
                    const el = document.querySelector('.swal2-popup, [role="dialog"], .modal');
                    return el ? el.textContent : null;
                }""")
                print(f"Popup content: {popup}")
            break

        # Try to intercept AJAX calls that happen on click
        print("\nIntercepting network on click...")
        requests_log = []
        page.on("request", lambda req: requests_log.append(f"{req.method} {req.url}"))

        for td in available_tds[1:3]:
            cls = await td.get_attribute("class") or ""
            if "repair" in cls or "owner" in cls:
                continue
            date = await td.get_attribute("data-day")
            requests_log.clear()
            await td.click()
            await asyncio.sleep(2)
            print(f"Click {date} → requests: {requests_log}")
            # Close popup
            ok_btn = await page.query_selector(".swal2-confirm")
            if ok_btn:
                await ok_btn.click()
                await asyncio.sleep(0.3)

        await page.close()

        # ========== POOLVILLACITY: inspect daily price ==========
        print("\n" + "=" * 70)
        print("POOLVILLACITY: Daily price inspection")
        print("=" * 70)

        page = await browser.new_page()

        # Intercept XHR/fetch requests
        api_calls = []
        def on_request(req):
            if "api" in req.url.lower() or "price" in req.url.lower() or "calendar" in req.url.lower() or "availability" in req.url.lower():
                api_calls.append({"method": req.method, "url": req.url})
        page.on("request", on_request)

        await page.goto("https://poolvillacity.co.th/CITY-1194", wait_until="networkidle")
        await asyncio.sleep(3)

        print(f"API calls intercepted: {len(api_calls)}")
        for c in api_calls:
            print(f"  {c['method']} {c['url'][:120]}")

        # Check if clicking a date shows price
        avail_tds = await page.query_selector_all("td.fc-daygrid-day[data-date]")
        for td in avail_tds:
            date = await td.get_attribute("data-date")
            cls = await td.get_attribute("class") or ""
            if "fc-day-past" in cls:
                continue

            # Check for events (booked)
            events = await td.query_selector_all(".fc-bg-event")
            if events:
                bg = await page.evaluate("(el) => window.getComputedStyle(el).backgroundColor", events[0])
                if "248" in bg:  # pink = booked
                    continue

            print(f"\nClicking available cell: {date}")
            api_calls.clear()
            await td.click()
            await asyncio.sleep(2)

            print(f"  API calls after click: {len(api_calls)}")
            for c in api_calls:
                print(f"    {c['method']} {c['url'][:120]}")

            # Check for modal/popup
            modal = await page.query_selector("[role='dialog'], .modal, .p-dialog, .cdk-overlay-container")
            if modal:
                modal_text = (await modal.inner_text()).strip()
                print(f"  Modal text: {modal_text[:200]}")

            break

        # Also look for __NEXT_DATA__ or any embedded price data
        price_data = await page.evaluate("""() => {
            // Check for Angular/Next data
            if (window.__NEXT_DATA__) return {type: 'next', data: JSON.stringify(window.__NEXT_DATA__).substring(0, 500)};
            // Check for any global variable with price
            const keys = Object.keys(window).filter(k => k.toLowerCase().includes('price') || k.toLowerCase().includes('calendar'));
            return {type: 'window_keys', data: keys.join(', ')};
        }""")
        print(f"\nGlobal data: {price_data}")

        await page.close()
        await browser.close()

asyncio.run(main())
