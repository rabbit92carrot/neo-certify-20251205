-- Migration: 00021_add_security_definer
-- Description: Add SECURITY DEFINER to atomic operation functions
-- Created: 2025-12-12
-- Purpose: Allow functions to bypass RLS when modifying tables

-- ============================================
-- Update functions with SECURITY DEFINER
-- ============================================

-- get_or_create_patient
CREATE OR REPLACE FUNCTION get_or_create_patient(p_phone_number VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_normalized_phone VARCHAR;
BEGIN
  v_normalized_phone := regexp_replace(p_phone_number, '[^0-9]', '', 'g');
  INSERT INTO patients (phone_number)
  VALUES (v_normalized_phone)
  ON CONFLICT (phone_number) DO NOTHING;
  RETURN v_normalized_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- create_shipment_atomic
CREATE OR REPLACE FUNCTION create_shipment_atomic(
  p_from_org_id UUID,
  p_to_org_id UUID,
  p_to_org_type organization_type,
  p_items JSONB
)
RETURNS TABLE(
  shipment_batch_id UUID,
  total_quantity INT,
  error_code VARCHAR,
  error_message VARCHAR
) AS $$
DECLARE
  v_batch_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_lot_id UUID;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
BEGIN
  IF p_from_org_id = p_to_org_id THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'SELF_SHIPMENT'::VARCHAR, '자기 자신에게는 출고할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = p_to_org_id AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'ORGANIZATION_NOT_FOUND'::VARCHAR, '수신 조직을 찾을 수 없거나 비활성 상태입니다.'::VARCHAR;
    RETURN;
  END IF;

  INSERT INTO shipment_batches (from_organization_id, to_organization_id, to_organization_type)
  VALUES (p_from_org_id, p_to_org_id, p_to_org_type)
  RETURNING id INTO v_batch_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;
    v_lot_id := NULLIF(v_item->>'lotId', '')::UUID;

    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = p_from_org_id::VARCHAR
        AND (v_lot_id IS NULL OR vc.lot_id = v_lot_id)
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL OR array_length(v_selected_codes, 1) < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    FOREACH v_code_id IN ARRAY v_selected_codes
    LOOP
      INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
      VALUES (v_batch_id, v_code_id);

      UPDATE virtual_codes
      SET owner_id = p_to_org_id::VARCHAR, owner_type = 'ORGANIZATION'
      WHERE id = v_code_id;

      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, shipment_batch_id, is_recall
      ) VALUES (
        v_code_id, 'SHIPPED', 'ORGANIZATION', p_from_org_id::VARCHAR,
        'ORGANIZATION', p_to_org_id::VARCHAR, v_batch_id, FALSE
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT v_batch_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT NULL::UUID, 0, 'INSUFFICIENT_STOCK'::VARCHAR, SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT NULL::UUID, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- recall_shipment_atomic
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
  v_code_id UUID;
  v_count INT := 0;
BEGIN
  SELECT * INTO v_batch FROM shipment_batches WHERE id = p_shipment_batch_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'BATCH_NOT_FOUND'::VARCHAR, '출고 뭉치를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_batch.from_organization_id != p_from_org_id THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR, '발송자만 회수할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_batch.is_recalled THEN
    RETURN QUERY SELECT FALSE, 0, 'ALREADY_RECALLED'::VARCHAR, '이미 회수된 출고 뭉치입니다.'::VARCHAR;
    RETURN;
  END IF;

  IF (NOW() - v_batch.shipment_date) > INTERVAL '24 hours' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_TIME_EXCEEDED'::VARCHAR, '24시간 경과하여 처리할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT ARRAY_AGG(sd.virtual_code_id) INTO v_code_ids
  FROM shipment_details sd WHERE sd.shipment_batch_id = p_shipment_batch_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR, '회수할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  UPDATE virtual_codes
  SET owner_id = p_from_org_id::VARCHAR, owner_type = 'ORGANIZATION'
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE shipment_batches
  SET is_recalled = TRUE, recall_reason = p_reason, recall_date = NOW()
  WHERE id = p_shipment_batch_id;

  FOREACH v_code_id IN ARRAY v_code_ids
  LOOP
    INSERT INTO histories (
      virtual_code_id, action_type, from_owner_type, from_owner_id,
      to_owner_type, to_owner_id, shipment_batch_id, is_recall, recall_reason
    ) VALUES (
      v_code_id, 'RECALLED', 'ORGANIZATION', v_batch.to_organization_id::VARCHAR,
      'ORGANIZATION', p_from_org_id::VARCHAR, p_shipment_batch_id, TRUE, p_reason
    );
  END LOOP;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- create_treatment_atomic
CREATE OR REPLACE FUNCTION create_treatment_atomic(
  p_hospital_id UUID,
  p_patient_phone VARCHAR,
  p_treatment_date DATE,
  p_items JSONB
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
  v_code_id UUID;
  v_total INT := 0;
BEGIN
  v_normalized_phone := get_or_create_patient(p_patient_phone);

  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = p_hospital_id AND type = 'HOSPITAL' AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'HOSPITAL_NOT_FOUND'::VARCHAR, '병원 정보를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  INSERT INTO treatment_records (hospital_id, patient_phone, treatment_date)
  VALUES (p_hospital_id, v_normalized_phone, p_treatment_date)
  RETURNING id INTO v_treatment_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

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

    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL OR array_length(v_selected_codes, 1) < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    FOREACH v_code_id IN ARRAY v_selected_codes
    LOOP
      INSERT INTO treatment_details (treatment_id, virtual_code_id)
      VALUES (v_treatment_id, v_code_id);

      UPDATE virtual_codes
      SET owner_id = v_normalized_phone, owner_type = 'PATIENT', status = 'USED'
      WHERE id = v_code_id;

      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, is_recall
      ) VALUES (
        v_code_id, 'TREATED', 'ORGANIZATION', p_hospital_id::VARCHAR,
        'PATIENT', v_normalized_phone, FALSE
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT v_treatment_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT NULL::UUID, 0, 'INSUFFICIENT_STOCK'::VARCHAR, SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT NULL::UUID, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- recall_treatment_atomic
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
  SELECT * INTO v_treatment FROM treatment_records WHERE id = p_treatment_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'TREATMENT_NOT_FOUND'::VARCHAR, '시술 기록을 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_treatment.hospital_id != p_hospital_id THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR, '해당 병원에서만 회수할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF (NOW() - v_treatment.created_at) > INTERVAL '24 hours' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_TIME_EXCEEDED'::VARCHAR, '24시간 경과하여 처리할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT ARRAY_AGG(td.virtual_code_id) INTO v_code_ids
  FROM treatment_details td WHERE td.treatment_id = p_treatment_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR, '회수할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  UPDATE virtual_codes
  SET owner_id = p_hospital_id::VARCHAR, owner_type = 'ORGANIZATION', status = 'IN_STOCK'
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  DELETE FROM treatment_details WHERE treatment_id = p_treatment_id;
  DELETE FROM treatment_records WHERE id = p_treatment_id;

  FOREACH v_code_id IN ARRAY v_code_ids
  LOOP
    INSERT INTO histories (
      virtual_code_id, action_type, from_owner_type, from_owner_id,
      to_owner_type, to_owner_id, is_recall, recall_reason
    ) VALUES (
      v_code_id, 'RECALLED', 'PATIENT', v_treatment.patient_phone,
      'ORGANIZATION', p_hospital_id::VARCHAR, TRUE, p_reason
    );
  END LOOP;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Re-grant Execute Permissions
-- ============================================
GRANT EXECUTE ON FUNCTION get_or_create_patient(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION create_shipment_atomic(UUID, UUID, organization_type, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION recall_shipment_atomic(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION create_treatment_atomic(UUID, VARCHAR, DATE, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION recall_treatment_atomic(UUID, UUID, VARCHAR) TO authenticated;
