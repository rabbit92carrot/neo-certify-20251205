-- Migration: 20251209080600_create_treatments
-- Description: Create treatment_records and treatment_details tables
-- Created: 2025-12-09

-- ============================================
-- Treatment Records Table
-- ============================================
-- Represents a treatment session at a hospital
-- One treatment record = one procedure for one patient

CREATE TABLE treatment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Hospital that performed the treatment
  hospital_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,

  -- Patient (identified by phone number)
  patient_phone VARCHAR(15) NOT NULL REFERENCES patients(phone_number) ON DELETE RESTRICT,

  -- Treatment date
  treatment_date DATE NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments

-- ============================================
-- Treatment Details Table
-- ============================================
-- Links individual virtual codes to treatment records

CREATE TABLE treatment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  treatment_id UUID NOT NULL REFERENCES treatment_records(id) ON DELETE CASCADE,
  virtual_code_id UUID NOT NULL REFERENCES virtual_codes(id) ON DELETE RESTRICT
);

-- Unique constraint: Same code cannot be in the same treatment twice
ALTER TABLE treatment_details
  ADD CONSTRAINT uq_treatment_details_treatment_code
  UNIQUE (treatment_id, virtual_code_id);

-- Comments

