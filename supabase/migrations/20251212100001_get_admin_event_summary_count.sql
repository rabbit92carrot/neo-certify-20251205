-- =====================================================
-- Migration: 20251212100001_get_admin_event_summary_count
-- Description: 관리자 이벤트 요약 카운트 함수
-- =====================================================

-- =====================================================
-- 관리자용 이벤트 요약 총 개수 조회 함수
-- get_admin_event_summary와 동일한 그룹화 기준
-- =====================================================
CREATE OR REPLACE FUNCTION get_admin_event_summary_count(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_action_types TEXT[] DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_lot_number TEXT DEFAULT NULL,
  p_product_id UUID DEFAULT NULL,
  p_include_recalled BOOLEAN DEFAULT TRUE
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COUNT(DISTINCT (
    DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
    h.action_type || '_' ||
    COALESCE(h.from_owner_id, '') || '_' ||
    COALESCE(h.to_owner_id, '') || '_' ||
    h.is_recall::TEXT
  ))
  INTO v_count
  FROM histories h
  INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
  INNER JOIN lots l ON l.id = vc.lot_id
  INNER JOIN products p ON p.id = l.product_id
  WHERE
    (p_start_date IS NULL OR h.created_at >= p_start_date)
    AND (p_end_date IS NULL OR h.created_at <= p_end_date)
    AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
    AND (p_organization_id IS NULL OR
         h.from_owner_id = p_organization_id::VARCHAR OR
         h.to_owner_id = p_organization_id::VARCHAR)
    AND (p_lot_number IS NULL OR l.lot_number ILIKE '%' || p_lot_number || '%')
    AND (p_product_id IS NULL OR p.id = p_product_id)
    AND (p_include_recalled OR h.is_recall = FALSE);

  RETURN v_count;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION get_admin_event_summary_count TO authenticated;
