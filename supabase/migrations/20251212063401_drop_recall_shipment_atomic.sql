-- Migration: 20251212063401_drop_recall_shipment_atomic
-- Description: Drop old function signature before creating secured version

DROP FUNCTION IF EXISTS recall_shipment_atomic(UUID, UUID, VARCHAR);
