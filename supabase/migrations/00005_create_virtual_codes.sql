-- Migration: 00005_create_virtual_codes
-- Description: Create virtual_codes table
-- Created: 2025-12-09

-- ============================================
-- Virtual Codes Table
-- ============================================
-- Represents individual product tracking codes (virtual identification)
-- Each code represents one unit of product

CREATE TABLE virtual_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Unique virtual code (e.g., NC-ABC12345)
  code VARCHAR(20) NOT NULL UNIQUE,

  -- Foreign key to lot
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE RESTRICT,

  -- Status
  status virtual_code_status NOT NULL DEFAULT 'IN_STOCK',

  -- Owner information
  owner_type owner_type NOT NULL DEFAULT 'ORGANIZATION',
  owner_id VARCHAR(50) NOT NULL,  -- Organization UUID or Patient phone number

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE virtual_codes IS '가상 식별코드 - 개별 제품 추적용 고유 번호 (DB 기반 통계적 관리)';
COMMENT ON COLUMN virtual_codes.code IS '고유 가상 식별코드 (예: NC-ABC12345)';
COMMENT ON COLUMN virtual_codes.lot_id IS '소속 Lot ID';
COMMENT ON COLUMN virtual_codes.status IS '상태: IN_STOCK(재고), USED(사용됨), DISPOSED(폐기됨)';
COMMENT ON COLUMN virtual_codes.owner_type IS '소유자 유형: ORGANIZATION(조직) 또는 PATIENT(환자)';
COMMENT ON COLUMN virtual_codes.owner_id IS 'ORGANIZATION 시 조직 UUID, PATIENT 시 전화번호';
