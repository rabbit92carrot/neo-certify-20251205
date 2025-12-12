-- Migration: 20251209080200_create_products
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

