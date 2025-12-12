-- Migration: 20251212083713_grant_get_received_shipment_history
-- Description: Grant permission on get_received_shipment_history function

GRANT EXECUTE ON FUNCTION get_received_shipment_history(UUID, INT, INT) TO authenticated;
