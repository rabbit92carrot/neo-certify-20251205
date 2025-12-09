-- Migration: 00003_create_products
-- Description: Create products and lots tables
-- Created: 2025-12-09

-- ============================================
-- Products Table
-- ============================================
-- Represents product types registered by manufacturers

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to manufacturer organization
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,

  -- Product information
  name VARCHAR(100) NOT NULL,
  udi_di VARCHAR(100) NOT NULL,      -- UDI-DI (의료기기 고유식별코드)
  model_name VARCHAR(100) NOT NULL,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: Same UDI-DI cannot be duplicated within the same manufacturer
ALTER TABLE products
  ADD CONSTRAINT uq_products_org_udi_di
  UNIQUE (organization_id, udi_di);

-- Comments
COMMENT ON TABLE products IS '제품 종류 - 제조사별 등록, 비활성화 시 Lot 생산 목록에서 미노출';
COMMENT ON COLUMN products.organization_id IS '제조사 조직 ID (최초 생산자, 변경 불가)';
COMMENT ON COLUMN products.udi_di IS 'UDI-DI (의료기기 고유식별코드) - 제품 종류 + 포장 단위별 동일';
COMMENT ON COLUMN products.model_name IS '모델명 (Lot 번호 생성에 사용)';
COMMENT ON COLUMN products.is_active IS '활성 상태 (false 시 생산 목록에서 미노출, 이력은 유지)';

-- ============================================
-- Lots Table
-- ============================================
-- Represents production batches (Lot)

CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to product
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Lot information
  lot_number VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  manufacture_date DATE NOT NULL,
  expiry_date DATE NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE lots
  ADD CONSTRAINT chk_lot_quantity
  CHECK (quantity >= 1 AND quantity <= 100000);

ALTER TABLE lots
  ADD CONSTRAINT chk_lot_expiry_after_manufacture
  CHECK (expiry_date > manufacture_date);

-- Unique constraint: Same Lot number cannot be duplicated within the same product
ALTER TABLE lots
  ADD CONSTRAINT uq_lots_product_lot_number
  UNIQUE (product_id, lot_number);

-- Comments
COMMENT ON TABLE lots IS '생산 배치 (Lot) - 동일 조건에서 생산된 제품 그룹';
COMMENT ON COLUMN lots.lot_number IS 'Lot 번호 (제조사 설정 정규식 기반 자동 생성)';
COMMENT ON COLUMN lots.quantity IS '생산 수량 (최소 1, 최대 100,000)';
COMMENT ON COLUMN lots.manufacture_date IS '생산일자';
COMMENT ON COLUMN lots.expiry_date IS '사용기한 (생산일 + 설정 기간)';
