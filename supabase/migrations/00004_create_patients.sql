-- Migration: 00004_create_patients
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
COMMENT ON TABLE patients IS '환자 - 전화번호 기반 식별, 시스템 미사용, 알림톡만 수신';
COMMENT ON COLUMN patients.phone_number IS '정규화된 전화번호 (하이픈 제거, 숫자만, 예: 01012345678)';
