-- Migration: 20251212083606_create_treatment_atomic_bulk
-- Description: Optimized create_treatment_atomic with BULK operations

CREATE OR REPLACE FUNCTION create_treatment_atomic(
  p_hospital_id UUID,
  p_patient_phone VARCHAR,
  p_treatment_date DATE,
  p_items JSONB  -- [{productId, quantity}]
)
RETURNS TABLE(
  treatment_id UUID,
  total_quantity INT,
  error_code VARCHAR,
  error_message VARCHAR
) AS $$
DECLARE
  v_treatment_id UUID;
  v_normalized_phone VARCHAR;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_selected_codes UUID[];
  v_total INT := 0;
BEGIN
  -- Normalize and create/get patient
  v_normalized_phone := get_or_create_patient(p_patient_phone);

  -- Verify hospital exists
  IF NOT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = p_hospital_id AND type = 'HOSPITAL' AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT
      NULL::UUID, 0,
      'HOSPITAL_NOT_FOUND'::VARCHAR,
      '병원 정보를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Create treatment record
  INSERT INTO treatment_records (
    hospital_id,
    patient_phone,
    treatment_date
  ) VALUES (
    p_hospital_id,
    v_normalized_phone,
    p_treatment_date
  ) RETURNING id INTO v_treatment_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

    -- Select FIFO codes with lock
    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = p_hospital_id::VARCHAR
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    -- Check if we got enough codes
    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL OR array_length(v_selected_codes, 1) < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    -- BULK INSERT: treatment_details
    INSERT INTO treatment_details (treatment_id, virtual_code_id)
    SELECT v_treatment_id, UNNEST(v_selected_codes);

    -- BULK UPDATE: ownership to patient and status to USED
    UPDATE virtual_codes
    SET owner_id = v_normalized_phone,
        owner_type = 'PATIENT',
        status = 'USED'
    WHERE id = ANY(v_selected_codes);

    -- BULK INSERT: histories
    INSERT INTO histories (
      virtual_code_id,
      action_type,
      from_owner_type,
      from_owner_id,
      to_owner_type,
      to_owner_id,
      is_recall
    )
    SELECT
      UNNEST(v_selected_codes),
      'TREATED'::history_action_type,
      'ORGANIZATION'::owner_type,
      p_hospital_id::VARCHAR,
      'PATIENT'::owner_type,
      v_normalized_phone,
      FALSE;

    v_total := v_total + array_length(v_selected_codes, 1);
  END LOOP;

  RETURN QUERY SELECT v_treatment_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT
        NULL::UUID, 0,
        'INSUFFICIENT_STOCK'::VARCHAR,
        SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT
        NULL::UUID, 0,
        'INTERNAL_ERROR'::VARCHAR,
        SQLERRM::VARCHAR;
    END IF;
END;
$$ LANGUAGE plpgsql;

