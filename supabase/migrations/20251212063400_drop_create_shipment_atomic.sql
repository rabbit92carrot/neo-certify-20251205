-- Migration: 20251212063400_drop_create_shipment_atomic
-- Description: Drop old function signature before creating secured version

DROP FUNCTION IF EXISTS create_shipment_atomic(UUID, UUID, organization_type, JSONB);
