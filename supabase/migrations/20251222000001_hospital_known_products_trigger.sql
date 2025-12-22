-- ============================================================================
-- 병원 입고 시 hospital_known_products 자동 등록 트리거
--
-- 목적: 병원으로 출고가 완료되면 해당 제품을 hospital_known_products에 자동 등록
-- 동작: shipment_batches에 INSERT 발생 시, 수신자가 병원이면 제품 등록
-- ============================================================================

-- 입고 시 hospital_known_products에 자동 등록하는 함수
CREATE OR REPLACE FUNCTION "public"."register_hospital_known_product"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_receiver_type organization_type;
BEGIN
    -- 수신자 조직 타입 확인
    SELECT type INTO v_receiver_type
    FROM organizations
    WHERE id = NEW.to_organization_id;

    -- 수신자가 병원이 아닌 경우 스킵
    IF v_receiver_type IS NULL OR v_receiver_type != 'HOSPITAL' THEN
        RETURN NEW;
    END IF;

    -- 해당 shipment의 모든 제품을 hospital_known_products에 등록
    -- ON CONFLICT: 이미 등록된 제품은 무시 (first_received_at 유지)
    INSERT INTO hospital_known_products (hospital_id, product_id, first_received_at)
    SELECT DISTINCT
        NEW.to_organization_id,
        l.product_id,
        NEW.shipment_date
    FROM shipment_details sd
    JOIN virtual_codes vc ON sd.virtual_code_id = vc.id
    JOIN lots l ON vc.lot_id = l.id
    WHERE sd.shipment_batch_id = NEW.id
    ON CONFLICT (hospital_id, product_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- 함수 코멘트
COMMENT ON FUNCTION "public"."register_hospital_known_product"()
    IS '병원 입고 시 hospital_known_products 테이블에 제품 자동 등록';

-- 트리거 생성: shipment_batches INSERT 후 실행
CREATE TRIGGER "trg_register_hospital_known_product"
    AFTER INSERT ON "public"."shipment_batches"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."register_hospital_known_product"();

-- 트리거 코멘트
COMMENT ON TRIGGER "trg_register_hospital_known_product" ON "public"."shipment_batches"
    IS '출고 완료 시 병원의 known products에 자동 등록';
