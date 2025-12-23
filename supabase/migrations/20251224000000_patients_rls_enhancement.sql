-- ============================================================================
-- Patients 테이블 RLS 정책 강화
--
-- 목적: 병원은 자신의 시술 기록에 있는 환자만 조회 가능하도록 제한
--
-- 배경:
-- - 현재 모든 인증 사용자가 전체 환자 정보 조회 가능 (PII 노출 위험)
-- - 모든 환자 데이터 접근은 SECURITY DEFINER RPC 함수 경유 (RLS 우회)
-- - hospital_known_patients 캐시가 이미 병원별 RLS 적용됨
-- - 이 변경은 직접 테이블 접근 시도를 방어하는 "최후의 방어선" 역할
--
-- 영향 분석:
-- - 시술 등록 (create_treatment_atomic): 영향 없음 (SECURITY DEFINER)
-- - 환자 검색 (get_hospital_patients): 영향 없음 (hospital_known_patients 사용)
-- - 시술 회수 (recall_treatment_atomic): 영향 없음 (SECURITY DEFINER)
-- - 대시보드 통계: 영향 없음 (treatment_records 기반)
-- ============================================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "patients_select" ON "public"."patients";

-- 1. Admin 전체 조회 정책
CREATE POLICY "patients_select_admin" ON "public"."patients"
    FOR SELECT
    USING (
        "public"."is_admin"()
    );

COMMENT ON POLICY "patients_select_admin" ON "public"."patients"
    IS '관리자는 모든 환자 정보 조회 가능';

-- 2. 병원 - 자신의 시술 기록 환자만 조회
-- 성능 최적화: hospital_known_patients 캐시 테이블 활용 (이미 인덱싱됨)
CREATE POLICY "patients_select_hospital" ON "public"."patients"
    FOR SELECT
    USING (
        "public"."get_user_organization_type"() = 'HOSPITAL'::"public"."organization_type"
        AND EXISTS (
            SELECT 1
            FROM "public"."hospital_known_patients" hkp
            WHERE hkp."hospital_id" = "public"."get_user_organization_id"()
              AND hkp."patient_phone" = CASE
                  -- patients.phone_number는 010XXXXXXXX 형식
                  -- hospital_known_patients.patient_phone은 010 제외 XXXXXXXX 형식
                  WHEN LENGTH("patients"."phone_number") > 3
                  THEN SUBSTRING("patients"."phone_number" FROM 4)
                  ELSE "patients"."phone_number"
              END
        )
    );

COMMENT ON POLICY "patients_select_hospital" ON "public"."patients"
    IS '병원은 자신의 시술 기록에 있는 환자만 조회 가능 (hospital_known_patients 캐시 활용)';

-- 3. 제조사/유통사는 환자 정보 접근 불가
-- 별도 정책 불필요: 위 정책에 해당하지 않으면 자동 거부

-- ============================================================================
-- 테스트 쿼리 (마이그레이션 후 확인용)
-- ============================================================================
--
-- 1. Admin으로 로그인 후 모든 환자 조회 가능 확인
-- SELECT * FROM patients LIMIT 10;
--
-- 2. Hospital로 로그인 후 자신의 환자만 조회되는지 확인
-- SELECT * FROM patients LIMIT 10;
--
-- 3. Manufacturer/Distributor로 로그인 후 환자 조회 시 빈 결과 확인
-- SELECT * FROM patients LIMIT 10;
-- ============================================================================
