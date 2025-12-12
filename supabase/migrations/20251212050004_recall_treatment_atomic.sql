-- Migration: 20251212050004_recall_treatment_atomic
-- Description: Atomic treatment recall function

CREATE OR REPLACE FUNCTION recall_treatment_atomic(
  p_hospital_id UUID,
  p_treatment_id UUID,
  p_reason VARCHAR
)
RETURNS TABLE(
  success BOOLEAN,
  recalled_count INT,
  error_code VARCHAR,
  error_message VARCHAR
) AS $$
DECLARE
  v_treatment RECORD;
  v_code_ids UUID[];
  v_code_id UUID;
  v_count INT := 0;
BEGIN
  -- Get treatment info with lock
  SELECT * INTO v_treatment
  FROM treatment_records
  WHERE id = p_treatment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'TREATMENT_NOT_FOUND'::VARCHAR, '시술 기록을 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check ownership
  IF v_treatment.hospital_id != p_hospital_id THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR, '해당 병원에서만 회수할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check 24-hour limit (using created_at)
  IF (NOW() - v_treatment.created_at) > INTERVAL '24 hours' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_TIME_EXCEEDED'::VARCHAR, '24시간 경과하여 처리할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Get all virtual code IDs for this treatment
  SELECT ARRAY_AGG(td.virtual_code_id) INTO v_code_ids
  FROM treatment_details td
  WHERE td.treatment_id = p_treatment_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR, '회수할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Update ownership back to hospital and status to IN_STOCK
  UPDATE virtual_codes
  SET owner_id = p_hospital_id::VARCHAR,
      owner_type = 'ORGANIZATION',
      status = 'IN_STOCK'
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Delete treatment details
  DELETE FROM treatment_details WHERE treatment_id = p_treatment_id;

  -- Delete treatment record
  DELETE FROM treatment_records WHERE id = p_treatment_id;

  -- Record recall history for each code
  FOREACH v_code_id IN ARRAY v_code_ids
  LOOP
    INSERT INTO histories (
      virtual_code_id,
      action_type,
      from_owner_type,
      from_owner_id,
      to_owner_type,
      to_owner_id,
      is_recall,
      recall_reason
    ) VALUES (
      v_code_id,
      'RECALLED',
      'PATIENT',
      v_treatment.patient_phone,
      'ORGANIZATION',
      p_hospital_id::VARCHAR,
      TRUE,
      p_reason
    );
  END LOOP;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$ LANGUAGE plpgsql;
