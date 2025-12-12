-- Migration: 20251212050006_grant_create_shipment_atomic
-- Description: Grant permission on create_shipment_atomic function

GRANT EXECUTE ON FUNCTION create_shipment_atomic(UUID, UUID, organization_type, JSONB) TO authenticated;
