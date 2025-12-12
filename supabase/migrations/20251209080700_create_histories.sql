-- Migration: 20251209080700_create_histories
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

