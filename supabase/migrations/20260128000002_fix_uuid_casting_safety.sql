-- Fix: UUID 캐스팅 안전성 개선
--
-- 문제: histories 테이블의 from_owner_id / to_owner_id는 VARCHAR로,
--       조직 UUID와 환자 전화번호가 혼용 저장됨.
--       일부 RPC 함수에서 이 값을 ::UUID로 직접 캐스팅하여,
--       전화번호가 포함된 행이 있으면 에러 발생.
--
-- 해결: CASE 표현식으로 감싸서 regex 검증 후에만 ::UUID 캐스팅 실행.
--       PostgreSQL의 CASE WHEN은 단축 평가가 보장됨.

-- ============================================================================
-- 1. get_history_summary (OFFSET 기반) — CASE에 regex 검증 추가
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_history_summary(
  uuid, text[], timestamptz, timestamptz, boolean, integer, integer
);

CREATE OR REPLACE FUNCTION public.get_history_summary(
  p_organization_id uuid,
  p_action_types text[] DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_is_recall boolean DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  group_key text,
  action_type varchar,
  event_time timestamptz,
  from_owner_type varchar,
  from_owner_id varchar,
  from_owner_name text,
  to_owner_type varchar,
  to_owner_id varchar,
  to_owner_name text,
  is_recall boolean,
  recall_reason text,
  total_quantity bigint,
  product_summaries jsonb,
  shipment_batch_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout TO '30s'
AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- 기본 날짜 범위: 최근 7일
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '7 days');

  RETURN QUERY
  WITH filtered_histories AS (
    SELECT
      h.id AS history_id,
      h.virtual_code_id,
      h.action_type AS act_type,
      h.from_owner_type AS from_type,
      h.from_owner_id AS from_id,
      h.to_owner_type AS to_type,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      h.recall_reason AS recall_desc,
      h.created_at,
      -- 배치 ID들 (SSOT 기반 그룹핑용)
      h.shipment_batch_id,
      h.lot_id AS history_lot_id,
      h.treatment_id,
      -- 로트/제품 정보
      p.id AS product_id,
      p.name AS product_name,
      p.model_name
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE
      h.created_at >= v_start_date
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
      AND (h.from_owner_id = p_organization_id::VARCHAR OR h.to_owner_id = p_organization_id::VARCHAR)
      AND (p_is_recall IS NULL OR h.is_recall = p_is_recall)
  ),
  grouped AS (
    SELECT
      -- SSOT 기반 그룹 키: 배치 ID 우선, 없으면 분 단위 fallback
      COALESCE(
        fh.shipment_batch_id::TEXT,
        fh.history_lot_id::TEXT,
        fh.treatment_id::TEXT,
        DATE_TRUNC('minute', fh.created_at)::TEXT || '_' ||
          fh.act_type || '_' ||
          COALESCE(fh.from_id, '') || '_' ||
          COALESCE(fh.to_id, '')
      ) AS grp_key,
      -- 통합 배치 ID (회수 기능용)
      fh.shipment_batch_id AS batch_id,
      MAX(fh.created_at) AS latest_time,
      fh.act_type,
      fh.from_type,
      fh.from_id,
      fh.to_type,
      fh.to_id,
      fh.recall_flag,
      MAX(fh.recall_desc) AS recall_desc,
      fh.product_id,
      fh.product_name,
      fh.model_name,
      COUNT(*) AS qty,
      (ARRAY_AGG(fh.virtual_code_id ORDER BY fh.created_at DESC)) AS code_ids
    FROM filtered_histories fh
    GROUP BY
      COALESCE(
        fh.shipment_batch_id::TEXT,
        fh.history_lot_id::TEXT,
        fh.treatment_id::TEXT,
        DATE_TRUNC('minute', fh.created_at)::TEXT || '_' ||
          fh.act_type || '_' ||
          COALESCE(fh.from_id, '') || '_' ||
          COALESCE(fh.to_id, '')
      ),
      fh.shipment_batch_id,
      fh.act_type,
      fh.from_type,
      fh.from_id,
      fh.to_type,
      fh.to_id,
      fh.recall_flag,
      fh.product_id,
      fh.product_name,
      fh.model_name
  ),
  aggregated AS (
    SELECT
      g.grp_key,
      g.batch_id,
      MAX(g.latest_time) AS event_time,
      g.act_type,
      MAX(g.from_type) AS from_type,
      g.from_id,
      MAX(g.to_type) AS to_type,
      g.to_id,
      g.recall_flag,
      MAX(g.recall_desc) AS recall_desc,
      SUM(g.qty)::BIGINT AS total_qty,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'productId', g.product_id,
          'productName', g.product_name,
          'modelName', g.model_name,
          'quantity', g.qty,
          'codes', g.code_ids
        )
      ) AS prod_summaries
    FROM grouped g
    GROUP BY
      g.grp_key,
      g.batch_id,
      g.act_type,
      g.from_id,
      g.to_id,
      g.recall_flag
  ),
  with_org_names AS (
    SELECT
      a.*,
      -- FIX: CASE 내부에 regex 검증 추가하여 비-UUID 값(전화번호 등)에서 캐스팅 에러 방지
      CASE
        WHEN a.from_type = 'ORGANIZATION'
          AND a.from_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN (
          SELECT o.name FROM organizations o WHERE o.id = a.from_id::UUID
        )
        ELSE NULL
      END AS from_org_name,
      CASE
        WHEN a.to_type = 'ORGANIZATION'
          AND a.to_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN (
          SELECT o.name FROM organizations o WHERE o.id = a.to_id::UUID
        )
        ELSE NULL
      END AS to_org_name
    FROM aggregated a
  )
  SELECT
    w.grp_key,
    w.act_type::VARCHAR,
    w.event_time,
    w.from_type::VARCHAR,
    w.from_id,
    w.from_org_name,
    w.to_type::VARCHAR,
    w.to_id,
    w.to_org_name,
    w.recall_flag,
    w.recall_desc,
    w.total_qty,
    w.prod_summaries,
    w.batch_id
  FROM with_org_names w
  ORDER BY w.event_time DESC, w.grp_key DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.get_history_summary IS
  '거래 이력 요약 (OFFSET 기반). UUID 캐스팅 안전성 개선 - 비-UUID 값 방어';

-- ============================================================================
-- 2. get_admin_event_summary_cursor — LEFT JOIN의 ::UUID 캐스팅을 CASE로 보호
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_admin_event_summary_cursor;

CREATE OR REPLACE FUNCTION public.get_admin_event_summary_cursor(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_action_types text[] DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_lot_number text DEFAULT NULL,
  p_product_id uuid DEFAULT NULL,
  p_include_recalled boolean DEFAULT TRUE,
  p_limit integer DEFAULT 50,
  p_cursor_time timestamptz DEFAULT NULL,
  p_cursor_key text DEFAULT NULL
)
RETURNS TABLE(
  group_key text,
  event_time timestamptz,
  action_type varchar,
  from_owner_type varchar,
  from_owner_id varchar,
  from_owner_name text,
  to_owner_type varchar,
  to_owner_id varchar,
  to_owner_name text,
  is_recall boolean,
  recall_reason text,
  total_quantity bigint,
  lot_summaries jsonb,
  sample_code_ids uuid[],
  batch_id uuid,
  has_more boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout TO '30s'
AS $$
DECLARE
  v_actual_limit INT := p_limit + 1;
  v_start_date TIMESTAMPTZ;
BEGIN
  -- 기본 날짜 범위: 최근 3일
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '3 days');

  RETURN QUERY
  WITH filtered_histories AS (
    SELECT
      h.id AS history_id,
      h.virtual_code_id,
      h.action_type AS act_type,
      h.from_owner_type AS from_type,
      h.from_owner_id AS from_id,
      h.to_owner_type AS to_type,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      h.recall_reason AS recall_desc,
      h.created_at,
      -- 배치 ID들 (SSOT 기반 그룹핑용)
      h.shipment_batch_id,
      h.lot_id AS history_lot_id,
      h.treatment_id,
      -- 로트/제품 정보
      l.id AS lot_id,
      l.lot_number,
      p.id AS product_id,
      p.name AS product_name,
      p.model_name
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE
      h.created_at >= v_start_date
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
      AND (p_organization_id IS NULL OR
           h.from_owner_id = p_organization_id::VARCHAR OR
           h.to_owner_id = p_organization_id::VARCHAR)
      AND (p_lot_number IS NULL OR l.lot_number ILIKE '%' || p_lot_number || '%')
      AND (p_product_id IS NULL OR p.id = p_product_id)
      AND (p_include_recalled OR h.is_recall = FALSE)
  ),
  grouped AS (
    SELECT
      COALESCE(
        fh.shipment_batch_id::TEXT,
        fh.history_lot_id::TEXT,
        fh.treatment_id::TEXT,
        DATE_TRUNC('minute', fh.created_at)::TEXT || '_' ||
          COALESCE(fh.from_id, '') || '_' ||
          COALESCE(fh.to_id, '')
      ) || '_' || fh.act_type AS grp_key,
      COALESCE(fh.shipment_batch_id, fh.history_lot_id, fh.treatment_id) AS batch_id,
      MAX(fh.created_at) AS latest_time,
      fh.act_type,
      fh.from_type,
      fh.from_id,
      fh.to_type,
      fh.to_id,
      fh.recall_flag,
      MAX(fh.recall_desc) AS recall_desc,
      fh.lot_id,
      fh.lot_number,
      fh.product_id,
      fh.product_name,
      fh.model_name,
      COUNT(*) AS qty,
      (ARRAY_AGG(fh.virtual_code_id ORDER BY fh.created_at DESC))[1:10] AS lot_code_ids
    FROM filtered_histories fh
    GROUP BY
      COALESCE(
        fh.shipment_batch_id::TEXT,
        fh.history_lot_id::TEXT,
        fh.treatment_id::TEXT,
        DATE_TRUNC('minute', fh.created_at)::TEXT || '_' ||
          COALESCE(fh.from_id, '') || '_' ||
          COALESCE(fh.to_id, '')
      ) || '_' || fh.act_type,
      COALESCE(fh.shipment_batch_id, fh.history_lot_id, fh.treatment_id),
      fh.act_type,
      fh.from_type,
      fh.from_id,
      fh.to_type,
      fh.to_id,
      fh.recall_flag,
      fh.lot_id,
      fh.lot_number,
      fh.product_id,
      fh.product_name,
      fh.model_name
  ),
  aggregated AS (
    SELECT
      g.grp_key,
      g.batch_id,
      MAX(g.latest_time) AS event_time,
      g.act_type,
      MAX(g.from_type) AS from_type,
      g.from_id,
      MAX(g.to_type) AS to_type,
      g.to_id,
      g.recall_flag,
      MAX(g.recall_desc) AS recall_desc,
      SUM(g.qty)::BIGINT AS total_qty,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'lotId', g.lot_id,
          'lotNumber', g.lot_number,
          'productId', g.product_id,
          'productName', g.product_name,
          'modelName', g.model_name,
          'quantity', g.qty,
          'codeIds', g.lot_code_ids
        )
      ) AS lot_summaries,
      (ARRAY_AGG(g.lot_code_ids[1]))[1:10] AS sample_codes
    FROM grouped g
    GROUP BY
      g.grp_key,
      g.batch_id,
      g.act_type,
      g.from_id,
      g.to_id,
      g.recall_flag
  ),
  cursor_filtered AS (
    SELECT *
    FROM aggregated a
    WHERE (
      p_cursor_time IS NULL
      OR (a.event_time < p_cursor_time)
      OR (a.event_time = p_cursor_time AND a.grp_key < p_cursor_key)
    )
  ),
  limited AS (
    SELECT
      cf.*,
      ROW_NUMBER() OVER (ORDER BY cf.event_time DESC, cf.grp_key DESC) AS rn,
      COUNT(*) OVER () AS total_fetched
    FROM cursor_filtered cf
    LIMIT v_actual_limit
  )
  -- 최종 SELECT에서 조직명 JOIN
  SELECT
    l.grp_key,
    l.event_time,
    l.act_type::VARCHAR,
    l.from_type::VARCHAR,
    l.from_id,
    -- from_owner_name: ORGANIZATION인 경우만 조직명 조회
    CASE
      WHEN l.from_type = 'ORGANIZATION' THEN from_org.name
      ELSE NULL
    END::TEXT AS from_owner_name,
    l.to_type::VARCHAR,
    l.to_id,
    -- to_owner_name: ORGANIZATION인 경우만 조직명 조회
    CASE
      WHEN l.to_type = 'ORGANIZATION' THEN to_org.name
      ELSE NULL
    END::TEXT AS to_owner_name,
    l.recall_flag,
    l.recall_desc,
    l.total_qty,
    l.lot_summaries,
    l.sample_codes,
    l.batch_id,
    (l.total_fetched > p_limit) AS has_more
  FROM limited l
  -- FIX: LEFT JOIN의 ::UUID 캐스팅을 CASE로 감싸서 비-UUID 값 방어
  -- PostgreSQL의 JOIN ON 절은 AND 조건의 단축 평가를 보장하지 않으므로,
  -- CASE 표현식으로 regex 검증 후에만 캐스팅 실행
  LEFT JOIN organizations from_org
    ON l.from_type = 'ORGANIZATION'
    AND from_org.id = CASE
      WHEN l.from_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN l.from_id::UUID
      ELSE NULL
    END
  LEFT JOIN organizations to_org
    ON l.to_type = 'ORGANIZATION'
    AND to_org.id = CASE
      WHEN l.to_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN l.to_id::UUID
      ELSE NULL
    END
  WHERE l.rn <= p_limit
  ORDER BY l.event_time DESC, l.grp_key DESC;
END;
$$;

COMMENT ON FUNCTION public.get_admin_event_summary_cursor IS
  'Admin 이벤트 요약 커서 조회. UUID 캐스팅 안전성 개선 - CASE로 비-UUID 값 방어';
