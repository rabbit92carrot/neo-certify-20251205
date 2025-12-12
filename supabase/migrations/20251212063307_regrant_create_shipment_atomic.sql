-- Migration: 20251212063307_regrant_create_shipment_atomic
-- Description: Re-grant after SECURITY DEFINER update

GRANT EXECUTE ON FUNCTION create_shipment_atomic(UUID, UUID, organization_type, JSONB) TO authenticated;
