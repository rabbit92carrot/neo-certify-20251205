-- ============================================================================
-- SECURITY DEFINER → SECURITY INVOKER 변경
--
-- 목적: RLS를 자연스럽게 적용하여 방어적 프로그래밍 강화
--
-- 변경 전 (SECURITY DEFINER):
-- - 함수가 postgres 권한으로 실행되어 RLS 우회
-- - 상위 함수에서 암묵적으로 권한 검증됨
-- - 리팩토링/재사용 시 검증 누락 위험
--
-- 변경 후 (SECURITY INVOKER):
-- - 함수가 호출자 권한으로 실행되어 RLS 자동 적용
-- - 각 테이블 접근 시 명시적 권한 검증
-- - 함수 호출 순서/컨텍스트와 무관하게 안전
-- ============================================================================

-- ============================================================================
-- 1. upsert_hospital_known_patient: SECURITY INVOKER로 변경
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."upsert_hospital_known_patient"(
    p_hospital_id UUID,
    p_patient_phone VARCHAR,
    p_treatment_date TIMESTAMPTZ DEFAULT now()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER  -- 변경: DEFINER → INVOKER
SET search_path = public
AS $$
DECLARE
    v_phone_without_010 VARCHAR;
BEGIN
    -- 010 제거하여 저장 (010으로 시작하고 4자 이상일 때만)
    IF LENGTH(p_patient_phone) >= 4 AND p_patient_phone LIKE '010%' THEN
        v_phone_without_010 := SUBSTRING(p_patient_phone FROM 4);
    ELSE
        v_phone_without_010 := p_patient_phone;
    END IF;

    -- RLS가 자동으로 hospital_id = get_user_organization_id() 검증
    INSERT INTO hospital_known_patients (
        hospital_id,
        patient_phone,
        treatment_count,
        first_treatment_at,
        last_treatment_at
    )
    VALUES (
        p_hospital_id,
        v_phone_without_010,
        1,
        p_treatment_date,
        p_treatment_date
    )
    ON CONFLICT (hospital_id, patient_phone)
    DO UPDATE SET
        treatment_count = hospital_known_patients.treatment_count + 1,
        last_treatment_at = GREATEST(hospital_known_patients.last_treatment_at, p_treatment_date),
        updated_at = now();
END;
$$;

COMMENT ON FUNCTION "public"."upsert_hospital_known_patient"(UUID, VARCHAR, TIMESTAMPTZ)
    IS '병원 환자 캐시 등록/업데이트 (SECURITY INVOKER: RLS 자동 적용)';


-- ============================================================================
-- 2. decrement_hospital_known_patient: SECURITY INVOKER로 변경
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."decrement_hospital_known_patient"(
    p_hospital_id UUID,
    p_patient_phone VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER  -- 변경: DEFINER → INVOKER
SET search_path = public
AS $$
DECLARE
    v_phone_without_010 VARCHAR;
BEGIN
    -- 010 제거하여 검색 (저장 형식과 동일하게)
    IF LENGTH(p_patient_phone) >= 4 AND p_patient_phone LIKE '010%' THEN
        v_phone_without_010 := SUBSTRING(p_patient_phone FROM 4);
    ELSE
        v_phone_without_010 := p_patient_phone;
    END IF;

    -- RLS가 자동으로 hospital_id = get_user_organization_id() 검증
    -- treatment_count 감소 (최소 0 유지, 레코드는 삭제하지 않음)
    UPDATE hospital_known_patients
    SET
        treatment_count = GREATEST(treatment_count - 1, 0),
        updated_at = now()
    WHERE hospital_id = p_hospital_id
      AND patient_phone = v_phone_without_010;

    -- 존재하지 않는 경우 무시 (이미 삭제된 경우 등)
END;
$$;

COMMENT ON FUNCTION "public"."decrement_hospital_known_patient"(UUID, VARCHAR)
    IS '병원 환자 시술 횟수 감소 (SECURITY INVOKER: RLS 자동 적용)';

