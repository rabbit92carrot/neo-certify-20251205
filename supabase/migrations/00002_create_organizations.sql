-- Migration: 00002_create_organizations
-- Description: Create organizations and manufacturer_settings tables
-- Created: 2025-12-09

-- ============================================
-- Organizations Table
-- ============================================
-- Represents organizations (accounts) in the system
-- 1 Organization = 1 Account (shared by multiple users within the organization)

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Supabase Auth connection
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Organization type
  type organization_type NOT NULL,

  -- Login credentials
  email VARCHAR(255) NOT NULL UNIQUE,

  -- Business information
  business_number VARCHAR(10) NOT NULL UNIQUE,  -- 사업자등록번호 (숫자만, 10자리)
  business_license_file VARCHAR(500) NOT NULL,  -- Storage bucket path

  -- Organization details
  name VARCHAR(100) NOT NULL,
  representative_name VARCHAR(50) NOT NULL,
  representative_contact VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,

  -- Status
  status organization_status NOT NULL DEFAULT 'PENDING_APPROVAL',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add constraints
ALTER TABLE organizations
  ADD CONSTRAINT chk_business_number_format
  CHECK (business_number ~ '^[0-9]{10}$');

ALTER TABLE organizations
  ADD CONSTRAINT chk_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Comments
COMMENT ON TABLE organizations IS '조직(=계정) - 1조직 1계정 체제, 조직 내 여러 직원이 동일 계정 공유';
COMMENT ON COLUMN organizations.auth_user_id IS 'Supabase Auth 사용자 ID와 연결';
COMMENT ON COLUMN organizations.business_number IS '사업자등록번호 (하이픈 제거, 숫자 10자리)';
COMMENT ON COLUMN organizations.business_license_file IS 'Storage 버킷 내 사업자등록증 파일 경로';
COMMENT ON COLUMN organizations.status IS '조직 상태 (1차에서는 승인 로직 비활성화, 자동 ACTIVE)';

-- ============================================
-- Manufacturer Settings Table
-- ============================================
-- Manufacturer-specific settings for Lot number generation and expiry

CREATE TABLE manufacturer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to manufacturer organization
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

  -- Lot number generation settings
  lot_prefix VARCHAR(10) NOT NULL DEFAULT 'ND',
  lot_model_digits SMALLINT NOT NULL DEFAULT 5,
  lot_date_format VARCHAR(20) NOT NULL DEFAULT 'yymmdd',

  -- Expiry settings (months)
  expiry_months SMALLINT NOT NULL DEFAULT 24,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add constraints
ALTER TABLE manufacturer_settings
  ADD CONSTRAINT chk_lot_model_digits
  CHECK (lot_model_digits BETWEEN 1 AND 10);

ALTER TABLE manufacturer_settings
  ADD CONSTRAINT chk_expiry_months
  CHECK (expiry_months IN (6, 12, 18, 24, 30, 36));

-- Comments
COMMENT ON TABLE manufacturer_settings IS '제조사별 Lot 번호 생성 규칙 및 사용기한 설정';
COMMENT ON COLUMN manufacturer_settings.lot_prefix IS 'Lot 번호 접두어 (기본: ND)';
COMMENT ON COLUMN manufacturer_settings.lot_model_digits IS '모델 코드 자릿수 (기본: 5)';
COMMENT ON COLUMN manufacturer_settings.lot_date_format IS '날짜 형식 (기본: yymmdd)';
COMMENT ON COLUMN manufacturer_settings.expiry_months IS '사용기한 개월 수 (6개월 단위, 최대 36개월)';
