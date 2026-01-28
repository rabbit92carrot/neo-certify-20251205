-- Issue #001: virtual_codes 테이블에 복합 인덱스 추가
--
-- 문제: hospital-disposal 페이지의 get_active_products_for_treatment RPC가
--       virtual_codes 테이블 Full Scan으로 간헐적 11초 지연 발생
--
-- 해결: (owner_id, status, lot_id) 복합 인덱스 추가로 Index Scan 유도
--
-- 참고: Supabase 마이그레이션은 트랜잭션 내에서 실행되므로 CONCURRENTLY 사용 불가
--       프로덕션 환경에서는 트래픽이 적은 시간에 적용 권장

-- 복합 인덱스 생성 (Partial Index: IN_STOCK만)
-- owner_id + status 조건이 WHERE절에서 가장 많이 사용됨
CREATE INDEX IF NOT EXISTS idx_vc_owner_status_lot
  ON public.virtual_codes (owner_id, status, lot_id)
  WHERE status = 'IN_STOCK';

-- 추가 인덱스: owner_id만으로 조회하는 경우도 많음
CREATE INDEX IF NOT EXISTS idx_vc_owner_id_in_stock
  ON public.virtual_codes (owner_id)
  WHERE status = 'IN_STOCK';

-- 인덱스 코멘트
COMMENT ON INDEX idx_vc_owner_status_lot IS
  'hospital-disposal RPC 성능 최적화용 복합 인덱스 (Issue #001)';

COMMENT ON INDEX idx_vc_owner_id_in_stock IS
  'organization code count 조회 최적화용 인덱스 (Issue #001)';
