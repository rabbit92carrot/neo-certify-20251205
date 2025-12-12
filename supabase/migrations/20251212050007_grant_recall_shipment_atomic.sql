-- Migration: 20251212050007_grant_recall_shipment_atomic
-- Description: Grant permission on recall_shipment_atomic function

GRANT EXECUTE ON FUNCTION recall_shipment_atomic(UUID, UUID, VARCHAR) TO authenticated;
