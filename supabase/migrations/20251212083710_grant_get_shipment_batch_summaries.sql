-- Migration: 20251212083710_grant_get_shipment_batch_summaries
-- Description: Grant permission on get_shipment_batch_summaries function

GRANT EXECUTE ON FUNCTION get_shipment_batch_summaries(UUID[]) TO authenticated;
