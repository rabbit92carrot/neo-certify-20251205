-- Migration: 20251209080300_create_patients
-- Description: Create patients table
-- Created: 2025-12-09

-- ============================================
-- Patients Table
-- ============================================
-- Represents patients identified by phone number
-- Patients do not have system accounts; they only receive notifications

CREATE TABLE patients (
  -- Primary key: Normalized phone number (digits only)
  phone_number VARCHAR(15) PRIMARY KEY,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE patients
  ADD CONSTRAINT chk_phone_number_format
  CHECK (phone_number ~ '^[0-9]{10,15}$');

-- Comments

