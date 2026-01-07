-- =============================================================================
-- get_history_summary_cursor WHERE 절 방향성 필터 추가
--
-- 문제:
-- WHERE (from_owner_id = org OR to_owner_id = org) 조건으로 인해
-- 수신자(유통사)가 발송자(제조사)의 SHIPPED 이벤트까지 조회됨
-- 결과: 동일 배치에 대해 SHIPPED와 RECEIVED가 모두 표시되어 중복처럼 보임
--
-- 해결:
-- action_type별 방향성 필터 적용
-- - SHIPPED/RETURNED: 발송자(from_owner)만 조회
-- - RECEIVED: 수신자(to_owner)만 조회
-- - PRODUCED/TREATED: 수행자(from_owner)만 조회
-- - RECALLED: 발송자/수신자 모두 조회 (양방향 알림 필요)
-- =============================================================================

-- 반환 타입이 동일하므로 DROP 후 재생성
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
      -- grp_key에 action_type 포함하여 완전한 분리 보장
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
      -- 현재 조직이 소유한 코드 수 계산
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
      -- 수정: action_type별 방향성 필터 적용
      (
        -- SHIPPED: 발송자 관점 이벤트 (본인이 from_owner일 때만)
        (h.action_type = 'SHIPPED' AND h.from_owner_id = v_org_id_str)
        OR
        -- RECEIVED: 수신자 관점 이벤트 (본인이 to_owner일 때만)
        (h.action_type = 'RECEIVED' AND h.to_owner_id = v_org_id_str)
        OR
        -- RETURNED: 반품 발송자 관점 이벤트 (본인이 from_owner일 때만)
        (h.action_type = 'RETURNED' AND h.from_owner_id = v_org_id_str)
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

-- 함수 소유자 설정
ALTER FUNCTION public.get_history_summary_cursor(uuid, text[], timestamptz, timestamptz, boolean, integer, timestamptz, text) OWNER TO postgres;

-- 함수 설명
COMMENT ON FUNCTION public.get_history_summary_cursor(uuid, text[], timestamptz, timestamptz, boolean, integer, timestamptz, text) IS
  '조직의 이력 요약을 커서 기반 페이지네이션으로 조회.
   v5: action_type별 방향성 필터 추가 - 중복 이벤트 문제 해결.
   - SHIPPED/RETURNED/PRODUCED/TREATED/DISPOSED: from_owner만 조회
   - RECEIVED: to_owner만 조회
   - RECALLED: 양방향 조회';

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.get_history_summary_cursor(uuid, text[], timestamptz, timestamptz, boolean, integer, timestamptz, text) TO authenticated;
