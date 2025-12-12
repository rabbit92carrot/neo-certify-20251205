-- Migration: 20251212063308_regrant_recall_shipment_atomic
-- Description: Re-grant after SECURITY DEFINER update

GRANT EXECUTE ON FUNCTION recall_shipment_atomic(UUID, UUID, VARCHAR) TO authenticated;
