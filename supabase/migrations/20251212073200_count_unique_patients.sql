-- ============================================================================
-- 고유 환자 수 카운트 함수
-- Supabase API의 1000 row limit을 우회하여 정확한 고유 환자 수 조회
-- ============================================================================

-- 병원별 고유 환자 수 조회 함수
CREATE OR REPLACE FUNCTION count_unique_patients(
  p_hospital_id UUID
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT patient_phone)::INTEGER
  FROM treatment_records
  WHERE hospital_id = p_hospital_id;
$$;

-- 함수에 대한 주석

