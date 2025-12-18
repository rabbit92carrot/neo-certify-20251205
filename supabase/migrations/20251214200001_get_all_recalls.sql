-- Admin 회수 이력 통합 조회 함수 (Phase 17)
-- 출고 회수 + 시술 회수를 DB에서 통합 조회, 정렬, 페이지네이션

-- 회수 이력 통합 조회 함수
CREATE OR REPLACE FUNCTION get_all_recalls(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_type TEXT DEFAULT 'all',  -- 'all', 'shipment', 'treatment'
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  recall_id UUID,
  recall_type TEXT,
  recall_date TIMESTAMPTZ,
  recall_reason TEXT,
  quantity BIGINT,
  from_org_id UUID,
  from_org_name TEXT,
  from_org_type TEXT,
  to_id TEXT,
  to_name TEXT,
  to_type TEXT,
  product_summary JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH shipment_recalls AS (
    -- 출고 회수
    SELECT
      sb.id AS recall_id,
      'shipment'::TEXT AS recall_type,
      sb.recall_date AS recall_date,
      sb.recall_reason AS recall_reason,
      (
        SELECT COUNT(*)::BIGINT
        FROM shipment_details sd
        WHERE sd.shipment_batch_id = sb.id
      ) AS quantity,
      from_org.id AS from_org_id,
      from_org.name AS from_org_name,
      from_org.type::TEXT AS from_org_type,
      to_org.id::TEXT AS to_id,
      to_org.name AS to_name,
      to_org.type::TEXT AS to_type,
      (
        SELECT jsonb_agg(jsonb_build_object('productName', product_name, 'quantity', cnt))
        FROM (
          SELECT p.name AS product_name, COUNT(*) AS cnt
          FROM shipment_details sd
          JOIN virtual_codes vc ON vc.id = sd.virtual_code_id
          JOIN lots l ON l.id = vc.lot_id
          JOIN products p ON p.id = l.product_id
          WHERE sd.shipment_batch_id = sb.id
          GROUP BY p.name
        ) product_counts
      ) AS product_summary
    FROM shipment_batches sb
    JOIN organizations from_org ON from_org.id = sb.from_organization_id
    LEFT JOIN organizations to_org ON to_org.id = sb.to_organization_id
    WHERE sb.is_recalled = TRUE
      AND (p_start_date IS NULL OR sb.recall_date >= p_start_date)
      AND (p_end_date IS NULL OR sb.recall_date <= p_end_date)
      AND (p_type = 'all' OR p_type = 'shipment')
  ),
  treatment_recalls_grouped AS (
    -- 시술 회수: 같은 시간대(분단위)에 발생한 것을 그룹화
    SELECT
      MIN(h.id) AS recall_id,
      'treatment'::TEXT AS recall_type,
      DATE_TRUNC('minute', h.created_at) AS recall_date,
      MIN(h.recall_reason) AS recall_reason,
      COUNT(*)::BIGINT AS quantity,
      o.id AS from_org_id,
      o.name AS from_org_name,
      o.type::TEXT AS from_org_type,
      h.from_owner_id AS to_id,
      -- 전화번호 마스킹: 010-****-1234 형태
      CASE
        WHEN LENGTH(h.from_owner_id) >= 7 THEN
          SUBSTRING(h.from_owner_id FROM 1 FOR 3) || '-****-' ||
          SUBSTRING(h.from_owner_id FROM LENGTH(h.from_owner_id) - 3 FOR 4)
        ELSE h.from_owner_id
      END AS to_name,
      'PATIENT'::TEXT AS to_type,
      (
        SELECT jsonb_agg(jsonb_build_object('productName', product_name, 'quantity', cnt))
        FROM (
          SELECT p.name AS product_name, COUNT(*) AS cnt
          FROM histories h2
          JOIN virtual_codes vc ON vc.id = h2.virtual_code_id
          JOIN lots l ON l.id = vc.lot_id
          JOIN products p ON p.id = l.product_id
          WHERE h2.action_type = 'RECALLED'
            AND h2.from_owner_type = 'PATIENT'
            AND h2.to_owner_id = h.to_owner_id
            AND h2.from_owner_id = h.from_owner_id
            AND DATE_TRUNC('minute', h2.created_at) = DATE_TRUNC('minute', h.created_at)
          GROUP BY p.name
        ) product_counts
      ) AS product_summary
    FROM histories h
    JOIN organizations o ON o.id::TEXT = h.to_owner_id
    WHERE h.action_type = 'RECALLED'
      AND h.from_owner_type = 'PATIENT'
      AND (p_start_date IS NULL OR h.created_at >= p_start_date)
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_type = 'all' OR p_type = 'treatment')
    GROUP BY DATE_TRUNC('minute', h.created_at), o.id, o.name, o.type, h.to_owner_id, h.from_owner_id
  ),
  all_recalls AS (
    SELECT * FROM shipment_recalls
    UNION ALL
    SELECT * FROM treatment_recalls_grouped
  )
  SELECT
    ar.recall_id,
    ar.recall_type,
    ar.recall_date,
    ar.recall_reason,
    ar.quantity,
    ar.from_org_id,
    ar.from_org_name,
    ar.from_org_type,
    ar.to_id,
    ar.to_name,
    ar.to_type,
    ar.product_summary
  FROM all_recalls ar
  ORDER BY ar.recall_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 회수 이력 총 개수 조회 함수
CREATE OR REPLACE FUNCTION get_all_recalls_count(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_type TEXT DEFAULT 'all'
)
RETURNS BIGINT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_count BIGINT := 0;
BEGIN
  -- 출고 회수 개수
  IF p_type = 'all' OR p_type = 'shipment' THEN
    SELECT v_count + COUNT(*)
    INTO v_count
    FROM shipment_batches sb
    WHERE sb.is_recalled = TRUE
      AND (p_start_date IS NULL OR sb.recall_date >= p_start_date)
      AND (p_end_date IS NULL OR sb.recall_date <= p_end_date);
  END IF;

  -- 시술 회수 개수 (그룹화된 개수)
  IF p_type = 'all' OR p_type = 'treatment' THEN
    SELECT v_count + COUNT(*)
    INTO v_count
    FROM (
      SELECT 1
      FROM histories h
      WHERE h.action_type = 'RECALLED'
        AND h.from_owner_type = 'PATIENT'
        AND (p_start_date IS NULL OR h.created_at >= p_start_date)
        AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      GROUP BY DATE_TRUNC('minute', h.created_at), h.to_owner_id, h.from_owner_id
    ) grouped;
  END IF;

  RETURN v_count;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION get_all_recalls(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_recalls_count(TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;

COMMENT ON FUNCTION get_all_recalls IS
  'Admin 회수 이력 통합 조회. 출고 회수 + 시술 회수를 DB에서 정렬/페이지네이션 (Phase 17)';

COMMENT ON FUNCTION get_all_recalls_count IS
  'Admin 회수 이력 총 개수 조회';
