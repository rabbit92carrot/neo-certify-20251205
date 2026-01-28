-- Phase 8: 제조사/유통사/병원 페이지 성능 최적화용 인덱스
--
-- 대상 페이지:
--   - 제조사/유통사 출고 이력 (shipment history)
--   - 병원 시술 이력 (treatment history)
--
-- 참고: Supabase 마이그레이션은 트랜잭션 내에서 실행되므로 CONCURRENTLY 사용 불가
--       프로덕션 환경에서는 트래픽이 적은 시간에 적용 권장
--
-- 기존 인덱스 (이미 존재):
--   - idx_shipment_details_batch (shipment_batch_id)
--   - idx_shipment_details_code (virtual_code_id)
--   - idx_treatment_details_code (virtual_code_id)

-- ============================================================
-- 1. shipment_batches 인덱스 - 출고 이력 페이지 최적화
-- ============================================================
-- 보낸 출고 목록 날짜순 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_shipment_batches_from_org_date
  ON public.shipment_batches (from_organization_id, shipment_date DESC);

COMMENT ON INDEX idx_shipment_batches_from_org_date IS
  '출고 이력 페이지 성능 최적화: 보낸 출고 목록 날짜순 조회용 인덱스 (Phase 8)';

-- 받은 출고 목록 날짜순 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_shipment_batches_to_org_date
  ON public.shipment_batches (to_organization_id, shipment_date DESC);

COMMENT ON INDEX idx_shipment_batches_to_org_date IS
  '출고 이력 페이지 성능 최적화: 받은 출고 목록 날짜순 조회용 인덱스 (Phase 8)';

-- ============================================================
-- 2. treatment_records 인덱스 - 시술 이력 페이지 최적화
-- ============================================================
-- 병원별 시술 이력 날짜순 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_treatment_records_hospital_date
  ON public.treatment_records (hospital_id, treatment_date DESC);

COMMENT ON INDEX idx_treatment_records_hospital_date IS
  '시술 이력 페이지 성능 최적화: 병원별 시술 목록 날짜순 조회용 인덱스 (Phase 8)';

-- ============================================================
-- 3. treatment_details 인덱스 - 시술 상세 조회 최적화
-- ============================================================
-- treatment_id 기준 인덱스 (기존에 없음)
CREATE INDEX IF NOT EXISTS idx_treatment_details_treatment
  ON public.treatment_details (treatment_id);

COMMENT ON INDEX idx_treatment_details_treatment IS
  '시술 이력 페이지 성능 최적화: treatment별 상세 조회용 인덱스 (Phase 8)';

-- ============================================================
-- 4. lots 인덱스 - 재고 조회 최적화
-- ============================================================
-- 제품별 lot 조회 최적화
CREATE INDEX IF NOT EXISTS idx_lots_product_id
  ON public.lots (product_id);

COMMENT ON INDEX idx_lots_product_id IS
  '재고 조회 페이지 성능 최적화: 제품별 lot 조회용 인덱스 (Phase 8)';
