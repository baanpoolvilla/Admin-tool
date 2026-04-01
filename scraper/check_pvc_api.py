import httpx, json

r = httpx.get("https://api.poolvillacity.co.th/next-villapaza/api/customer/house/info/CITY-1194")
data = r.json()["result"]
ph = data["priceHouse"]

print("=== every_day (day-of-week pricing) ===")
for d in ph.get("every_day", []):
    day = d["day"]
    total = d["sum"]
    base = d["price"]
    comm = d["price_commissions"]
    guests = d["accommodate_number"]
    print(f"  {day}: price={total} (base={base} + commission={comm}), max_guests={guests}")

print("\n=== holiday (date-specific pricing) ===")
for h in ph.get("holiday", []):
    dates = h.get("date", [])
    total = h["sum"]
    guests = h["accommodate_number"]
    date_strs = [d[:10] for d in dates[:8]]
    print(f"  dates={date_strs} price={total} max_guests={guests}")

print("\n=== promotion ===")
for p in ph.get("promotion", []):
    print(f"  {str(p)[:200]}")

print("\n=== book (bookings) ===")
books = ph.get("book", [])
print(f"  count: {len(books)}")
for b in books[:10]:
    checkin = b.get("checkin", "")[:10]
    checkout = b.get("checkout", "")[:10]
    status = b.get("status", "")
    print(f"  checkin={checkin} checkout={checkout} status={status}")
