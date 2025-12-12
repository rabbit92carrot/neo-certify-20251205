-- Migration: 20251212083708_idx_virtual_codes_owner_status_lot
-- Description: Index for virtual_codes by owner with status filter

CREATE INDEX IF NOT EXISTS idx_virtual_codes_owner_status_lot
ON virtual_codes(owner_id, status, lot_id)
WHERE status = 'IN_STOCK';
