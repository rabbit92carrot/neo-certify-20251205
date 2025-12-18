-- Migration: 20251219100001_add_updated_at_columns
-- Description: Add updated_at columns to lots, patients, treatment_records tables
-- Created: 2025-12-19

-- ============================================
-- Add updated_at to lots
-- ============================================
ALTER TABLE lots
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- Add updated_at to patients
-- ============================================
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- Add updated_at to treatment_records
-- ============================================
ALTER TABLE treatment_records
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- Create triggers for automatic update
-- ============================================
-- Note: update_updated_at_column() function already exists in 20251209081000_update_updated_at_column.sql

-- Drop existing triggers if any (idempotent)
DROP TRIGGER IF EXISTS trg_lots_updated_at ON lots;
DROP TRIGGER IF EXISTS trg_patients_updated_at ON patients;
DROP TRIGGER IF EXISTS trg_treatment_records_updated_at ON treatment_records;

CREATE TRIGGER trg_lots_updated_at
  BEFORE UPDATE ON lots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_treatment_records_updated_at
  BEFORE UPDATE ON treatment_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
