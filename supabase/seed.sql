-- Seed Data for Neo-Certify
-- Description: Test accounts and initial data for development
-- Created: 2025-12-09
--
-- NOTE: This seed file creates organizations WITHOUT linking to Supabase Auth.
--       For full authentication testing, you need to:
--       1. Create users in Supabase Auth (Dashboard or API)
--       2. Update organizations.auth_user_id with the created user IDs
--
-- Test Accounts (passwords are for reference - actual auth handled by Supabase):
--   admin@neocert.com / admin123
--   manufacturer@neocert.com / test123
--   distributor@neocert.com / test123
--   hospital@neocert.com / test123

-- ============================================
-- Test Organizations
-- ============================================

-- Admin Organization
INSERT INTO organizations (
  id,
  type,
  email,
  business_number,
  business_license_file,
  name,
  representative_name,
  representative_contact,
  address,
  status
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'ADMIN',
  'admin@neocert.com',
  '0000000001',
  'seed/admin_license.pdf',
  '네오인증서 관리자',
  '관리자',
  '01000000001',
  '서울시 강남구 테헤란로 123',
  'ACTIVE'
);

-- Manufacturer Organization
INSERT INTO organizations (
  id,
  type,
  email,
  business_number,
  business_license_file,
  name,
  representative_name,
  representative_contact,
  address,
  status
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'MANUFACTURER',
  'manufacturer@neocert.com',
  '1234567890',
  'seed/manufacturer_license.pdf',
  '테스트제조사',
  '김제조',
  '01012345678',
  '서울시 강남구 제조로 1',
  'ACTIVE'
);

-- Manufacturer Settings (will be auto-created by trigger, but explicit for clarity)
INSERT INTO manufacturer_settings (
  organization_id,
  lot_prefix,
  lot_model_digits,
  lot_date_format,
  expiry_months
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'ND',
  5,
  'yymmdd',
  24
) ON CONFLICT (organization_id) DO NOTHING;

-- Distributor Organization
INSERT INTO organizations (
  id,
  type,
  email,
  business_number,
  business_license_file,
  name,
  representative_name,
  representative_contact,
  address,
  status
) VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'DISTRIBUTOR',
  'distributor@neocert.com',
  '2345678901',
  'seed/distributor_license.pdf',
  '테스트유통사',
  '이유통',
  '01023456789',
  '서울시 서초구 유통로 2',
  'ACTIVE'
);

-- Hospital Organization
INSERT INTO organizations (
  id,
  type,
  email,
  business_number,
  business_license_file,
  name,
  representative_name,
  representative_contact,
  address,
  status
) VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'HOSPITAL',
  'hospital@neocert.com',
  '3456789012',
  'seed/hospital_license.pdf',
  '테스트병원',
  '박병원',
  '01034567890',
  '서울시 용산구 병원로 3',
  'ACTIVE'
);

-- ============================================
-- Additional Test Organizations (Optional)
-- ============================================

-- Second Distributor (for multi-tier distribution testing)
INSERT INTO organizations (
  id,
  type,
  email,
  business_number,
  business_license_file,
  name,
  representative_name,
  representative_contact,
  address,
  status
) VALUES (
  'a0000000-0000-0000-0000-000000000005',
  'DISTRIBUTOR',
  'distributor2@neocert.com',
  '4567890123',
  'seed/distributor2_license.pdf',
  '테스트유통사2',
  '최유통',
  '01045678901',
  '서울시 마포구 유통로 3',
  'ACTIVE'
);

-- Second Hospital
INSERT INTO organizations (
  id,
  type,
  email,
  business_number,
  business_license_file,
  name,
  representative_name,
  representative_contact,
  address,
  status
) VALUES (
  'a0000000-0000-0000-0000-000000000006',
  'HOSPITAL',
  'hospital2@neocert.com',
  '5678901234',
  'seed/hospital2_license.pdf',
  '테스트병원2',
  '정병원',
  '01056789012',
  '서울시 강북구 병원로 4',
  'ACTIVE'
);

-- Pending Approval Organization (for testing approval flow)
INSERT INTO organizations (
  id,
  type,
  email,
  business_number,
  business_license_file,
  name,
  representative_name,
  representative_contact,
  address,
  status
) VALUES (
  'a0000000-0000-0000-0000-000000000007',
  'HOSPITAL',
  'pending@neocert.com',
  '6789012345',
  'seed/pending_license.pdf',
  '승인대기병원',
  '강대기',
  '01067890123',
  '서울시 송파구 대기로 5',
  'PENDING_APPROVAL'
);

-- ============================================
-- Helper: Link Auth Users to Organizations
-- ============================================
-- After creating users in Supabase Auth, run these updates:
--
-- UPDATE organizations SET auth_user_id = '<admin-auth-uuid>'
-- WHERE email = 'admin@neocert.com';
--
-- UPDATE organizations SET auth_user_id = '<manufacturer-auth-uuid>'
-- WHERE email = 'manufacturer@neocert.com';
--
-- UPDATE organizations SET auth_user_id = '<distributor-auth-uuid>'
-- WHERE email = 'distributor@neocert.com';
--
-- UPDATE organizations SET auth_user_id = '<hospital-auth-uuid>'
-- WHERE email = 'hospital@neocert.com';
