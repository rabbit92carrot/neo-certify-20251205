-- Migration: 20251212083605_recall_shipment_atomic_bulk
-- Description: Optimized recall_shipment_atomic with BULK operations

CREATE OR REPLACE FUNCTION recall_shipment_atomic(
  p_from_org_id UUID,
  p_shipment_batch_id UUID,
  p_reason VARCHAR
)
RETURNS TABLE(
  success BOOLEAN,
  recalled_count INT,
  error_code VARCHAR,
  error_message VARCHAR
) AS $$
DECLARE
  v_batch RECORD;
  v_code_ids UUID[];
  v_count INT := 0;
BEGIN
  -- Get batch info with lock
  SELECT * INTO v_batch
  FROM shipment_batches
  WHERE id = p_shipment_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'BATCH_NOT_FOUND'::VARCHAR, '출고 뭉치를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check ownership
  IF v_batch.from_organization_id != p_from_org_id THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR, '발송자만 회수할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check if already recalled
  IF v_batch.is_recalled THEN
    RETURN QUERY SELECT FALSE, 0, 'ALREADY_RECALLED'::VARCHAR, '이미 회수된 출고 뭉치입니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check 24-hour limit
  IF (NOW() - v_batch.shipment_date) > INTERVAL '24 hours' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_TIME_EXCEEDED'::VARCHAR, '24시간 경과하여 처리할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Get all virtual code IDs for this batch
  SELECT ARRAY_AGG(sd.virtual_code_id) INTO v_code_ids
  FROM shipment_details sd
  WHERE sd.shipment_batch_id = p_shipment_batch_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR, '회수할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- BULK UPDATE: ownership back to sender
  UPDATE virtual_codes
  SET owner_id = p_from_org_id::VARCHAR,
      owner_type = 'ORGANIZATION'
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Update batch as recalled
  UPDATE shipment_batches
  SET is_recalled = TRUE,
      recall_reason = p_reason,
      recall_date = NOW()
  WHERE id = p_shipment_batch_id;

  -- BULK INSERT: recall history
  INSERT INTO histories (
    virtual_code_id,
    action_type,
    from_owner_type,
    from_owner_id,
    to_owner_type,
    to_owner_id,
    shipment_batch_id,
    is_recall,
    recall_reason
  )
  SELECT
    UNNEST(v_code_ids),
    'RECALLED'::history_action_type,
    'ORGANIZATION'::owner_type,
    v_batch.to_organization_id::VARCHAR,
    'ORGANIZATION'::owner_type,
    p_from_org_id::VARCHAR,
    p_shipment_batch_id,
    TRUE,
    p_reason;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$ LANGUAGE plpgsql;

