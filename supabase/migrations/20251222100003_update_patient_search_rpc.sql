-- ============================================================================
-- 환자 검색 RPC 함수 업데이트
--
-- 기존: treatment_records에서 DISTINCT 조회 (시술 건수 증가 시 성능 저하)
-- 변경: hospital_known_patients에서 직접 조회 (인덱스 활용, O(log n) 수준)
--
-- 전화번호 형식:
-- - 저장: 010 제외 (예: 12345678)
-- - 검색: 입력값에서 010 제거 후 prefix/suffix 검색
-- - 반환: 010 붙여서 반환 (예: 01012345678)
--
-- 검색 패턴 지원 (Dual B-tree Index):
-- - 앞자리 검색: "1234" → patient_phone LIKE '1234%' (prefix 인덱스)
-- - 뒷자리 검색: "5678" → reverse(patient_phone) LIKE '8765%' (suffix 인덱스)
-- - 010 포함: "01012345678" → "12345678"로 변환 후 정확 검색
-- - 최소 4자 입력 필요 (미만 시 검색 안함)
--
-- 성능 비교:
-- - 기존: O(n) - 시술 건수에 비례 (DISTINCT 정렬 필요)
-- - 변경: O(log n) - B-tree 인덱스 탐색 (prefix/suffix 모두)
-- ============================================================================

-- 기존 함수 대체
CREATE OR REPLACE FUNCTION "public"."get_hospital_patients"(
    "p_hospital_id" "uuid",
    "p_search_term" character varying DEFAULT NULL::character varying,
    "p_limit" integer DEFAULT 10
)
RETURNS TABLE("phone_number" character varying)
LANGUAGE "plpgsql" STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_search VARCHAR;
    v_search_len INTEGER;
BEGIN
    -- 검색어 정규화: 010 제거
    IF p_search_term IS NULL OR p_search_term = '' THEN
        v_search := NULL;
    ELSIF LENGTH(p_search_term) >= 3 AND p_search_term LIKE '010%' THEN
        -- 010으로 시작하면 제거
        v_search := SUBSTRING(p_search_term FROM 4);
    ELSE
        v_search := p_search_term;
    END IF;

    -- 검색어 길이 계산
    v_search_len := COALESCE(LENGTH(v_search), 0);

    RETURN QUERY
    SELECT ('010' || hkp.patient_phone)::VARCHAR AS phone_number  -- 010 붙여서 반환
    FROM hospital_known_patients hkp
    WHERE hkp.hospital_id = p_hospital_id
      AND (
          -- 검색어 없음: 전체 반환
          v_search IS NULL
          OR v_search = ''
          -- 4자 미만: 검색 안함 (결과 없음)
          OR (v_search_len < 4 AND FALSE)
          -- 8자 (전체 번호): 정확히 일치
          OR (v_search_len = 8 AND hkp.patient_phone = v_search)
          -- 4~7자: prefix OR suffix 검색 (둘 중 하나라도 매칭)
          OR (v_search_len >= 4 AND v_search_len < 8 AND (
              hkp.patient_phone LIKE v_search || '%'  -- prefix 검색 (인덱스 활용)
              OR reverse(hkp.patient_phone) LIKE reverse(v_search) || '%'  -- suffix 검색 (인덱스 활용)
          ))
      )
    ORDER BY hkp.last_treatment_at DESC  -- 최근 시술 환자 우선
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION "public"."get_hospital_patients"("p_hospital_id" "uuid", "p_search_term" character varying, "p_limit" integer)
    IS '병원별 환자 전화번호 검색 (Dual B-tree: prefix/suffix 검색, 최소 4자, 010 제외 저장, 010 붙여서 반환)';
