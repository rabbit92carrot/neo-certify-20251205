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

-- ============================================
-- TEST DATA FOR COMPREHENSIVE TESTING
-- ============================================
-- Updated: 2025-12-13
-- Purpose: Large-scale test data for all organization types
-- Total: 5 products, 10 lots, ~2,500 virtual codes, 15 shipments, 8 treatments

-- Organization ID Reference:
-- Manufacturer:  a0000000-0000-0000-0000-000000000002
-- Distributor1:  a0000000-0000-0000-0000-000000000003
-- Distributor2:  a0000000-0000-0000-0000-000000000005
-- Hospital1:     a0000000-0000-0000-0000-000000000004
-- Hospital2:     a0000000-0000-0000-0000-000000000006

-- ============================================
-- Products (5개)
-- ============================================
INSERT INTO products (id, organization_id, name, udi_di, model_name, is_active)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'PDO 리프팅 실 (미세침)', 'UDI-FINE-001', 'ND-FINE-100', true),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'PDO 리프팅 실 (일반)', 'UDI-STD-002', 'ND-STD-200', true),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'PDO 리프팅 실 (굵은침)', 'UDI-BOLD-003', 'ND-BOLD-300', true),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'PDO 코그 실', 'UDI-COG-004', 'ND-COG-400', true),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'PDO 모노 실 (단종)', 'UDI-MONO-005', 'ND-MONO-500', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Lots (10개, 총 2,500개 가상코드)
-- ============================================
-- Note: Lot INSERT triggers auto-generate virtual_codes

INSERT INTO lots (id, product_id, lot_number, quantity, manufacture_date, expiry_date)
VALUES
  -- LOT-001: 제조사 보유 (미출고)
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'ND00001-241201', 300, '2024-12-01', '2026-12-01'),
  -- LOT-002: 유통사로 전량 출고
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'ND00001-241205', 300, '2024-12-05', '2026-12-05'),
  -- LOT-003: 병원으로 직접 출고
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'ND00002-241210', 250, '2024-12-10', '2026-12-10'),
  -- LOT-004: 부분 출고 (제조사 100개 보유)
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'ND00002-241215', 250, '2024-12-15', '2026-12-15'),
  -- LOT-005: 유통사 경유 → 병원 출고
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'ND00003-241220', 200, '2024-12-20', '2026-12-20'),
  -- LOT-006: 제조사 보유 (미출고)
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'ND00003-241225', 200, '2024-12-25', '2026-12-25'),
  -- LOT-007: 다단계 유통 테스트
  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'ND00004-250101', 300, '2025-01-01', '2027-01-01'),
  -- LOT-008: 대량 시술 테스트
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004', 'ND00004-250105', 300, '2025-01-05', '2027-01-05'),
  -- LOT-009: 24시간 이내 출고 (회수 테스트용)
  ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'ND00001-250110', 200, '2025-01-10', '2027-01-10'),
  -- LOT-010: 24시간 이내 시술 (회수 테스트용)
  ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000002', 'ND00002-250115', 200, '2025-01-15', '2027-01-15')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Patients (시술용 환자 데이터)
-- ============================================
INSERT INTO patients (phone_number)
VALUES
  ('01011112222'),
  ('01022223333'),
  ('01033334444'),
  ('01044445555'),
  ('01055556666'),
  ('01066667777'),
  ('01077778888'),
  ('01088889999')
ON CONFLICT (phone_number) DO NOTHING;

-- ============================================
-- Shipment Batches (출고 배치 15건)
-- ============================================
-- Note: shipment_date uses dynamic NOW() for 24-hour recall testing

INSERT INTO shipment_batches (id, from_organization_id, to_organization_type, to_organization_id, shipment_date, is_recalled, recall_reason, recall_date)
VALUES
  -- 과거 출고 (정상)
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'DISTRIBUTOR', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '7 days', false, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'HOSPITAL', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '7 days', false, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'DISTRIBUTOR', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '5 days', false, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'DISTRIBUTOR', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '5 days', false, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'HOSPITAL', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '4 days', false, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'HOSPITAL', 'a0000000-0000-0000-0000-000000000006', NOW() - INTERVAL '4 days', false, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'HOSPITAL', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '3 days', false, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'DISTRIBUTOR', 'a0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '3 days', false, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000005', 'HOSPITAL', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '2 days', false, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000002', 'HOSPITAL', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '2 days', false, NULL, NULL),
  -- 24시간 이내 출고 (회수 가능)
  ('e0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'DISTRIBUTOR', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '12 hours', false, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000003', 'HOSPITAL', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '6 hours', false, NULL, NULL),
  ('e0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000002', 'HOSPITAL', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '18 hours', false, NULL, NULL),
  -- 회수된 출고
  ('e0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000002', 'DISTRIBUTOR', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '10 days', true, '품질 검사 불합격', NOW() - INTERVAL '9 days 12 hours'),
  ('e0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000003', 'HOSPITAL', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '8 days', true, '수량 오류', NOW() - INTERVAL '7 days 18 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Virtual Code Ownership Updates
-- ============================================
-- Update virtual_codes owner based on shipments
-- Using DO block for batch updates with LIMIT

DO $$
DECLARE
  code_ids UUID[];
  i INT;
BEGIN
  -- Shipment 1: LOT-002 (300개) → 유통사1 (전량)
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000003'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000002';

  -- Shipment 2: LOT-003 (250개) → 병원1 (전량)
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000004'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000003';

  -- Shipment 3: LOT-004 (150개) → 유통사1 (부분)
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000003'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000004'
    AND id IN (SELECT id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000004' ORDER BY created_at LIMIT 150);

  -- Shipment 4: LOT-005 (200개) → 유통사1 (전량)
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000003'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000005';

  -- Shipment 5: LOT-002에서 100개 → 병원1 (유통사1 경유)
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000004'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000002'
    AND owner_id = 'a0000000-0000-0000-0000-000000000003'
    AND id IN (SELECT id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000002' AND owner_id = 'a0000000-0000-0000-0000-000000000003' ORDER BY created_at LIMIT 100);

  -- Shipment 6: LOT-002에서 100개 → 병원2 (유통사1 경유)
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000006'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000002'
    AND owner_id = 'a0000000-0000-0000-0000-000000000003'
    AND id IN (SELECT id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000002' AND owner_id = 'a0000000-0000-0000-0000-000000000003' ORDER BY created_at LIMIT 100);

  -- Shipment 7: LOT-005에서 100개 → 병원1 (유통사1 경유)
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000004'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000005'
    AND owner_id = 'a0000000-0000-0000-0000-000000000003'
    AND id IN (SELECT id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000005' AND owner_id = 'a0000000-0000-0000-0000-000000000003' ORDER BY created_at LIMIT 100);

  -- Shipment 8: LOT-007 (200개) → 유통사2
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000005'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000007'
    AND id IN (SELECT id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000007' ORDER BY created_at LIMIT 200);

  -- Shipment 9: LOT-007에서 100개 → 병원1 (유통사2 경유)
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000004'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000007'
    AND owner_id = 'a0000000-0000-0000-0000-000000000005'
    AND id IN (SELECT id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000007' AND owner_id = 'a0000000-0000-0000-0000-000000000005' ORDER BY created_at LIMIT 100);

  -- Shipment 10: LOT-008 (200개) → 병원1
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000004'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000008'
    AND id IN (SELECT id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000008' ORDER BY created_at LIMIT 200);

  -- Shipment 11: LOT-009 (100개) → 유통사1 (24시간 이내)
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000003'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000009'
    AND id IN (SELECT id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000009' ORDER BY created_at LIMIT 100);

  -- Shipment 12: LOT-009에서 50개 → 병원1 (유통사1 경유, 24시간 이내)
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000004'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000009'
    AND owner_id = 'a0000000-0000-0000-0000-000000000003'
    AND id IN (SELECT id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000009' AND owner_id = 'a0000000-0000-0000-0000-000000000003' ORDER BY created_at LIMIT 50);

  -- Shipment 13: LOT-010 (150개) → 병원1 (24시간 이내)
  UPDATE virtual_codes SET owner_type = 'ORGANIZATION', owner_id = 'a0000000-0000-0000-0000-000000000004'
  WHERE lot_id = 'd0000000-0000-0000-0000-000000000010'
    AND id IN (SELECT id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000010' ORDER BY created_at LIMIT 150);

END $$;

-- ============================================
-- Shipment Details (출고 상세)
-- ============================================
-- Link virtual codes to shipment batches
-- Note: This uses a simplified approach - in production, use the atomic function

DO $$
DECLARE
  v_batch_id UUID;
  v_lot_id UUID;
  v_owner_id UUID;
  v_cnt INT;
BEGIN
  -- Shipment 1: LOT-002 전량 → 유통사1
  INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
  SELECT 'e0000000-0000-0000-0000-000000000001', id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000002'
  ON CONFLICT DO NOTHING;

  -- Shipment 2: LOT-003 전량 → 병원1
  INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
  SELECT 'e0000000-0000-0000-0000-000000000002', id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000003'
  ON CONFLICT DO NOTHING;

  -- Shipment 3: LOT-004 150개 → 유통사1
  INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
  SELECT 'e0000000-0000-0000-0000-000000000003', id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000004' ORDER BY created_at LIMIT 150
  ON CONFLICT DO NOTHING;

  -- Shipment 4: LOT-005 전량 → 유통사1
  INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
  SELECT 'e0000000-0000-0000-0000-000000000004', id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000005'
  ON CONFLICT DO NOTHING;

  -- Shipment 8: LOT-007 200개 → 유통사2
  INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
  SELECT 'e0000000-0000-0000-0000-000000000008', id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000007' ORDER BY created_at LIMIT 200
  ON CONFLICT DO NOTHING;

  -- Shipment 10: LOT-008 200개 → 병원1
  INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
  SELECT 'e0000000-0000-0000-0000-000000000010', id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000008' ORDER BY created_at LIMIT 200
  ON CONFLICT DO NOTHING;

  -- Shipment 11: LOT-009 100개 → 유통사1 (24시간 이내)
  INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
  SELECT 'e0000000-0000-0000-0000-000000000011', id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000009' ORDER BY created_at LIMIT 100
  ON CONFLICT DO NOTHING;

  -- Shipment 13: LOT-010 150개 → 병원1 (24시간 이내)
  INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
  SELECT 'e0000000-0000-0000-0000-000000000013', id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000010' ORDER BY created_at LIMIT 150
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- Treatment Records (시술 기록 8건)
-- ============================================

INSERT INTO treatment_records (id, hospital_id, patient_phone, treatment_date, created_at)
VALUES
  -- 과거 시술 (정상)
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', '01011112222', (NOW() - INTERVAL '5 days')::date, NOW() - INTERVAL '5 days'),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '01022223333', (NOW() - INTERVAL '4 days')::date, NOW() - INTERVAL '4 days'),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000006', '01033334444', (NOW() - INTERVAL '3 days')::date, NOW() - INTERVAL '3 days'),
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', '01044445555', (NOW() - INTERVAL '2 days')::date, NOW() - INTERVAL '2 days'),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004', '01055556666', (NOW() - INTERVAL '1 day')::date, NOW() - INTERVAL '1 day'),
  -- 24시간 이내 시술 (회수 가능)
  ('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', '01066667777', NOW()::date, NOW() - INTERVAL '8 hours'),
  -- 회수된 시술
  ('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', '01077778888', (NOW() - INTERVAL '6 days')::date, NOW() - INTERVAL '6 days'),
  ('f0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000006', '01088889999', (NOW() - INTERVAL '5 days')::date, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Treatment Details & Virtual Code Status Updates
-- ============================================

DO $$
DECLARE
  code_ids UUID[];
BEGIN
  -- Treatment 1: LOT-003에서 50개 시술
  SELECT ARRAY_AGG(id) INTO code_ids FROM (
    SELECT id FROM virtual_codes
    WHERE lot_id = 'd0000000-0000-0000-0000-000000000003'
      AND owner_id = 'a0000000-0000-0000-0000-000000000004'
      AND status = 'IN_STOCK'
    ORDER BY created_at LIMIT 50
  ) sub;

  INSERT INTO treatment_details (treatment_id, virtual_code_id)
  SELECT 'f0000000-0000-0000-0000-000000000001', unnest(code_ids)
  ON CONFLICT DO NOTHING;

  UPDATE virtual_codes SET status = 'USED', owner_type = 'PATIENT', owner_id = '01011112222'
  WHERE id = ANY(code_ids);

  -- Treatment 2: LOT-003에서 30개 시술
  SELECT ARRAY_AGG(id) INTO code_ids FROM (
    SELECT id FROM virtual_codes
    WHERE lot_id = 'd0000000-0000-0000-0000-000000000003'
      AND owner_id = 'a0000000-0000-0000-0000-000000000004'
      AND status = 'IN_STOCK'
    ORDER BY created_at LIMIT 30
  ) sub;

  INSERT INTO treatment_details (treatment_id, virtual_code_id)
  SELECT 'f0000000-0000-0000-0000-000000000002', unnest(code_ids)
  ON CONFLICT DO NOTHING;

  UPDATE virtual_codes SET status = 'USED', owner_type = 'PATIENT', owner_id = '01022223333'
  WHERE id = ANY(code_ids);

  -- Treatment 3: LOT-002에서 40개 시술 (병원2)
  SELECT ARRAY_AGG(id) INTO code_ids FROM (
    SELECT id FROM virtual_codes
    WHERE lot_id = 'd0000000-0000-0000-0000-000000000002'
      AND owner_id = 'a0000000-0000-0000-0000-000000000006'
      AND status = 'IN_STOCK'
    ORDER BY created_at LIMIT 40
  ) sub;

  INSERT INTO treatment_details (treatment_id, virtual_code_id)
  SELECT 'f0000000-0000-0000-0000-000000000003', unnest(code_ids)
  ON CONFLICT DO NOTHING;

  UPDATE virtual_codes SET status = 'USED', owner_type = 'PATIENT', owner_id = '01033334444'
  WHERE id = ANY(code_ids);

  -- Treatment 4: LOT-005에서 20개 시술
  SELECT ARRAY_AGG(id) INTO code_ids FROM (
    SELECT id FROM virtual_codes
    WHERE lot_id = 'd0000000-0000-0000-0000-000000000005'
      AND owner_id = 'a0000000-0000-0000-0000-000000000004'
      AND status = 'IN_STOCK'
    ORDER BY created_at LIMIT 20
  ) sub;

  INSERT INTO treatment_details (treatment_id, virtual_code_id)
  SELECT 'f0000000-0000-0000-0000-000000000004', unnest(code_ids)
  ON CONFLICT DO NOTHING;

  UPDATE virtual_codes SET status = 'USED', owner_type = 'PATIENT', owner_id = '01044445555'
  WHERE id = ANY(code_ids);

  -- Treatment 5: LOT-008에서 80개 시술
  SELECT ARRAY_AGG(id) INTO code_ids FROM (
    SELECT id FROM virtual_codes
    WHERE lot_id = 'd0000000-0000-0000-0000-000000000008'
      AND owner_id = 'a0000000-0000-0000-0000-000000000004'
      AND status = 'IN_STOCK'
    ORDER BY created_at LIMIT 80
  ) sub;

  INSERT INTO treatment_details (treatment_id, virtual_code_id)
  SELECT 'f0000000-0000-0000-0000-000000000005', unnest(code_ids)
  ON CONFLICT DO NOTHING;

  UPDATE virtual_codes SET status = 'USED', owner_type = 'PATIENT', owner_id = '01055556666'
  WHERE id = ANY(code_ids);

  -- Treatment 6: LOT-010에서 30개 시술 (24시간 이내)
  SELECT ARRAY_AGG(id) INTO code_ids FROM (
    SELECT id FROM virtual_codes
    WHERE lot_id = 'd0000000-0000-0000-0000-000000000010'
      AND owner_id = 'a0000000-0000-0000-0000-000000000004'
      AND status = 'IN_STOCK'
    ORDER BY created_at LIMIT 30
  ) sub;

  INSERT INTO treatment_details (treatment_id, virtual_code_id)
  SELECT 'f0000000-0000-0000-0000-000000000006', unnest(code_ids)
  ON CONFLICT DO NOTHING;

  UPDATE virtual_codes SET status = 'USED', owner_type = 'PATIENT', owner_id = '01066667777'
  WHERE id = ANY(code_ids);

  -- Treatment 7: LOT-003에서 20개 시술 (회수될 예정)
  SELECT ARRAY_AGG(id) INTO code_ids FROM (
    SELECT id FROM virtual_codes
    WHERE lot_id = 'd0000000-0000-0000-0000-000000000003'
      AND owner_id = 'a0000000-0000-0000-0000-000000000004'
      AND status = 'IN_STOCK'
    ORDER BY created_at LIMIT 20
  ) sub;

  INSERT INTO treatment_details (treatment_id, virtual_code_id)
  SELECT 'f0000000-0000-0000-0000-000000000007', unnest(code_ids)
  ON CONFLICT DO NOTHING;

  -- 회수되었으므로 원래 상태로 복구 (IN_STOCK, 병원 소유)
  -- 시술 취소이므로 USED가 아님

  -- Treatment 8: LOT-002에서 10개 시술 (회수될 예정, 병원2)
  SELECT ARRAY_AGG(id) INTO code_ids FROM (
    SELECT id FROM virtual_codes
    WHERE lot_id = 'd0000000-0000-0000-0000-000000000002'
      AND owner_id = 'a0000000-0000-0000-0000-000000000006'
      AND status = 'IN_STOCK'
    ORDER BY created_at LIMIT 10
  ) sub;

  INSERT INTO treatment_details (treatment_id, virtual_code_id)
  SELECT 'f0000000-0000-0000-0000-000000000008', unnest(code_ids)
  ON CONFLICT DO NOTHING;

  -- 회수되었으므로 원래 상태로 복구 (IN_STOCK, 병원 소유)
END $$;

-- ============================================
-- Histories (이력 기록)
-- ============================================
-- Note: histories trigger is disabled, so we insert manually
-- Action types: PRODUCED, SHIPPED, RECEIVED, TREATED, RECALLED, DISPOSED

DO $$
DECLARE
  code_rec RECORD;
  batch_rec RECORD;
BEGIN
  -- PRODUCED histories (Lot 생성 시)
  FOR code_rec IN
    SELECT vc.id as virtual_code_id, p.organization_id as manufacturer_id, l.id as the_lot_id
    FROM virtual_codes vc
    JOIN lots l ON vc.lot_id = l.id
    JOIN products p ON l.product_id = p.id
    WHERE l.id IN (
      'd0000000-0000-0000-0000-000000000001',
      'd0000000-0000-0000-0000-000000000002',
      'd0000000-0000-0000-0000-000000000003',
      'd0000000-0000-0000-0000-000000000004',
      'd0000000-0000-0000-0000-000000000005'
    )
    LIMIT 500  -- 처음 500개만 이력 생성 (성능상)
  LOOP
    INSERT INTO histories (virtual_code_id, action_type, from_owner_type, from_owner_id, to_owner_type, to_owner_id, is_recall)
    VALUES (code_rec.virtual_code_id, 'PRODUCED', 'ORGANIZATION', code_rec.manufacturer_id, 'ORGANIZATION', code_rec.manufacturer_id, false)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- SHIPPED/RECEIVED histories for main shipments
  -- Shipment 1: 제조사 → 유통사1 (LOT-002)
  FOR code_rec IN
    SELECT id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000002' LIMIT 100
  LOOP
    INSERT INTO histories (virtual_code_id, action_type, from_owner_type, from_owner_id, to_owner_type, to_owner_id, shipment_batch_id, is_recall, created_at)
    VALUES (code_rec.id, 'SHIPPED', 'ORGANIZATION', 'a0000000-0000-0000-0000-000000000002', 'ORGANIZATION', 'a0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', false, NOW() - INTERVAL '7 days')
    ON CONFLICT DO NOTHING;

    INSERT INTO histories (virtual_code_id, action_type, from_owner_type, from_owner_id, to_owner_type, to_owner_id, shipment_batch_id, is_recall, created_at)
    VALUES (code_rec.id, 'RECEIVED', 'ORGANIZATION', 'a0000000-0000-0000-0000-000000000002', 'ORGANIZATION', 'a0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', false, NOW() - INTERVAL '7 days')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Shipment 2: 제조사 → 병원1 (LOT-003)
  FOR code_rec IN
    SELECT id FROM virtual_codes WHERE lot_id = 'd0000000-0000-0000-0000-000000000003' LIMIT 100
  LOOP
    INSERT INTO histories (virtual_code_id, action_type, from_owner_type, from_owner_id, to_owner_type, to_owner_id, shipment_batch_id, is_recall, created_at)
    VALUES (code_rec.id, 'SHIPPED', 'ORGANIZATION', 'a0000000-0000-0000-0000-000000000002', 'ORGANIZATION', 'a0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', false, NOW() - INTERVAL '7 days')
    ON CONFLICT DO NOTHING;

    INSERT INTO histories (virtual_code_id, action_type, from_owner_type, from_owner_id, to_owner_type, to_owner_id, shipment_batch_id, is_recall, created_at)
    VALUES (code_rec.id, 'RECEIVED', 'ORGANIZATION', 'a0000000-0000-0000-0000-000000000002', 'ORGANIZATION', 'a0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', false, NOW() - INTERVAL '7 days')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- TREATED histories
  FOR code_rec IN
    SELECT td.virtual_code_id, tr.patient_phone, tr.hospital_id, tr.created_at
    FROM treatment_details td
    JOIN treatment_records tr ON td.treatment_id = tr.id
    WHERE tr.id IN (
      'f0000000-0000-0000-0000-000000000001',
      'f0000000-0000-0000-0000-000000000002',
      'f0000000-0000-0000-0000-000000000003'
    )
  LOOP
    INSERT INTO histories (virtual_code_id, action_type, from_owner_type, from_owner_id, to_owner_type, to_owner_id, is_recall, created_at)
    VALUES (code_rec.virtual_code_id, 'TREATED', 'ORGANIZATION', code_rec.hospital_id, 'PATIENT', code_rec.patient_phone, false, code_rec.created_at)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- RECALLED histories (출고 회수)
  -- Shipment 14 회수
  FOR code_rec IN
    SELECT sd.virtual_code_id FROM shipment_details sd WHERE sd.shipment_batch_id = 'e0000000-0000-0000-0000-000000000014' LIMIT 20
  LOOP
    INSERT INTO histories (virtual_code_id, action_type, from_owner_type, from_owner_id, to_owner_type, to_owner_id, shipment_batch_id, is_recall, recall_reason, created_at)
    VALUES (code_rec.virtual_code_id, 'RECALLED', 'ORGANIZATION', 'a0000000-0000-0000-0000-000000000003', 'ORGANIZATION', 'a0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000014', true, '품질 검사 불합격', NOW() - INTERVAL '9 days 12 hours')
    ON CONFLICT DO NOTHING;
  END LOOP;

END $$;

-- ============================================
-- Summary Statistics (참조용)
-- ============================================
-- Expected data distribution:
--
-- Products: 5 (4 active, 1 inactive)
-- Lots: 10 (total ~2,500 virtual codes)
-- Shipment Batches: 15 (13 normal, 2 recalled)
-- Treatment Records: 8 (6 normal, 2 recalled)
-- Patients: 8
--
-- Virtual Code Status:
-- - IN_STOCK (Manufacturer): ~700
-- - IN_STOCK (Distributor1): ~150
-- - IN_STOCK (Distributor2): ~100
-- - IN_STOCK (Hospital1): ~400
-- - IN_STOCK (Hospital2): ~60
-- - USED (Patients): ~250
--
-- Histories by Action Type:
-- - PRODUCED: ~500 (limited for performance)
-- - SHIPPED: ~200
-- - RECEIVED: ~200
-- - TREATED: ~120
-- - RECALLED: ~50
