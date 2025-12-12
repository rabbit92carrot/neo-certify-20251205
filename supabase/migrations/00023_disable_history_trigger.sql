-- Migration: 00023_disable_history_trigger
-- Description: Disable virtual_code_history trigger to prevent duplicate history records
-- Created: 2025-12-12
--
-- Problem:
--   - trg_virtual_code_history trigger automatically creates history on virtual_codes UPDATE
--   - create_shipment_atomic and create_treatment_atomic also INSERT history directly
--   - Result: Duplicate history records (one from trigger without shipment_batch_id, one from function with it)
--
-- Solution:
--   - Disable the trigger since atomic functions handle history creation properly
--   - Atomic functions include shipment_batch_id which is needed for proper grouping

-- ============================================
-- 1. Disable the history trigger
-- ============================================
ALTER TABLE virtual_codes DISABLE TRIGGER trg_virtual_code_history;

-- Note: We keep trg_virtual_code_produced for production history (when lot generates codes)
-- That trigger handles PRODUCED action type which is separate from shipments/treatments

-- ============================================
-- 2. Clean up orphan history records (optional but recommended)
-- These are records created by the trigger without shipment_batch_id
-- ============================================
DELETE FROM histories
WHERE action_type = 'SHIPPED'
  AND shipment_batch_id IS NULL;

-- Also clean up TREATED records without proper linkage if any exist
DELETE FROM histories
WHERE action_type = 'TREATED'
  AND shipment_batch_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM treatment_details td
    WHERE td.virtual_code_id = histories.virtual_code_id
  );

COMMENT ON TRIGGER trg_virtual_code_history ON virtual_codes IS
  'DISABLED: History is now managed by atomic functions (create_shipment_atomic, create_treatment_atomic) for proper batch ID tracking';
