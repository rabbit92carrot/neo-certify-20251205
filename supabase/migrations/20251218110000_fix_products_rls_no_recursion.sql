-- =====================================================
-- Migration: 20251218110000_fix_products_rls_no_recursion
-- Description: 무한 재귀 없이 재고 보유자도 제품 정보를 조회할 수 있도록 수정
--
-- 문제: 이전 정책이 products → lots → products 순환 참조 발생
-- 해결: SECURITY DEFINER 함수로 재귀 방지
-- =====================================================

-- 1. 재고 보유 여부 확인 함수 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION has_inventory_for_product(p_product_id UUID, p_organization_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM virtual_codes vc
    JOIN lots l ON l.id = vc.lot_id
    WHERE l.product_id = p_product_id
      AND vc.owner_id = p_organization_id::VARCHAR
      AND vc.owner_type = 'ORGANIZATION'
      AND vc.status = 'IN_STOCK'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION has_inventory_for_product(UUID, UUID) IS
  '특정 조직이 특정 제품의 재고를 보유하고 있는지 확인 (RLS 우회)';

-- 2. 기존 정책 삭제
DROP POLICY IF EXISTS "products_select" ON products;

-- 3. 새 정책 생성 (함수 호출로 재귀 방지)
CREATE POLICY "products_select"
  ON products FOR SELECT
  USING (
    -- 1. 제품 소유자(제조사)는 자신의 모든 제품 조회 가능 (활성/비활성)
    organization_id = get_user_organization_id()
    -- 2. 해당 제품의 재고를 현재 보유한 조직은 조회 가능 (단종 제품이어도)
    OR has_inventory_for_product(id, get_user_organization_id())
    -- 3. 관리자는 모든 제품 조회 가능
    OR is_admin()
  );

COMMENT ON POLICY "products_select" ON products IS
  '제품 조회 정책: 소유자(제조사), 재고 보유자, 관리자만 조회 가능';
