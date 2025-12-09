-- Migration: 00008_create_histories
-- Description: Create histories table for tracking all movements
-- Created: 2025-12-09

-- ============================================
-- Histories Table
-- ============================================
-- Tracks all ownership changes and actions for virtual codes
-- This is an audit log for complete traceability

CREATE TABLE histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Virtual code being tracked
  virtual_code_id UUID NOT NULL REFERENCES virtual_codes(id) ON DELETE RESTRICT,

  -- Action type
  action_type history_action_type NOT NULL,

  -- Previous owner
  from_owner_type owner_type NOT NULL,
  from_owner_id VARCHAR(50) NOT NULL,

  -- New owner
  to_owner_type owner_type NOT NULL,
  to_owner_id VARCHAR(50) NOT NULL,

  -- Related shipment batch (if applicable)
  shipment_batch_id UUID REFERENCES shipment_batches(id) ON DELETE SET NULL,

  -- Recall information
  is_recall BOOLEAN NOT NULL DEFAULT FALSE,
  recall_reason TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
-- Recall consistency: If is_recall is true, reason should be provided
ALTER TABLE histories
  ADD CONSTRAINT chk_history_recall_consistency
  CHECK (
    (is_recall = FALSE AND recall_reason IS NULL)
    OR
    (is_recall = TRUE AND recall_reason IS NOT NULL)
  );

-- Comments
COMMENT ON TABLE histories IS '이력 - 모든 이동/변경 이력 기록 (감사 로그)';
COMMENT ON COLUMN histories.virtual_code_id IS '추적 대상 가상 식별코드 ID';
COMMENT ON COLUMN histories.action_type IS '액션 유형: PRODUCED, SHIPPED, RECEIVED, TREATED, RECALLED, DISPOSED';
COMMENT ON COLUMN histories.from_owner_type IS '이전 소유자 유형';
COMMENT ON COLUMN histories.from_owner_id IS '이전 소유자 ID (조직 UUID 또는 환자 전화번호)';
COMMENT ON COLUMN histories.to_owner_type IS '새 소유자 유형';
COMMENT ON COLUMN histories.to_owner_id IS '새 소유자 ID';
COMMENT ON COLUMN histories.shipment_batch_id IS '관련 이관 뭉치 ID (출고/입고/회수 시)';
COMMENT ON COLUMN histories.is_recall IS '회수로 인한 이력인지 여부 (별도 색상 표시용)';
COMMENT ON COLUMN histories.recall_reason IS '회수 사유';
