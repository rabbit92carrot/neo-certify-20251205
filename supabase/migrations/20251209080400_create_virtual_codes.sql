-- Migration: 20251209080400_create_virtual_codes
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

