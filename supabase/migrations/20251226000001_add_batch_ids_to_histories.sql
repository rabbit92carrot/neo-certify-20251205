-- histories 테이블에 lot_id, treatment_id 컬럼 추가
-- SSOT 기반 이력 그룹핑을 위한 배치 ID 추가
--
-- 목적:
-- - PRODUCED 이벤트: lot_id로 그룹핑 (로트 단위)
-- - TREATED/RECALLED(시술) 이벤트: treatment_id로 그룹핑 (시술 단위)
-- - SHIPPED/RECEIVED/RECALLED(출고) 이벤트: 기존 shipment_batch_id 사용

-- 1. histories 테이블에 새 컬럼 추가
ALTER TABLE histories ADD COLUMN IF NOT EXISTS lot_id uuid REFERENCES lots(id) ON DELETE SET NULL;
ALTER TABLE histories ADD COLUMN IF NOT EXISTS treatment_id uuid REFERENCES treatment_records(id) ON DELETE SET NULL;

-- 2. 인덱스 추가 (그룹핑 성능 향상)
CREATE INDEX IF NOT EXISTS idx_histories_lot_id ON histories(lot_id) WHERE lot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_histories_treatment_id ON histories(treatment_id) WHERE treatment_id IS NOT NULL;
-- shipment_batch_id 인덱스는 이미 존재할 수 있으므로 IF NOT EXISTS 사용
CREATE INDEX IF NOT EXISTS idx_histories_shipment_batch_id ON histories(shipment_batch_id) WHERE shipment_batch_id IS NOT NULL;

-- 3. 기존 데이터 마이그레이션 (PRODUCED 이벤트)
-- virtual_codes 테이블에서 lot_id를 가져와서 histories에 채워넣음
UPDATE histories h
SET lot_id = vc.lot_id
FROM virtual_codes vc
WHERE h.virtual_code_id = vc.id
  AND h.action_type = 'PRODUCED'
  AND h.lot_id IS NULL;

-- 4. 기존 데이터 마이그레이션 (TREATED 이벤트)
-- treatment_details 테이블에서 treatment_id를 가져와서 histories에 채워넣음
UPDATE histories h
SET treatment_id = td.treatment_id
FROM treatment_details td
WHERE h.virtual_code_id = td.virtual_code_id
  AND h.action_type = 'TREATED'
  AND h.treatment_id IS NULL;

-- 5. 기존 데이터 마이그레이션 (RECALLED 이벤트 - 시술 회수)
-- 시술 회수는 from_owner_type이 PATIENT인 경우 (출고 회수는 shipment_batch_id 사용)
-- 추가 조건: shipment_batch_id가 NULL인 경우만 (출고 회수와 구분)
UPDATE histories h
SET treatment_id = td.treatment_id
FROM treatment_details td
WHERE h.virtual_code_id = td.virtual_code_id
  AND h.action_type = 'RECALLED'
  AND h.from_owner_type = 'PATIENT'
  AND h.shipment_batch_id IS NULL  -- 출고 회수가 아닌 경우만
  AND h.treatment_id IS NULL;

-- 컬럼 코멘트는 SQL 주석으로 대체 (Supabase 원격 마이그레이션 호환성)
-- lot_id: PRODUCED 이벤트의 로트 ID (SSOT 그룹핑용)
-- treatment_id: TREATED/RECALLED(시술) 이벤트의 시술 ID (SSOT 그룹핑용)
