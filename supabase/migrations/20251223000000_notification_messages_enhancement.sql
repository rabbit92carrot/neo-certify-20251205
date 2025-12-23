-- notification_messages 테이블 기능 강화
-- 1. treatment_id 컬럼 추가 (인증코드 확인 페이지 연결용)
-- 2. metadata 컬럼 추가 (버튼 정보, 병원 연락처 등 저장)

-- treatment_id 컬럼 추가
ALTER TABLE "public"."notification_messages"
ADD COLUMN IF NOT EXISTS "treatment_id" UUID REFERENCES "public"."treatment_records"("id") ON DELETE SET NULL;

-- metadata 컬럼 추가 (JSONB)
ALTER TABLE "public"."notification_messages"
ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;

-- treatment_id 인덱스 추가 (조회 성능)
CREATE INDEX IF NOT EXISTS "idx_notifications_treatment"
ON "public"."notification_messages" ("treatment_id")
WHERE "treatment_id" IS NOT NULL;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN "public"."notification_messages"."treatment_id" IS '연결된 시술 기록 ID (인증코드 확인 페이지 연결용)';
COMMENT ON COLUMN "public"."notification_messages"."metadata" IS '추가 메타데이터 (buttons, hospitalContact 등)';
