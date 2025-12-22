-- ============================================================================
-- 병원 제품 관리 테이블 (hospital_known_products)
--
-- 목적: 병원이 한 번이라도 입고받은 제품을 관리하고, 별칭 및 활성화 상태를 설정
--
-- 기능:
-- 1. 병원별 제품 별칭 설정 (같은 병원 내 중복 불가)
-- 2. 제품 활성화/비활성화 (비활성 시 시술 등록에서 숨김)
-- 3. 입고 시 자동 등록 (트리거로 처리 - 별도 마이그레이션)
-- ============================================================================

-- 테이블 생성
CREATE TABLE IF NOT EXISTS "public"."hospital_known_products" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "hospital_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "alias" VARCHAR(100),                              -- 병원별 별칭 (nullable)
    "is_active" BOOLEAN DEFAULT true NOT NULL,         -- 시술 등록 활성화 여부
    "first_received_at" TIMESTAMPTZ DEFAULT now() NOT NULL,  -- 최초 입고 시점
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- 기본 키
    CONSTRAINT "hospital_known_products_pkey" PRIMARY KEY ("id"),

    -- 외래 키
    CONSTRAINT "hospital_known_products_hospital_id_fkey"
        FOREIGN KEY ("hospital_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE,
    CONSTRAINT "hospital_known_products_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE,

    -- 유니크 제약: 병원당 제품은 하나만
    CONSTRAINT "uq_hospital_product" UNIQUE ("hospital_id", "product_id"),

    -- 별칭 유효성: 빈 문자열 불가 (null 또는 실제 값)
    CONSTRAINT "chk_alias_not_empty" CHECK ("alias" IS NULL OR char_length(trim("alias")) > 0)
);

-- 테이블 소유자
ALTER TABLE "public"."hospital_known_products" OWNER TO "postgres";

-- 별칭 중복 방지 인덱스 (NULL은 중복 허용)
CREATE UNIQUE INDEX "idx_hospital_alias_unique"
    ON "public"."hospital_known_products"("hospital_id", "alias")
    WHERE "alias" IS NOT NULL;

-- 성능 인덱스
CREATE INDEX "idx_hkp_hospital_id"
    ON "public"."hospital_known_products"("hospital_id");

CREATE INDEX "idx_hkp_hospital_active"
    ON "public"."hospital_known_products"("hospital_id", "is_active");

CREATE INDEX "idx_hkp_product_id"
    ON "public"."hospital_known_products"("product_id");

-- ============================================================================
-- RLS (Row Level Security) 정책
-- ============================================================================

ALTER TABLE "public"."hospital_known_products" ENABLE ROW LEVEL SECURITY;

-- SELECT: 자기 병원 또는 관리자
CREATE POLICY "hkp_select_own"
    ON "public"."hospital_known_products"
    FOR SELECT
    USING (
        "hospital_id" = "public"."get_user_organization_id"()
        OR "public"."is_admin"()
    );

-- INSERT: 자기 병원만 (트리거에서 SECURITY DEFINER로 처리하므로 실제로는 사용 안 됨)
CREATE POLICY "hkp_insert_own"
    ON "public"."hospital_known_products"
    FOR INSERT
    WITH CHECK (
        "hospital_id" = "public"."get_user_organization_id"()
    );

-- UPDATE: 자기 병원만
CREATE POLICY "hkp_update_own"
    ON "public"."hospital_known_products"
    FOR UPDATE
    USING ("hospital_id" = "public"."get_user_organization_id"())
    WITH CHECK ("hospital_id" = "public"."get_user_organization_id"());

-- DELETE: 관리자만 (일반적으로 삭제하지 않음)
CREATE POLICY "hkp_delete_admin"
    ON "public"."hospital_known_products"
    FOR DELETE
    USING ("public"."is_admin"());

-- ============================================================================
-- updated_at 자동 갱신 트리거
-- ============================================================================

CREATE TRIGGER "trg_hospital_known_products_updated_at"
    BEFORE UPDATE ON "public"."hospital_known_products"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- ============================================================================
-- 테이블 및 컬럼 코멘트
-- ============================================================================

COMMENT ON TABLE "public"."hospital_known_products" IS '병원이 입고받은 제품 목록 및 별칭/활성화 설정';
COMMENT ON COLUMN "public"."hospital_known_products"."hospital_id" IS '병원 조직 ID';
COMMENT ON COLUMN "public"."hospital_known_products"."product_id" IS '제품 ID';
COMMENT ON COLUMN "public"."hospital_known_products"."alias" IS '병원 내부 별칭 (예: 볼, 이마)';
COMMENT ON COLUMN "public"."hospital_known_products"."is_active" IS '시술 등록 활성화 여부 (false 시 숨김)';
COMMENT ON COLUMN "public"."hospital_known_products"."first_received_at" IS '최초 입고 시점';
