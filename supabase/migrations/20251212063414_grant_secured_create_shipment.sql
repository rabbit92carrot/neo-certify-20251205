-- Migration: 20251212063406_grant_secured_create_shipment
-- Description: Grant for secured create_shipment_atomic (new signature)

GRANT EXECUTE ON FUNCTION create_shipment_atomic(UUID, organization_type, JSONB) TO authenticated;
