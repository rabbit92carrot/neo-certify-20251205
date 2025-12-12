-- Migration: 20251212083706_idx_shipment_details_batch
-- Description: Index for shipment_details by batch (for bulk summary)

CREATE INDEX IF NOT EXISTS idx_shipment_details_batch
ON shipment_details(shipment_batch_id);
