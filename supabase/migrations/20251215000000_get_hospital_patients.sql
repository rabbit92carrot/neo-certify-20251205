-- ============================================================================
-- 병원별 환자 검색 함수
-- 병원에서 시술 이력이 있는 환자의 전화번호를 검색합니다.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_hospital_patients(
  p_hospital_id UUID,
  p_search_term VARCHAR DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(phone_number VARCHAR)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT tr.patient_phone as phone_number
  FROM treatment_records tr
  WHERE tr.hospital_id = p_hospital_id
    AND (p_search_term IS NULL OR tr.patient_phone LIKE '%' || p_search_term || '%')
  ORDER BY phone_number
  LIMIT p_limit;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION get_hospital_patients TO authenticated;

COMMENT ON FUNCTION get_hospital_patients IS '병원별 환자 전화번호 검색 (시술 이력 기반)';
