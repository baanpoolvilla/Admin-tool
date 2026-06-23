// =============================================================
// lib/ical.ts — iCal (RFC 5545) parser and generator helpers
// =============================================================

export interface ICalEvent {
  start: string;  // YYYY-MM-DD (inclusive)
  end: string;    // YYYY-MM-DD (exclusive — iCal DTEND convention)
  summary?: string;
  uid?: string;
  status?: string;
}

export interface DateRange {
  start: string; // YYYY-MM-DD inclusive
  end: string;   // YYYY-MM-DD exclusive
}

// ----------------------------------------------------------------
// Parse iCal text → array of events
// ----------------------------------------------------------------
export function parseICal(text: string): ICalEvent[] {
  // Unfold folded lines (CRLF or LF followed by whitespace)
  const unfolded = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r\n|\r|\n/);

  const events: ICalEvent[] = [];
  let inEvent = false;
  let current: Partial<ICalEvent & { status: string }> = {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      inEvent = false;
      if (current.start && current.end && current.status !== "CANCELLED") {
        events.push(current as ICalEvent);
      }
      continue;
    }
    if (!inEvent) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    // Property name may have params: DTSTART;VALUE=DATE:20260601 → key = DTSTART
    const key = line.substring(0, colonIdx).split(";")[0].toUpperCase();
    const value = line.substring(colonIdx + 1).trim();

    switch (key) {
      case "DTSTART": current.start = parseICalDate(value); break;
      case "DTEND":   current.end   = parseICalDate(value); break;
      case "SUMMARY": current.summary = value; break;
      case "UID":     current.uid     = value; break;
      case "STATUS":  current.status  = value.toUpperCase(); break;
    }
  }

  return events;
}

// Parse iCal date/datetime string → YYYY-MM-DD
function parseICalDate(value: string): string {
  const raw = value.replace(/T.*/, ""); // strip time part
  return `${raw.substring(0, 4)}-${raw.substring(4, 6)}-${raw.substring(6, 8)}`;
}

// ----------------------------------------------------------------
// Expand a single event into individual dates (DTEND is exclusive)
// ----------------------------------------------------------------
export function icalEventToDates(event: ICalEvent): string[] {
  const dates: string[] = [];
  const cur = new Date(event.start + "T00:00:00");
  const end = new Date(event.end   + "T00:00:00");

  while (cur < end) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// ----------------------------------------------------------------
// Group an array of YYYY-MM-DD dates into consecutive ranges
// ----------------------------------------------------------------
export function groupConsecutiveDates(dates: string[]): DateRange[] {
  if (dates.length === 0) return [];

  const sorted = [...dates].sort();
  const ranges: DateRange[] = [];
  let rangeStart = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const expected = nextDay(prev);
    if (sorted[i] !== expected) {
      ranges.push({ start: rangeStart, end: nextDay(prev) });
      rangeStart = sorted[i];
    }
    prev = sorted[i];
  }
  ranges.push({ start: rangeStart, end: nextDay(prev) });

  return ranges;
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ----------------------------------------------------------------
// Generate iCal text from a list of date ranges
// ----------------------------------------------------------------
export function generateICal(
  propertyCode: string,
  propertyName: string,
  ranges: DateRange[]
): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.]/g, "")
    .substring(0, 15) + "Z";

  const eventBlocks = ranges
    .map((range, i) =>
      [
        "BEGIN:VEVENT",
        `UID:${propertyCode}-${range.start.replace(/-/g, "")}-${i}@villa-dashboard`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${range.start.replace(/-/g, "")}`,
        `DTEND;VALUE=DATE:${range.end.replace(/-/g, "")}`,
        `SUMMARY:Booked - ${propertyName}`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
      ].join("\r\n")
    )
    .join("\r\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Villa Dashboard//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...(eventBlocks ? [eventBlocks] : []),
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}
