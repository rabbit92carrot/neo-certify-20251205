-- =============================================================================
-- get_history_summary_cursor에 owned_quantity 추가
--
-- 목적:
-- 이력 조회 시점에 각 제품별 현재 보유 수량을 함께 반환하여
-- UI에서 반품 버튼 표시 여부를 결정할 수 있도록 함
--
-- 변경 내용:
-- 1. product_summaries JSON에 ownedQuantity 필드 추가
-- 2. grouped_histories CTE에 소유 코드 수 계산 추가
-- 3. 총 owned_quantity 컬럼 추가 (반품 버튼 표시용)
--
-- 예상 성능 영향: ~15-25% (100ms → 115-125ms)
-- =============================================================================

-- 반환 타입이 변경되었으므로 기존 함수를 먼저 삭제
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
  owned_quantity bigint,  -- 추가: 총 보유 수량
  has_more boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET statement_timeout TO '30s'
AS $$
DECLARE
  v_actual_limit INT := p_limit + 1;
  v_start_date TIMESTAMPTZ;
BEGIN
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '3 days');

  RETURN QUERY
  WITH grouped_histories AS (
    SELECT
      -- SSOT 기반 그룹 키: 배치 ID 우선, fallback으로 분 단위 그룹핑
      COALESCE(
        h.shipment_batch_id::TEXT,
        h.lot_id::TEXT,
        h.treatment_id::TEXT,
        -- fallback: 기존 분 단위 그룹핑 (DISPOSED 등 배치 ID가 없는 경우)
        DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
        h.action_type || '_' ||
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
      -- 회수 기능용: shipment_batch_id 반환
      MAX(h.shipment_batch_id) AS batch_id,
      COUNT(*) AS qty,
      -- 추가: 현재 조직이 소유한 코드 수 계산
      SUM(CASE
        WHEN vc.owner_id = p_organization_id::VARCHAR
             AND vc.owner_type = 'ORGANIZATION'
        THEN 1 ELSE 0
      END) AS owned_qty,
      p.id AS prod_id,
      p.name AS prod_name,
      p.model_name AS prod_model,
      -- 코드 목록 (최대 10개)
      (ARRAY_AGG(vc.code ORDER BY h.created_at DESC))[1:10] AS code_ids
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE (h.from_owner_id = p_organization_id::VARCHAR OR h.to_owner_id = p_organization_id::VARCHAR)
      AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
      AND h.created_at >= v_start_date
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_is_recall IS NULL OR h.is_recall = p_is_recall)
    GROUP BY
      COALESCE(
        h.shipment_batch_id::TEXT,
        h.lot_id::TEXT,
        h.treatment_id::TEXT,
        DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
        h.action_type || '_' ||
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
      MAX(gh.batch_id) AS batch_id,
      SUM(gh.qty) AS total_qty,
      -- 추가: 총 보유 수량 합계
      SUM(gh.owned_qty) AS total_owned_qty,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'productId', gh.prod_id,
          'productName', gh.prod_name,
          'modelName', gh.prod_model,
          'quantity', gh.qty,
          'ownedQuantity', gh.owned_qty,  -- 추가: 제품별 보유 수량
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
    l.total_owned_qty::BIGINT,  -- 추가: 총 보유 수량
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
   v2: owned_quantity 추가 - 각 제품별 현재 보유 수량 반환.
   반품 버튼 표시 여부 결정에 사용.';

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.get_history_summary_cursor(uuid, text[], timestamptz, timestamptz, boolean, integer, timestamptz, text) TO authenticated;
