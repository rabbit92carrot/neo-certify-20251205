-- 레거시 OFFSET 기반 함수들을 SSOT 기반으로 업데이트
--
-- 업데이트 대상:
-- 1. get_admin_event_summary - CSV 내보내기에서 사용됨
-- 2. get_history_summary - getTransactionHistory에서 사용됨 (레거시 호환용)
--
-- 삭제 대상 (미사용 확인됨):
-- - get_history_summary_count (커서 방식에서는 사용하지 않음)

-- ============================================================================
-- 1. get_admin_event_summary (OFFSET 기반) SSOT 업데이트
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_admin_event_summary(
  timestamptz, timestamptz, text[], uuid, text, uuid, boolean, integer, integer
);

CREATE OR REPLACE FUNCTION public.get_admin_event_summary(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_action_types text[] DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_lot_number text DEFAULT NULL,
  p_product_id uuid DEFAULT NULL,
  p_include_recalled boolean DEFAULT TRUE,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  group_key text,
  event_time timestamptz,
  action_type varchar,
  from_owner_type varchar,
  from_owner_id varchar,
  to_owner_type varchar,
  to_owner_id varchar,
  is_recall boolean,
  recall_reason text,
  total_quantity bigint,
  lot_summaries jsonb,
  sample_code_ids uuid[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout TO '60s'
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
          fh.act_type || '_' ||
          COALESCE(fh.from_id, '') || '_' ||
          COALESCE(fh.to_id, '')
      ),
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
      g.act_type,
      g.from_id,
      g.to_id,
      g.recall_flag
  )
  SELECT
    a.grp_key,
    a.event_time,
    a.act_type::VARCHAR,
    a.from_type::VARCHAR,
    a.from_id,
    a.to_type::VARCHAR,
    a.to_id,
    a.recall_flag,
    a.recall_desc,
    a.total_qty,
    a.lot_summaries,
    a.sample_codes
  FROM aggregated a
  ORDER BY a.event_time DESC, a.grp_key DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- 2. get_history_summary (OFFSET 기반) SSOT 업데이트
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
      CASE
        WHEN a.from_type = 'ORGANIZATION' THEN (
          SELECT o.name FROM organizations o WHERE o.id = a.from_id::UUID
        )
        ELSE NULL
      END AS from_org_name,
      CASE
        WHEN a.to_type = 'ORGANIZATION' THEN (
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

-- ============================================================================
-- 3. get_history_summary_count 업데이트 (SSOT 기반)
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_history_summary_count(
  uuid, text[], timestamptz, timestamptz, boolean
);

CREATE OR REPLACE FUNCTION public.get_history_summary_count(
  p_organization_id uuid,
  p_action_types text[] DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_is_recall boolean DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout TO '30s'
AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
  v_count BIGINT;
BEGIN
  -- 기본 날짜 범위: 최근 7일
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '7 days');

  WITH filtered_histories AS (
    SELECT
      h.id,
      h.action_type AS act_type,
      h.from_owner_id AS from_id,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      h.created_at,
      -- 배치 ID들 (SSOT 기반 그룹핑용)
      h.shipment_batch_id,
      h.lot_id AS history_lot_id,
      h.treatment_id
    FROM histories h
    WHERE
      h.created_at >= v_start_date
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
      AND (h.from_owner_id = p_organization_id::VARCHAR OR h.to_owner_id = p_organization_id::VARCHAR)
      AND (p_is_recall IS NULL OR h.is_recall = p_is_recall)
  ),
  grouped AS (
    SELECT
      -- SSOT 기반 그룹 키
      COALESCE(
        fh.shipment_batch_id::TEXT,
        fh.history_lot_id::TEXT,
        fh.treatment_id::TEXT,
        DATE_TRUNC('minute', fh.created_at)::TEXT || '_' ||
          fh.act_type || '_' ||
          COALESCE(fh.from_id, '') || '_' ||
          COALESCE(fh.to_id, '')
      ) AS grp_key
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
      fh.act_type,
      fh.from_id,
      fh.to_id,
      fh.recall_flag
  )
  SELECT COUNT(DISTINCT grp_key)::BIGINT INTO v_count FROM grouped;

  RETURN v_count;
END;
$$;

-- ============================================================================
-- 4. get_admin_event_summary_count 업데이트 (SSOT 기반)
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_admin_event_summary_count(
  timestamptz, timestamptz, text[], uuid, text, uuid, boolean
);

CREATE OR REPLACE FUNCTION public.get_admin_event_summary_count(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_action_types text[] DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_lot_number text DEFAULT NULL,
  p_product_id uuid DEFAULT NULL,
  p_include_recalled boolean DEFAULT TRUE
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout TO '30s'
AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
  v_count BIGINT;
BEGIN
  -- 기본 날짜 범위: 최근 7일
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '7 days');

  WITH filtered_histories AS (
    SELECT
      h.id,
      h.action_type AS act_type,
      h.from_owner_id AS from_id,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      h.created_at,
      -- 배치 ID들 (SSOT 기반 그룹핑용)
      h.shipment_batch_id,
      h.lot_id AS history_lot_id,
      h.treatment_id
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
      -- SSOT 기반 그룹 키
      COALESCE(
        fh.shipment_batch_id::TEXT,
        fh.history_lot_id::TEXT,
        fh.treatment_id::TEXT,
        DATE_TRUNC('minute', fh.created_at)::TEXT || '_' ||
          fh.act_type || '_' ||
          COALESCE(fh.from_id, '') || '_' ||
          COALESCE(fh.to_id, '')
      ) AS grp_key
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
      fh.act_type,
      fh.from_id,
      fh.to_id,
      fh.recall_flag
  )
  SELECT COUNT(DISTINCT grp_key)::BIGINT INTO v_count FROM grouped;

  RETURN v_count;
END;
$$;
