// =============================================================
// app/api/properties/discover/route.ts — Discover Properties from URL
// GET  → ดึงรายการบ้านจาก Deville listing / PVC URL
// POST → สร้างบ้านหลายหลังจากผลลัพธ์ที่ค้นพบ
// รองรับ: devillegroups.com (หลายหลัง) + poolvillacity.co.th (หลังเดียว)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];

interface DiscoveredProperty {
  code: string;
  name: string;
  imageUrl: string | null;
  source: "deville" | "poolvillacity";
}

type SourceType = "deville" | "poolvillacity" | "unknown";

function detectSource(url: string): SourceType {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith("devillegroups.com")) return "deville";
    if (
      parsed.hostname.endsWith("poolvillacity.co.th") ||
      parsed.hostname.endsWith("poolvillacity.com")
    )
      return "poolvillacity";
  } catch {
    // invalid URL
  }
  return "unknown";
}

// --- GET: ค้นหาบ้านจาก URL ---
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  const source = detectSource(url);
  if (source === "unknown") {
    return NextResponse.json(
      {
        error:
          "รองรับเฉพาะ URL จาก devillegroups.com หรือ poolvillacity.co.th",
      },
      { status: 400 }
    );
  }

  try {
    let properties: DiscoveredProperty[] = [];

    if (source === "deville") {
      properties = await discoverDeville(url);
    } else {
      properties = await discoverPoolVillaCity(url);
    }

    if (properties.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบบ้านพักในลิงค์นี้" },
        { status: 404 }
      );
    }

    // ตรวจสอบว่ามี property ไหนอยู่ใน DB แล้ว
    const codes = properties.map((p) => p.code);
    const { data: existing } = await supabase
      .from("properties")
      .select("source_property_id")
      .in("source_property_id", codes);

    const existingCodes = new Set(
      (existing || []).map((e) => e.source_property_id)
    );

    const result = properties.map((p) => ({
      ...p,
      alreadyExists: existingCodes.has(p.code),
    }));

    return NextResponse.json({ properties: result, source });
  } catch (err) {
    console.error("Discover error:", err);
    const message =
      err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- POST: สร้างบ้านหลายหลังจากผลลัพธ์ ---
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { properties, zone, sourceUrl } = body as {
    properties: DiscoveredProperty[];
    zone: string;
    sourceUrl: string;
  };

  if (!properties || !Array.isArray(properties) || properties.length === 0) {
    return NextResponse.json(
      { error: "ไม่มีรายการบ้านที่จะสร้าง" },
      { status: 400 }
    );
  }

  const validZones = ["bangsaen", "pattaya", "sattahip", "rayong"] as const;
  type Zone = (typeof validZones)[number];
  if (!validZones.includes(zone as Zone)) {
    return NextResponse.json({ error: "โซนไม่ถูกต้อง" }, { status: 400 });
  }

  const detectedSource = detectSource(sourceUrl);
  const source =
    detectedSource === "unknown" ? ("deville" as const) : detectedSource;

  const inserts: PropertyInsert[] = properties.map((p) => ({
    name: p.name,
    slug: slugify(p.name),
    source: source,
    source_url: sourceUrl,
    source_property_id: p.code,
    zone: zone as Zone,
    thumbnail_url: p.imageUrl,
    is_active: true,
    max_guests: 10,
    bedrooms: 1,
    bathrooms: 1,
  }));

  const { data, error } = await supabase
    .from("properties")
    .insert(inserts)
    .select();

  if (error) {
    console.error("Bulk insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { created: data?.length || 0, properties: data },
    { status: 201 }
  );
}

// =============================================================
// Discover: Deville — ใช้ getCalendars.php API
// =============================================================
async function discoverDeville(url: string): Promise<DiscoveredProperty[]> {
  // ดึง oid จาก URL param ?s=XXXX
  const parsed = new URL(url);
  const oid = parsed.searchParams.get("s");
  if (!oid) {
    throw new Error("ไม่พบรหัส owner (s=XXXX) ใน URL");
  }

  // เรียก getCalendars.php API ตรง
  const resp = await fetch(
    "https://www.devillegroups.com/acldl/getCalendars.php",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: `oid=${encodeURIComponent(oid)}`,
    }
  );

  if (!resp.ok)
    throw new Error(`ไม่สามารถเข้าถึง Deville API ได้ (HTTP ${resp.status})`);

  const data = await resp.json();

  if (data.status !== "success" || !Array.isArray(data.dt)) {
    throw new Error("ไม่พบบ้านพักจาก Deville API");
  }

  return data.dt.map(
    (item: { hid: string; name: string; imgs: string }) => ({
      code: `DV-${item.hid}`,
      name: item.name,
      imageUrl: item.imgs
        ? `https://www.devillegroups.com/imgs/profile_imgs_large/${item.imgs}`
        : null,
      source: "deville" as const,
    })
  );
}

// =============================================================
// Discover: Pool Villa City
// =============================================================
async function discoverPoolVillaCity(
  url: string
): Promise<DiscoveredProperty[]> {
  // ดึง CITY-XXX code จาก URL
  const codeMatch = url.match(/CITY-(\d+)/i);
  if (!codeMatch) {
    throw new Error(
      "ไม่พบรหัส CITY-XXX ในลิงค์ — ใส่ลิงค์แบบ poolvillacity.co.th/house/CITY-425"
    );
  }
  const code = `CITY-${codeMatch[1]}`;

  // เรียก API เพื่อดึงข้อมูลบ้าน
  const apiResp = await fetch(
    `https://api.poolvillacity.co.th/next-villapaza/api/customer/house/info/${code}`,
    { headers: { Accept: "application/json" } }
  );

  if (!apiResp.ok) {
    throw new Error(
      `ไม่สามารถดึงข้อมูลจาก PVC API ได้ (HTTP ${apiResp.status})`
    );
  }

  const data = await apiResp.json();
  const result = data?.result || {};

  const name = result.name || result.house_name || `Pool Villa ${code}`;
  const imageUrl =
    result.images?.[0]?.path ||
    result.images?.[0]?.url ||
    result.thumbnail ||
    null;

  return [{ code, name, imageUrl, source: "poolvillacity" }];
}

// =============================================================
// Helpers
// =============================================================
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}
