-- 추가 성능 인덱스 (Phase 14)
-- 기존 인덱스와 중복되지 않는 복합 인덱스만 추가

-- ============================================
-- Histories 테이블: 조직별 이력 조회 최적화
-- ============================================

-- 조직별 + 액션타입 + 시간순 조회 최적화 (get_history_summary 함수)
-- 기존: idx_histories_from_owner (from_owner_type, from_owner_id)
-- 추가: 액션타입과 생성시간 포함한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_histories_org_action_time
  ON histories(from_owner_id, action_type, created_at DESC)
  WHERE from_owner_type = 'ORGANIZATION';

-- 수신자 기준 이력 조회 최적화 (입고 이력)
CREATE INDEX IF NOT EXISTS idx_histories_to_org_action_time
  ON histories(to_owner_id, action_type, created_at DESC)
  WHERE to_owner_type = 'ORGANIZATION';

-- ============================================
-- Lots 테이블: 생산량 조회 최적화
-- ============================================

-- 오늘 생산량 조회 최적화 (대시보드 통계)
-- product_id로 조인 후 created_at 필터링에 최적화
CREATE INDEX IF NOT EXISTS idx_lots_created_product
  ON lots(created_at DESC, product_id);

-- ============================================
-- Virtual Codes 테이블: 재고 조회 최적화
-- ============================================

-- 조직별 재고 상세 조회 최적화 (lot_id 포함)
-- 기존: idx_virtual_codes_inventory (owner_id, status) WHERE status = 'IN_STOCK'
-- 추가: lot_id 포함하여 제품별 재고 조회 최적화
CREATE INDEX IF NOT EXISTS idx_virtual_codes_owner_lot_status
  ON virtual_codes(owner_id, lot_id, status)
  WHERE owner_type = 'ORGANIZATION' AND status = 'IN_STOCK';

-- 권한 부여 불필요 (인덱스는 자동으로 적용됨)

COMMENT ON INDEX idx_histories_org_action_time IS
  '조직별 이력 조회 최적화 (get_history_summary). from_owner 기준, 액션타입+시간순';

COMMENT ON INDEX idx_histories_to_org_action_time IS
  '수신자 기준 이력 조회 최적화 (입고 이력). to_owner 기준, 액션타입+시간순';

COMMENT ON INDEX idx_lots_created_product IS
  '생산량 조회 최적화 (대시보드). 생성일+제품ID 복합 인덱스';

COMMENT ON INDEX idx_virtual_codes_owner_lot_status IS
  '조직별 재고 상세 조회 최적화. owner+lot+status 복합 인덱스';
