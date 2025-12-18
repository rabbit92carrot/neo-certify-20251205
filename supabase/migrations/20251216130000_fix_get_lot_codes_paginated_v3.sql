-- =====================================================
-- Migration: 20251216130000_fix_get_lot_codes_paginated_v3
-- Description: get_lot_codes_paginated 함수 타입 수정 (v3)
-- Fix: CASE 문 결과를 모두 TEXT로 명시적 캐스팅
-- =====================================================

-- 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS get_lot_codes_paginated(UUID, INTEGER, INTEGER);

-- Lot별 고유식별코드 페이지네이션 조회 함수
CREATE OR REPLACE FUNCTION get_lot_codes_paginated(
  p_lot_id UUID,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  current_status TEXT,
  current_owner_name TEXT,
  current_owner_type TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INTEGER;
  v_total BIGINT;
BEGIN
  -- 오프셋 계산
  v_offset := (p_page - 1) * p_page_size;

  -- 총 개수 먼저 조회
  SELECT COUNT(*)
  INTO v_total
  FROM virtual_codes vc
  WHERE vc.lot_id = p_lot_id;

  -- 페이지네이션된 결과 반환
  -- 모든 컬럼을 TEXT로 명시적 캐스팅하여 타입 일치 보장
  RETURN QUERY
  SELECT
    vc.id,
    vc.code::TEXT AS code,
    vc.status::TEXT AS current_status,
    (CASE
      WHEN vc.owner_type::TEXT = 'PATIENT' THEN
        CASE
          WHEN LENGTH(vc.owner_id) >= 4 THEN
            '***-****-' || RIGHT(vc.owner_id, 4)
          ELSE vc.owner_id
        END
      WHEN vc.owner_type::TEXT = 'ORGANIZATION' THEN
        COALESCE(o.name::TEXT, '알 수 없음')
      ELSE '알 수 없음'
    END)::TEXT AS current_owner_name,
    vc.owner_type::TEXT AS current_owner_type,
    v_total AS total_count
  FROM virtual_codes vc
  LEFT JOIN organizations o ON vc.owner_type::TEXT = 'ORGANIZATION' AND vc.owner_id = o.id::TEXT
  WHERE vc.lot_id = p_lot_id
  ORDER BY vc.created_at ASC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION get_lot_codes_paginated TO authenticated;
