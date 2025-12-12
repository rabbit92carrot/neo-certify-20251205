-- Migration: 20251212065701_backfill_received_history
-- Description: Backfill RECEIVED history for existing SHIPPED records

INSERT INTO histories (
  virtual_code_id, action_type, from_owner_type, from_owner_id,
  to_owner_type, to_owner_id, shipment_batch_id, is_recall, created_at
)
SELECT
  h.virtual_code_id,
  'RECEIVED',
  h.from_owner_type,
  h.from_owner_id,
  h.to_owner_type,
  h.to_owner_id,
  h.shipment_batch_id,
  h.is_recall,
  h.created_at
FROM histories h
WHERE h.action_type = 'SHIPPED'
  AND h.shipment_batch_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM histories h2
    WHERE h2.virtual_code_id = h.virtual_code_id
      AND h2.action_type = 'RECEIVED'
      AND h2.shipment_batch_id = h.shipment_batch_id
  );
