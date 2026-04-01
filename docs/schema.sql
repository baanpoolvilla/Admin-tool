-- =============================================================
-- docs/schema.sql — Supabase Database Schema
-- รันไฟล์นี้ใน Supabase SQL Editor เพื่อสร้างตาราง
-- =============================================================

-- =========================================
-- 1. properties — ข้อมูลบ้านพักทั้งหมด
-- =========================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- ชื่อบ้าน
  slug TEXT UNIQUE NOT NULL,                   -- URL-friendly name
  source TEXT NOT NULL,                        -- 'deville' | 'poolvillacity' | 'manual'
  source_url TEXT,                             -- URL ของบ้านในเว็บ scrape
  source_property_id TEXT,                     -- รหัสบ้านในเว็บต้นทาง เช่น "2304"
  description TEXT,                            -- คำอธิบาย
  address TEXT,                                -- ที่อยู่
  latitude DECIMAL(10, 8),                     -- พิกัด Lat
  longitude DECIMAL(11, 8),                    -- พิกัด Lng
  max_guests INTEGER DEFAULT 10,              -- ผู้เข้าพักสูงสุด
  bedrooms INTEGER DEFAULT 1,                 -- จำนวนห้องนอน
  bathrooms INTEGER DEFAULT 1,                -- จำนวนห้องน้ำ
  base_price DECIMAL(10, 2),                  -- ราคาฐานต่อคืน (บาท)
  thumbnail_url TEXT,                          -- URL รูปหน้าปก
  images TEXT[],                               -- array of image URLs
  is_active BOOLEAN DEFAULT true,             -- เปิด/ปิดการแสดงผล
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 2. availability — ข้อมูลวันว่าง/จอง
-- =========================================
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,  -- FK → properties
  date DATE NOT NULL,                          -- วันที่
  status TEXT NOT NULL CHECK (status IN ('available', 'booked', 'blocked')),  -- สถานะ
  price DECIMAL(10, 2),                       -- ราคาจริงของวันนั้นๆ
  source TEXT DEFAULT 'scraper',              -- 'scraper' | 'manual'
  scraped_at TIMESTAMPTZ,                     -- เวลาที่ scrape ล่าสุด
  notes TEXT,                                  -- หมายเหตุ
  UNIQUE(property_id, date)                   -- key สำหรับ upsert
);

-- =========================================
-- 3. scrape_logs — ประวัติการ scrape
-- =========================================
CREATE TABLE scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,                        -- แหล่งที่ scrape
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  properties_updated INTEGER DEFAULT 0,       -- จำนวน property ที่อัปเดต
  dates_updated INTEGER DEFAULT 0,            -- จำนวนวันที่อัปเดต
  error_message TEXT,                          -- ข้อความ error (ถ้ามี)
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- =========================================
-- Indexes — เพิ่มความเร็วในการ query
-- =========================================
CREATE INDEX idx_availability_property_date ON availability(property_id, date);
CREATE INDEX idx_availability_date ON availability(date);
CREATE INDEX idx_properties_source ON properties(source, source_property_id);

-- =========================================
-- Row Level Security (RLS)
-- =========================================

-- เปิด RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Public สามารถอ่าน properties ที่ active
CREATE POLICY "Public read properties"
  ON properties FOR SELECT
  USING (is_active = true);

-- Public สามารถอ่าน availability ทั้งหมด
CREATE POLICY "Public read availability"
  ON availability FOR SELECT
  USING (true);

-- Admin (authenticated) มีสิทธิ์เต็มกับ properties
CREATE POLICY "Admin full access properties"
  ON properties FOR ALL
  USING (auth.role() = 'authenticated');

-- Admin (authenticated) มีสิทธิ์เต็มกับ availability
CREATE POLICY "Admin full access availability"
  ON availability FOR ALL
  USING (auth.role() = 'authenticated');

-- Service role (scraper) มีสิทธิ์เต็มกับ availability
CREATE POLICY "Service role full access availability"
  ON availability FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Service role มีสิทธิ์อ่าน properties (scraper ต้องอ่าน properties)
CREATE POLICY "Service role read properties"
  ON properties FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role');
