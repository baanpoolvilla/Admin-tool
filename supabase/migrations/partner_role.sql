-- =============================================================
-- Villa Dashboard — Partner Role Migration
-- รันใน Supabase SQL Editor เพื่อเพิ่มระบบ partner
-- =============================================================

-- 1. สร้างตาราง profiles สำหรับเก็บ role ของ user
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'partner' CHECK (role IN ('admin', 'partner')),
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. เพิ่ม partner_id ในตาราง properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES auth.users(id);

-- 3. สร้าง index สำหรับ partner_id
CREATE INDEX IF NOT EXISTS idx_properties_partner_id ON properties(partner_id);

-- 4. เปิด RLS สำหรับตาราง profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. ล้าง policy/function เดิมก่อน (รันซ้ำได้)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP FUNCTION IF EXISTS public.is_admin_user();

-- 6. Policy: ทุก user ที่ login แล้ว อ่าน profiles ได้ทั้งหมด
--    (ปลอดภัยเพราะ Next.js API routes ตรวจ auth ก่อนเรียก Supabase อยู่แล้ว)
CREATE POLICY "Authenticated users can read all profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 7. Policy: users insert/update profile ตัวเองได้
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 8. Policy: service role full access
CREATE POLICY "Service role full access" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- ตั้งค่า Admin: ใส่ user ID ของ admin (แก้ UUID ให้ถูก)
-- =============================================================
-- INSERT INTO profiles (id, email, role)
-- VALUES ('YOUR-ADMIN-USER-UUID', 'admin@example.com', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- =============================================================
-- กำหนด partner_id ให้ properties:
-- UPDATE properties SET partner_id = 'PARTNER-USER-UUID' WHERE id = 'PROPERTY-ID';
-- =============================================================
