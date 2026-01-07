-- =============================================================================
-- RETURNED 데이터를 RETURN_SENT/RETURN_RECEIVED로 마이그레이션
--
-- 사전조건: 20260108000001_add_return_enum_values.sql 적용 완료
--
-- 목적:
-- 1. 기존 RETURNED 데이터를 RETURN_SENT로 변환
-- 2. 각 RETURN_SENT에 대응하는 RETURN_RECEIVED 생성
-- 3. return_shipment_atomic() 함수 수정
-- 4. get_history_summary_cursor() WHERE 절 업데이트
-- =============================================================================

-- 1. 기존 RETURNED 데이터 마이그레이션
-- 1a. 기존 RETURNED를 RETURN_SENT로 변경
UPDATE histories
SET action_type = 'RETURN_SENT'::history_action_type
WHERE action_type = 'RETURNED';

-- 1b. 각 RETURN_SENT에 대응하는 RETURN_RECEIVED 레코드 생성
-- (약간의 시간 차이를 두어 순서 보장)
INSERT INTO histories (
    virtual_code_id,
    action_type,
    from_owner_type,
    from_owner_id,
    to_owner_type,
    to_owner_id,
    shipment_batch_id,
    lot_id,
    treatment_id,
    is_recall,
    recall_reason,
    created_at
)
SELECT
    h.virtual_code_id,
    'RETURN_RECEIVED'::history_action_type,
    h.from_owner_type,
    h.from_owner_id,
    h.to_owner_type,
    h.to_owner_id,
    h.shipment_batch_id,
    h.lot_id,
    h.treatment_id,
    h.is_recall,
    h.recall_reason,
    h.created_at + INTERVAL '1 millisecond'
FROM histories h
WHERE h.action_type = 'RETURN_SENT';

-- 2. return_shipment_atomic() 함수 재작성
DROP FUNCTION IF EXISTS "public"."return_shipment_atomic"(UUID, VARCHAR, JSONB);

CREATE OR REPLACE FUNCTION "public"."return_shipment_atomic"(
    "p_shipment_batch_id" UUID,
    "p_reason" VARCHAR,
    "p_product_quantities" JSONB DEFAULT NULL
)
RETURNS TABLE(
    "success" BOOLEAN,
    "returned_count" INTEGER,
    "new_batch_id" UUID,
    "error_code" VARCHAR,
    "error_message" VARCHAR
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recipient_org_id UUID;
    v_batch RECORD;
    v_all_code_ids UUID[];
    v_owned_code_ids UUID[];
    v_selected_code_ids UUID[];
    v_sender_org_id UUID;
    v_sender_org_type organization_type;
    v_new_batch_id UUID;
    v_count INT := 0;
    v_item RECORD;
    v_product_code_ids UUID[];
    v_quantity_to_select INT;
    v_product_quantities_normalized JSONB;
BEGIN
    -- 1. 인증된 사용자의 조직 ID 가져오기
    v_recipient_org_id := get_user_organization_id();

    IF v_recipient_org_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'UNAUTHORIZED'::VARCHAR,
            '로그인이 필요합니다.'::VARCHAR;
        RETURN;
    END IF;

    -- 2. 입력값 정규화: 배열이 아니거나 빈 배열은 NULL로 처리 (전량 반품)
    IF p_product_quantities IS NOT NULL
       AND jsonb_typeof(p_product_quantities) = 'array'
       AND jsonb_array_length(p_product_quantities) > 0 THEN
        v_product_quantities_normalized := p_product_quantities;
    ELSE
        v_product_quantities_normalized := NULL;
    END IF;

    -- 3. 출고 뭉치 정보 조회 (락 획득)
    SELECT * INTO v_batch
    FROM shipment_batches
    WHERE id = p_shipment_batch_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'BATCH_NOT_FOUND'::VARCHAR,
            '출고 뭉치를 찾을 수 없습니다.'::VARCHAR;
        RETURN;
    END IF;

    -- 4. 해당 배치의 모든 가상 코드 ID 조회
    SELECT ARRAY_AGG(sd.virtual_code_id) INTO v_all_code_ids
    FROM shipment_details sd
    WHERE sd.shipment_batch_id = p_shipment_batch_id;

    IF v_all_code_ids IS NULL OR array_length(v_all_code_ids, 1) = 0 THEN
        RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'NO_DETAILS'::VARCHAR,
            '반품할 제품이 없습니다.'::VARCHAR;
        RETURN;
    END IF;

    -- 5. 현재 조직이 소유한 코드만 필터링
    SELECT ARRAY_AGG(vc.id) INTO v_owned_code_ids
    FROM virtual_codes vc
    WHERE vc.id = ANY(v_all_code_ids)
        AND vc.owner_id = v_recipient_org_id::VARCHAR
        AND vc.owner_type = 'ORGANIZATION';

    IF v_owned_code_ids IS NULL OR array_length(v_owned_code_ids, 1) = 0 THEN
        RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'CODES_NOT_OWNED'::VARCHAR,
            '반품할 제품이 없습니다. 현재 조직이 소유한 코드가 없습니다.'::VARCHAR;
        RETURN;
    END IF;

    -- 6. 반품 대상 코드 선택 (전량 or 부분)
    IF v_product_quantities_normalized IS NULL THEN
        v_selected_code_ids := v_owned_code_ids;
    ELSE
        v_selected_code_ids := ARRAY[]::UUID[];

        FOR v_item IN SELECT * FROM jsonb_to_recordset(v_product_quantities_normalized)
            AS x("productId" UUID, "quantity" INT)
        LOOP
            v_quantity_to_select := v_item."quantity";

            SELECT ARRAY_AGG(sub.id ORDER BY sub.manufacture_date, sub.created_at)
            INTO v_product_code_ids
            FROM (
                SELECT vc.id, l.manufacture_date, vc.created_at
                FROM virtual_codes vc
                JOIN lots l ON vc.lot_id = l.id
                WHERE vc.id = ANY(v_owned_code_ids)
                    AND l.product_id = v_item."productId"
                ORDER BY l.manufacture_date ASC, vc.created_at ASC
                LIMIT v_quantity_to_select
            ) sub;

            IF v_product_code_ids IS NOT NULL AND array_length(v_product_code_ids, 1) > 0 THEN
                v_selected_code_ids := v_selected_code_ids || v_product_code_ids;
            END IF;
        END LOOP;

        IF array_length(v_selected_code_ids, 1) IS NULL OR array_length(v_selected_code_ids, 1) = 0 THEN
            RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'NO_MATCHING_CODES'::VARCHAR,
                '선택한 제품/수량에 해당하는 코드가 없습니다.'::VARCHAR;
            RETURN;
        END IF;
    END IF;

    -- 7. 반품 대상(발송자) 결정
    SELECT h.from_owner_id::UUID INTO v_sender_org_id
    FROM histories h
    WHERE h.virtual_code_id = v_selected_code_ids[1]
        AND h.to_owner_id = v_recipient_org_id::VARCHAR
        AND h.action_type = 'RECEIVED'
    ORDER BY h.created_at ASC
    LIMIT 1;

    IF v_sender_org_id IS NULL THEN
        v_sender_org_id := v_batch.from_organization_id;
    END IF;

    SELECT type INTO v_sender_org_type
    FROM organizations
    WHERE id = v_sender_org_id;

    IF v_sender_org_type IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'ORGANIZATION_NOT_FOUND'::VARCHAR,
            '발송 조직 정보를 찾을 수 없습니다.'::VARCHAR;
        RETURN;
    END IF;

    -- 8. 새 반품 배치 생성
    INSERT INTO shipment_batches (
        from_organization_id,
        to_organization_id,
        to_organization_type,
        parent_batch_id,
        is_return_batch,
        is_recalled,
        recall_reason,
        recall_date
    ) VALUES (
        v_recipient_org_id,
        v_sender_org_id,
        v_sender_org_type,
        p_shipment_batch_id,
        TRUE,
        FALSE,
        NULL,
        NULL
    ) RETURNING id INTO v_new_batch_id;

    -- 9. shipment_details 생성
    INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
    SELECT v_new_batch_id, UNNEST(v_selected_code_ids);

    -- 10. 코드 소유권 이전
    UPDATE virtual_codes
    SET owner_id = v_sender_org_id::VARCHAR,
        owner_type = 'ORGANIZATION',
        updated_at = NOW()
    WHERE id = ANY(v_selected_code_ids);

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- 11. 반품 이력 기록 (RETURN_SENT - 발송자 관점)
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
        UNNEST(v_selected_code_ids),
        'RETURN_SENT'::history_action_type,
        'ORGANIZATION'::owner_type,
        v_recipient_org_id::VARCHAR,
        'ORGANIZATION'::owner_type,
        v_sender_org_id::VARCHAR,
        v_new_batch_id,
        TRUE,
        p_reason;

    -- 12. 반품 이력 기록 (RETURN_RECEIVED - 수신자 관점)
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
        UNNEST(v_selected_code_ids),
        'RETURN_RECEIVED'::history_action_type,
        'ORGANIZATION'::owner_type,
        v_recipient_org_id::VARCHAR,
        'ORGANIZATION'::owner_type,
        v_sender_org_id::VARCHAR,
        v_new_batch_id,
        TRUE,
        p_reason;

    -- 13. 전량 반품인 경우 원래 배치도 반품 완료 표시
    IF v_product_quantities_normalized IS NULL AND
       array_length(v_owned_code_ids, 1) = array_length(v_all_code_ids, 1) THEN
        UPDATE shipment_batches
        SET is_recalled = TRUE,
            recall_reason = p_reason,
            recall_date = NOW()
        WHERE id = p_shipment_batch_id
            AND is_recalled = FALSE;
    END IF;

    RETURN QUERY SELECT TRUE, v_count, v_new_batch_id, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$;

ALTER FUNCTION "public"."return_shipment_atomic"(UUID, VARCHAR, JSONB) OWNER TO postgres;

COMMENT ON FUNCTION "public"."return_shipment_atomic"(UUID, VARCHAR, JSONB) IS
    '출고 반품 (RETURN_SENT/RETURN_RECEIVED 분리 버전).
     SHIPPED/RECEIVED 패턴과 동일하게 발송자/수신자 각각에게 이력 생성.';

GRANT EXECUTE ON FUNCTION "public"."return_shipment_atomic"(UUID, VARCHAR, JSONB) TO authenticated;

-- 3. get_history_summary_cursor() WHERE 절 업데이트
DROP FUNCTION IF EXISTS public.get_history_summary_cursor(uuid, text[], timestamptz, timestamptz, boolean, integer, timestamptz, text);

CREATE OR REPLACE FUNCTION public.get_history_summary_cursor(
  p_organization_id uuid,
  p_action_types text[] DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_is_recall boolean DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_cursor_time timestamptz DEFAULT NULL,
  p_cursor_key text DEFAULT NULL
)
RETURNS TABLE(
  group_key text,
  action_type character varying,
  from_owner_type character varying,
  from_owner_id character varying,
  from_owner_name text,
  to_owner_type character varying,
  to_owner_id character varying,
  to_owner_name text,
  is_recall boolean,
  recall_reason text,
  created_at timestamptz,
  total_quantity bigint,
  product_summaries jsonb,
  shipment_batch_id uuid,
  owned_quantity bigint,
  has_more boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
SET statement_timeout TO '30s'
AS $$
DECLARE
  v_actual_limit INT := p_limit + 1;
  v_start_date TIMESTAMPTZ;
  v_org_id_str VARCHAR := p_organization_id::VARCHAR;
BEGIN
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '3 days');

  RETURN QUERY
  WITH grouped_histories AS (
    SELECT
      COALESCE(
        h.shipment_batch_id::TEXT || '_' || h.action_type::TEXT,
        h.lot_id::TEXT || '_' || h.action_type::TEXT,
        h.treatment_id::TEXT || '_' || h.action_type::TEXT,
        DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
        h.action_type::TEXT || '_' ||
        COALESCE(h.from_owner_id, '') || '_' ||
        COALESCE(h.to_owner_id, '')
      ) AS grp_key,
      h.action_type AS act_type,
      h.from_owner_type AS from_type,
      h.from_owner_id AS from_id,
      h.to_owner_type AS to_type,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      MAX(h.recall_reason) AS recall_desc,
      MAX(h.created_at) AS latest_at,
      (ARRAY_AGG(h.shipment_batch_id))[1] AS batch_id,
      COUNT(*) AS qty,
      SUM(CASE
        WHEN vc.owner_id = v_org_id_str
             AND vc.owner_type = 'ORGANIZATION'
        THEN 1 ELSE 0
      END) AS owned_qty,
      p.id AS prod_id,
      p.name AS prod_name,
      p.model_name AS prod_model,
      (ARRAY_AGG(vc.code ORDER BY h.created_at DESC))[1:10] AS code_ids
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE
      (
        -- SHIPPED: 발송자 관점 이벤트 (본인이 from_owner일 때만)
        (h.action_type = 'SHIPPED' AND h.from_owner_id = v_org_id_str)
        OR
        -- RECEIVED: 수신자 관점 이벤트 (본인이 to_owner일 때만)
        (h.action_type = 'RECEIVED' AND h.to_owner_id = v_org_id_str)
        OR
        -- RETURN_SENT: 반품 발송자 관점 (본인이 from_owner일 때만)
        (h.action_type = 'RETURN_SENT' AND h.from_owner_id = v_org_id_str)
        OR
        -- RETURN_RECEIVED: 반품 수신자 관점 (본인이 to_owner일 때만)
        (h.action_type = 'RETURN_RECEIVED' AND h.to_owner_id = v_org_id_str)
        OR
        -- PRODUCED: 생산자 관점 이벤트 (본인이 from_owner일 때만)
        (h.action_type = 'PRODUCED' AND h.from_owner_id = v_org_id_str)
        OR
        -- TREATED: 시술자 관점 이벤트 (본인이 from_owner일 때만)
        (h.action_type = 'TREATED' AND h.from_owner_id = v_org_id_str)
        OR
        -- RECALLED: 회수 이벤트 (발송자/수신자 모두 볼 수 있음)
        (h.action_type = 'RECALLED' AND (h.from_owner_id = v_org_id_str OR h.to_owner_id = v_org_id_str))
        OR
        -- DISPOSED: 폐기자 관점 이벤트 (본인이 from_owner일 때만)
        (h.action_type = 'DISPOSED' AND h.from_owner_id = v_org_id_str)
        OR
        -- RETURNED (레거시 호환): 기존 RETURNED는 from_owner만 조회
        (h.action_type = 'RETURNED' AND h.from_owner_id = v_org_id_str)
      )
      AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
      AND h.created_at >= v_start_date
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_is_recall IS NULL OR h.is_recall = p_is_recall)
    GROUP BY
      COALESCE(
        h.shipment_batch_id::TEXT || '_' || h.action_type::TEXT,
        h.lot_id::TEXT || '_' || h.action_type::TEXT,
        h.treatment_id::TEXT || '_' || h.action_type::TEXT,
        DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
        h.action_type::TEXT || '_' ||
        COALESCE(h.from_owner_id, '') || '_' ||
        COALESCE(h.to_owner_id, '')
      ),
      h.action_type,
      h.from_owner_type,
      h.from_owner_id,
      h.to_owner_type,
      h.to_owner_id,
      h.is_recall,
      p.id,
      p.name,
      p.model_name
  ),
  aggregated AS (
    SELECT
      gh.grp_key,
      gh.act_type,
      gh.from_type,
      gh.from_id,
      gh.to_type,
      gh.to_id,
      gh.recall_flag,
      gh.recall_desc,
      MAX(gh.latest_at) AS latest_at,
      (ARRAY_AGG(gh.batch_id))[1] AS batch_id,
      SUM(gh.qty) AS total_qty,
      SUM(gh.owned_qty) AS total_owned_qty,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'productId', gh.prod_id,
          'productName', gh.prod_name,
          'modelName', gh.prod_model,
          'quantity', gh.qty,
          'ownedQuantity', gh.owned_qty,
          'codes', gh.code_ids
        )
      ) AS prod_summaries
    FROM grouped_histories gh
    GROUP BY
      gh.grp_key,
      gh.act_type,
      gh.from_type,
      gh.from_id,
      gh.to_type,
      gh.to_id,
      gh.recall_flag,
      gh.recall_desc
  ),
  cursor_filtered AS (
    SELECT *
    FROM aggregated a
    WHERE (
      p_cursor_time IS NULL
      OR (a.latest_at < p_cursor_time)
      OR (a.latest_at = p_cursor_time AND a.grp_key < p_cursor_key)
    )
  ),
  limited AS (
    SELECT
      cf.*,
      ROW_NUMBER() OVER (ORDER BY cf.latest_at DESC, cf.grp_key DESC) AS rn,
      COUNT(*) OVER () AS total_fetched
    FROM cursor_filtered cf
    LIMIT v_actual_limit
  )
  SELECT
    l.grp_key,
    l.act_type::VARCHAR,
    l.from_type::VARCHAR,
    l.from_id,
    CASE
      WHEN l.from_type = 'ORGANIZATION' THEN (
        SELECT o.name::TEXT FROM organizations o WHERE o.id::VARCHAR = l.from_id LIMIT 1
      )
      ELSE NULL
    END AS from_name,
    l.to_type::VARCHAR,
    l.to_id,
    CASE
      WHEN l.to_type = 'ORGANIZATION' THEN (
        SELECT o.name::TEXT FROM organizations o WHERE o.id::VARCHAR = l.to_id LIMIT 1
      )
      ELSE NULL
    END AS to_name,
    l.recall_flag,
    l.recall_desc,
    l.latest_at,
    l.total_qty::BIGINT,
    l.prod_summaries,
    l.batch_id,
    l.total_owned_qty::BIGINT,
    (l.total_fetched > p_limit) AS has_more
  FROM limited l
  WHERE l.rn <= p_limit
  ORDER BY l.latest_at DESC, l.grp_key DESC;
END;
$$;

ALTER FUNCTION public.get_history_summary_cursor(uuid, text[], timestamptz, timestamptz, boolean, integer, timestamptz, text) OWNER TO postgres;

COMMENT ON FUNCTION public.get_history_summary_cursor(uuid, text[], timestamptz, timestamptz, boolean, integer, timestamptz, text) IS
  '조직의 이력 요약을 커서 기반 페이지네이션으로 조회.
   v6: RETURN_SENT/RETURN_RECEIVED 분리 지원.
   - RETURN_SENT: 반품 발송자(from_owner)만 조회
   - RETURN_RECEIVED: 반품 수신자(to_owner)만 조회
   - RETURNED (레거시): 기존 데이터 호환성 유지';

GRANT EXECUTE ON FUNCTION public.get_history_summary_cursor(uuid, text[], timestamptz, timestamptz, boolean, integer, timestamptz, text) TO authenticated;
