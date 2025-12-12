-- Migration: 20251209080500_create_shipments
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

