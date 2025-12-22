-- ============================================================================
-- 병원 환자 캐시 테이블
--
-- 목적: 환자 전화번호 검색 성능 최적화
-- - 기존: treatment_records에서 DISTINCT 조회 (시술 건수 증가 시 성능 저하)
-- - 변경: 병원별 환자 목록 별도 관리 (O(1) 조회)
--
-- 전화번호 저장 형식:
-- - 010 제외하여 저장 (예: 01012345678 → 12345678)
-- - 검색 시 입력값에서도 010 제거 후 검색
-- - 반환 시 010 붙여서 반환
--
-- 검색 방식 (Dual B-tree Index):
-- - 앞자리 검색: patient_phone LIKE '1234%' (prefix 인덱스)
-- - 뒷자리 검색: reverse(patient_phone) LIKE reverse('5678') || '%' (suffix 인덱스)
-- - 최소 4자 입력 필요 (UX 개선: 너무 잦은 결과 변경 방지)
--
-- 동기화:
-- - 시술 등록 시: UPSERT (treatment_count +1, last_treatment_at 갱신)
-- - 시술 회수 시: treatment_count -1 (0이 되어도 레코드 유지)
-- ============================================================================

-- 테이블 생성
CREATE TABLE IF NOT EXISTS "public"."hospital_known_patients" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "hospital_id" UUID NOT NULL,
    "patient_phone" VARCHAR(11) NOT NULL,  -- 010 제외 저장 (최대 8자리 + 여유)
    "treatment_count" INTEGER DEFAULT 1 NOT NULL,
    "first_treatment_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "last_treatment_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT "hospital_known_patients_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hospital_known_patients_hospital_id_fkey"
        FOREIGN KEY ("hospital_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE,
    CONSTRAINT "uq_hospital_patient" UNIQUE ("hospital_id", "patient_phone"),
    CONSTRAINT "chk_treatment_count" CHECK ("treatment_count" >= 0)
);

-- 검색 인덱스 (Dual B-tree: prefix + suffix 검색 최적화)
-- varchar_pattern_ops: LIKE 'prefix%' 패턴 검색에 최적화
CREATE INDEX IF NOT EXISTS "idx_hkpatients_phone_prefix"
    ON "public"."hospital_known_patients"("hospital_id", "patient_phone" varchar_pattern_ops);

-- suffix 검색용 reverse() 함수 인덱스
-- reverse(phone) LIKE reverse('5678') || '%' 패턴으로 뒷자리 검색
CREATE INDEX IF NOT EXISTS "idx_hkpatients_phone_suffix"
    ON "public"."hospital_known_patients"("hospital_id", reverse("patient_phone") varchar_pattern_ops);

-- 병원별 조회 인덱스
CREATE INDEX IF NOT EXISTS "idx_hkpatients_hospital_id"
    ON "public"."hospital_known_patients"("hospital_id");

-- 최근 시술 순 정렬용 인덱스
CREATE INDEX IF NOT EXISTS "idx_hkpatients_last_treatment"
    ON "public"."hospital_known_patients"("hospital_id", "last_treatment_at" DESC);

-- RLS 활성화
ALTER TABLE "public"."hospital_known_patients" ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 자기 병원 데이터만 조회 가능
CREATE POLICY "hkp_select" ON "public"."hospital_known_patients"
    FOR SELECT
    USING (
        hospital_id = get_user_organization_id()
        OR is_admin()
    );

-- RLS 정책: 자기 병원 데이터만 수정 가능 (트리거에서 사용)
CREATE POLICY "hkp_insert" ON "public"."hospital_known_patients"
    FOR INSERT
    WITH CHECK (
        hospital_id = get_user_organization_id()
    );

CREATE POLICY "hkp_update" ON "public"."hospital_known_patients"
    FOR UPDATE
    USING (
        hospital_id = get_user_organization_id()
    );

-- updated_at 자동 갱신 트리거
CREATE TRIGGER "update_hospital_known_patients_updated_at"
    BEFORE UPDATE ON "public"."hospital_known_patients"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- 테이블 설명
COMMENT ON TABLE "public"."hospital_known_patients" IS '병원별 환자 목록 캐시 (검색 성능 최적화용)';
COMMENT ON COLUMN "public"."hospital_known_patients"."treatment_count" IS '유효 시술 횟수 (회수 시 감소, 0 이상 유지)';
COMMENT ON COLUMN "public"."hospital_known_patients"."first_treatment_at" IS '최초 시술 일시';
COMMENT ON COLUMN "public"."hospital_known_patients"."last_treatment_at" IS '마지막 시술 일시';
