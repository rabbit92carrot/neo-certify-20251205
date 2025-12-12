-- Migration: 20251212083705_idx_lots_product_lot_number
-- Description: Index for Lot search by product and lot_number

CREATE INDEX IF NOT EXISTS idx_lots_product_lot_number
ON lots(product_id, lot_number);
