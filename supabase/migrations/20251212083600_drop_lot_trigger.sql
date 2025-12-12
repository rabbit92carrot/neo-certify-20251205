-- Migration: 20251212083600_drop_lot_trigger
-- Description: Drop existing trigger for recreation with optimized function

DROP TRIGGER IF EXISTS trg_lot_create_virtual_codes ON lots;
