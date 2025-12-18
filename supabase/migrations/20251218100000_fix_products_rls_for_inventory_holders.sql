-- =====================================================
-- Migration: 20251218100000_fix_products_rls_for_inventory_holders
-- Description: 재고 보유자도 비활성 제품 정보를 조회할 수 있도록 RLS 정책 수정
--
-- 문제: 단종된 제품(is_active=false)의 재고를 보유한 유통사/병원이
--       해당 제품 정보를 조회할 수 없음
-- 원인: products_select 정책이 is_active=TRUE 또는 소유자만 허용
-- 해결: 해당 제품의 virtual_codes를 보유한 조직도 조회 가능하도록 수정
--
-- 보안 원칙: 조직은 자신과 관련된 제품만 조회 가능
--   - 제조사: 자신이 생성한 제품 (활성/비활성 모두)
--   - 유통사/병원: 자신이 현재 재고로 보유한 제품만
--   - 관리자: 모든 제품
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "products_select" ON products;

-- 새 정책 생성: 자신과 관련된 제품만 조회 가능
CREATE POLICY "products_select"
  ON products FOR SELECT
  USING (
    -- 1. 제품 소유자(제조사)는 자신의 모든 제품 조회 가능 (활성/비활성)
    organization_id = get_user_organization_id()
    -- 2. 해당 제품의 재고를 현재 보유한 조직은 조회 가능 (단종 제품이어도)
    OR EXISTS (
      SELECT 1 FROM virtual_codes vc
      JOIN lots l ON l.id = vc.lot_id
      WHERE l.product_id = products.id
        AND vc.owner_id = get_user_organization_id()::VARCHAR
        AND vc.owner_type = 'ORGANIZATION'
        AND vc.status = 'IN_STOCK'
    )
    -- 3. 관리자는 모든 제품 조회 가능
    OR is_admin()
  );

COMMENT ON POLICY "products_select" ON products IS
  '제품 조회 정책: 소유자(제조사), 재고 보유자, 관리자만 조회 가능';
