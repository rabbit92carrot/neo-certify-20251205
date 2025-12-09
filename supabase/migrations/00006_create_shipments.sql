-- Migration: 00006_create_shipments
-- Description: Create shipment_batches and shipment_details tables
-- Created: 2025-12-09

-- ============================================
-- Shipment Batches Table
-- ============================================
-- Represents a batch of products shipped in one transaction
-- One shipment batch = one export action (장바구니 → 출고 확인)

CREATE TABLE shipment_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sender organization
  from_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,

  -- Receiver organization
  to_organization_type organization_type NOT NULL,
  to_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,

  -- Shipment timestamp
  shipment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Recall information
  is_recalled BOOLEAN NOT NULL DEFAULT FALSE,
  recall_reason TEXT,
  recall_date TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
-- Recall consistency: If recalled, reason and date must be present
ALTER TABLE shipment_batches
  ADD CONSTRAINT chk_recall_consistency
  CHECK (
    (is_recalled = FALSE AND recall_reason IS NULL AND recall_date IS NULL)
    OR
    (is_recalled = TRUE AND recall_reason IS NOT NULL AND recall_date IS NOT NULL)
  );

-- Cannot ship to self
ALTER TABLE shipment_batches
  ADD CONSTRAINT chk_no_self_shipment
  CHECK (from_organization_id != to_organization_id);

-- Comments
COMMENT ON TABLE shipment_batches IS '이관 뭉치 - 한 번의 출고로 보낸 제품들을 묶은 단위';
COMMENT ON COLUMN shipment_batches.from_organization_id IS '발송 조직 ID';
COMMENT ON COLUMN shipment_batches.to_organization_type IS '수신 조직 유형 (조회 편의를 위해 저장)';
COMMENT ON COLUMN shipment_batches.to_organization_id IS '수신 조직 ID';
COMMENT ON COLUMN shipment_batches.shipment_date IS '발송일시 (회수 24시간 제한 기준)';
COMMENT ON COLUMN shipment_batches.is_recalled IS '회수 여부';
COMMENT ON COLUMN shipment_batches.recall_reason IS '회수 사유 (필수)';
COMMENT ON COLUMN shipment_batches.recall_date IS '회수일시';

-- ============================================
-- Shipment Details Table
-- ============================================
-- Links individual virtual codes to shipment batches

CREATE TABLE shipment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  shipment_batch_id UUID NOT NULL REFERENCES shipment_batches(id) ON DELETE CASCADE,
  virtual_code_id UUID NOT NULL REFERENCES virtual_codes(id) ON DELETE RESTRICT
);

-- Unique constraint: Same code cannot be in the same batch twice
ALTER TABLE shipment_details
  ADD CONSTRAINT uq_shipment_details_batch_code
  UNIQUE (shipment_batch_id, virtual_code_id);

-- Comments
COMMENT ON TABLE shipment_details IS '이관 뭉치 상세 - 뭉치에 포함된 개별 가상 식별코드';
COMMENT ON COLUMN shipment_details.shipment_batch_id IS '이관 뭉치 ID';
COMMENT ON COLUMN shipment_details.virtual_code_id IS '가상 식별코드 ID';
