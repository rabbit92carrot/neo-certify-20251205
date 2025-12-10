-- Seed Data for Neo-Certify
-- Description: Test accounts and initial data for development
-- Created: 2025-12-09
-- Updated: 2025-12-10 - Added automatic Auth user creation
--
-- Test Accounts:
--   admin@neocert.com / admin123
--   manufacturer@neocert.com / test123
--   distributor@neocert.com / test123
--   hospital@neocert.com / test123

-- ============================================
-- Create Auth Users (Supabase Local Development)
-- ============================================
-- Note: This uses Supabase's internal auth schema for local development only.
-- In production, users should register through the application.

-- Create test users directly using DO block
DO $$
DECLARE
  encrypted_pw TEXT;
BEGIN
  -- Admin user
  encrypted_pw := crypt('admin123', gen_salt('bf'));
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'admin@neocert.com', encrypted_pw, NOW(),
    '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'admin@neocert.com',
    '{"sub":"b0000000-0000-0000-0000-000000000001","email":"admin@neocert.com"}', 'email', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Manufacturer user
  encrypted_pw := crypt('test123', gen_salt('bf'));
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'manufacturer@neocert.com', encrypted_pw, NOW(),
    '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'manufacturer@neocert.com',
    '{"sub":"b0000000-0000-0000-0000-000000000002","email":"manufacturer@neocert.com"}', 'email', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Distributor user
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated', 'distributor@neocert.com', encrypted_pw, NOW(),
    '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 'distributor@neocert.com',
    '{"sub":"b0000000-0000-0000-0000-000000000003","email":"distributor@neocert.com"}', 'email', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Hospital user
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000004',
    'authenticated', 'authenticated', 'hospital@neocert.com', encrypted_pw, NOW(),
    '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004', 'hospital@neocert.com',
    '{"sub":"b0000000-0000-0000-0000-000000000004","email":"hospital@neocert.com"}', 'email', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- Test Organizations
-- ============================================

-- Admin Organization
INSERT INTO organizations (
  id,
  auth_user_id,
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
  'b0000000-0000-0000-0000-000000000001',
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
  auth_user_id,
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
  'b0000000-0000-0000-0000-000000000002',
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
  auth_user_id,
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
  'b0000000-0000-0000-0000-000000000003',
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
  auth_user_id,
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
  'b0000000-0000-0000-0000-000000000004',
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
-- Auth User to Organization Mapping (Reference)
-- ============================================
-- Auth users are automatically created and linked above.
--
-- Auth User ID                          | Organization ID                        | Email
-- b0000000-0000-0000-0000-000000000001 | a0000000-0000-0000-0000-000000000001 | admin@neocert.com
-- b0000000-0000-0000-0000-000000000002 | a0000000-0000-0000-0000-000000000002 | manufacturer@neocert.com
-- b0000000-0000-0000-0000-000000000003 | a0000000-0000-0000-0000-000000000003 | distributor@neocert.com
-- b0000000-0000-0000-0000-000000000004 | a0000000-0000-0000-0000-000000000004 | hospital@neocert.com
