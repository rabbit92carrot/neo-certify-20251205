-- Migration: 20251212063407_grant_secured_recall_shipment
-- Description: Grant for secured recall_shipment_atomic (new signature)

GRANT EXECUTE ON FUNCTION recall_shipment_atomic(UUID, VARCHAR) TO authenticated;
