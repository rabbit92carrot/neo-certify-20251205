-- ============================================================================
-- 기존 병원 입고 데이터를 hospital_known_products로 마이그레이션
--
-- 목적: 트리거 적용 전 이미 입고된 제품들을 hospital_known_products에 등록
-- 동작: 기존 shipment_batches + shipment_details를 분석하여 병원별 제품 등록
-- ============================================================================

-- 기존 병원들의 입고 이력을 기반으로 hospital_known_products 채우기
INSERT INTO "public"."hospital_known_products" (hospital_id, product_id, first_received_at)
SELECT DISTINCT
    sb.to_organization_id AS hospital_id,
    l.product_id,
    MIN(sb.shipment_date) AS first_received_at
FROM "public"."shipment_batches" sb
JOIN "public"."organizations" o ON sb.to_organization_id = o.id
JOIN "public"."shipment_details" sd ON sb.id = sd.shipment_batch_id
JOIN "public"."virtual_codes" vc ON sd.virtual_code_id = vc.id
JOIN "public"."lots" l ON vc.lot_id = l.id
WHERE o.type = 'HOSPITAL'
  AND sb.is_recalled = false  -- 회수되지 않은 출고만
GROUP BY sb.to_organization_id, l.product_id
ON CONFLICT (hospital_id, product_id) DO NOTHING;

-- 마이그레이션 결과 로그 (선택적)
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM hospital_known_products;
    RAISE NOTICE 'hospital_known_products 마이그레이션 완료: % 건', v_count;
END $$;
