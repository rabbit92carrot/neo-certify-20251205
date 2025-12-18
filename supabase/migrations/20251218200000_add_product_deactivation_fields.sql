-- =====================================================
-- Migration: 20251218200000_add_product_deactivation_fields
-- Description: products 테이블에 비활성화 사유 필드 추가
--
-- 비활성화 유형:
--   - DISCONTINUED: 단순 단종 (시리즈 종료)
--   - SAFETY_ISSUE: 안전 문제 (리콜 대상)
--   - QUALITY_ISSUE: 품질 문제
--   - OTHER: 기타
-- =====================================================

-- 비활성화 사유 ENUM 생성
CREATE TYPE product_deactivation_reason AS ENUM (
  'DISCONTINUED',
  'SAFETY_ISSUE',
  'QUALITY_ISSUE',
  'OTHER'
);

-- products 테이블에 컬럼 추가
ALTER TABLE products
  ADD COLUMN deactivation_reason product_deactivation_reason,
  ADD COLUMN deactivation_note TEXT,
  ADD COLUMN deactivated_at TIMESTAMPTZ;

-- 기존 비활성 제품에 기본값 설정
UPDATE products
SET
  deactivation_reason = 'DISCONTINUED',
  deactivated_at = updated_at
WHERE is_active = FALSE AND deactivation_reason IS NULL;

-- 인덱스 추가 (비활성 제품 조회 최적화)
CREATE INDEX idx_products_is_active_reason ON products(is_active, deactivation_reason)
WHERE is_active = FALSE;

COMMENT ON COLUMN products.deactivation_reason IS '비활성화 사유: DISCONTINUED(단종), SAFETY_ISSUE(안전문제), QUALITY_ISSUE(품질문제), OTHER(기타)';
COMMENT ON COLUMN products.deactivation_note IS '비활성화 상세 사유 (선택)';
COMMENT ON COLUMN products.deactivated_at IS '비활성화 일시';
