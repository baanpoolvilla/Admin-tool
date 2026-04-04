-- =============================================================
-- Migration: Add price_markup and detail_url columns to properties table
-- Run this migration in Supabase SQL Editor
-- =============================================================

-- Add price_markup column (ราคาบวกเพิ่มสำหรับหน้าแชร์)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS price_markup NUMERIC DEFAULT NULL;

-- Add detail_url column (ลิงก์รายละเอียดภายนอก)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS detail_url TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN properties.price_markup IS 'ราคาบวกเพิ่มสำหรับหน้าแชร์ (บวกกับราคาจริงทุกวัน)';
COMMENT ON COLUMN properties.detail_url IS 'ลิงก์ไปยังหน้ารายละเอียดภายนอก (เช่น Facebook, Line)';
