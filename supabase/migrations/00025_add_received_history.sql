-- Migration: 00025_add_received_history
-- Description: Add RECEIVED history record when shipment is created
-- Created: 2025-12-12
--
-- Problem:
--   - create_shipment_atomic only creates SHIPPED history
--   - Receiver (hospital/distributor) cannot see incoming shipments in their transaction history
--   - getHospitalHistory filters by action_type = 'RECEIVED' which doesn't exist
--
-- Solution:
--   - Create both SHIPPED and RECEIVED history records for each shipment
--   - SHIPPED: from sender's perspective (sender → receiver)
--   - RECEIVED: from receiver's perspective (sender → receiver)
--   - Both records share the same shipment_batch_id for correlation

-- ============================================
-- 1. Update create_shipment_atomic to add RECEIVED history
-- ============================================
CREATE OR REPLACE FUNCTION create_shipment_atomic(
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
  v_from_org_id UUID;
  v_batch_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_lot_id UUID;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
BEGIN
  -- Derive organization_id from authenticated user
  v_from_org_id := get_user_organization_id();

  IF v_from_org_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요하거나 조직에 소속되어 있지 않습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_from_org_id = p_to_org_id THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'SELF_SHIPMENT'::VARCHAR,
      '자기 자신에게는 출고할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = p_to_org_id AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'ORGANIZATION_NOT_FOUND'::VARCHAR,
      '수신 조직을 찾을 수 없거나 비활성 상태입니다.'::VARCHAR;
    RETURN;
  END IF;

  INSERT INTO shipment_batches (from_organization_id, to_organization_id, to_organization_type)
  VALUES (v_from_org_id, p_to_org_id, p_to_org_type)
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
        AND vc.owner_id = v_from_org_id::VARCHAR
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

      -- SHIPPED history (sender's perspective)
      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, shipment_batch_id, is_recall
      ) VALUES (
        v_code_id, 'SHIPPED', 'ORGANIZATION', v_from_org_id::VARCHAR,
        'ORGANIZATION', p_to_org_id::VARCHAR, v_batch_id, FALSE
      );

      -- RECEIVED history (receiver's perspective)
      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, shipment_batch_id, is_recall
      ) VALUES (
        v_code_id, 'RECEIVED', 'ORGANIZATION', v_from_org_id::VARCHAR,
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

COMMENT ON FUNCTION create_shipment_atomic(UUID, organization_type, JSONB) IS
  '원자적 출고 생성. SHIPPED와 RECEIVED 이력을 모두 생성하여 발송자와 수신자 모두 거래이력을 확인할 수 있습니다.';

-- ============================================
-- 2. Backfill RECEIVED history for existing SHIPPED records
-- ============================================
INSERT INTO histories (
  virtual_code_id, action_type, from_owner_type, from_owner_id,
  to_owner_type, to_owner_id, shipment_batch_id, is_recall, created_at
)
SELECT
  h.virtual_code_id,
  'RECEIVED',
  h.from_owner_type,
  h.from_owner_id,
  h.to_owner_type,
  h.to_owner_id,
  h.shipment_batch_id,
  h.is_recall,
  h.created_at
FROM histories h
WHERE h.action_type = 'SHIPPED'
  AND h.shipment_batch_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM histories h2
    WHERE h2.virtual_code_id = h.virtual_code_id
      AND h2.action_type = 'RECEIVED'
      AND h2.shipment_batch_id = h.shipment_batch_id
  );
