-- Migration: 20251218150000_hmac_virtual_code
-- Description: HMAC 서명 기반 가상코드 검증 시스템
--
-- 변경 내용:
-- 1. pgcrypto 확장 활성화 (HMAC 계산용)
-- 2. 비밀키 저장 테이블 생성
-- 3. generate_virtual_code_v2() 함수 (HMAC 서명 포함)
-- 4. verify_virtual_code() 함수 (서명 검증)
-- 5. 기존 코드 마이그레이션 (서명 추가)
-- 6. 트리거 업데이트
-- 7. create_treatment_atomic()에 검증 로직 추가

-- ============================================================================
-- Step 1: pgcrypto 확장 활성화
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Step 2: 비밀키 저장 테이블 (app_settings)
-- 환경변수 대신 DB에 저장하여 PostgreSQL 함수에서 접근 가능하게 함
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 비밀키는 마이그레이션 후 수동으로 설정해야 함
-- 보안상 키 값을 Git에 커밋하지 않음
--
-- 마이그레이션 후 다음 SQL을 실행하세요:
-- INSERT INTO app_settings (key, value, description)
-- VALUES (
--   'virtual_code_secret_key',
--   '<YOUR_SECRET_KEY_HERE>',  -- SELECT encode(gen_random_bytes(32), 'base64'); 로 생성
--   'HMAC 서명 생성용 비밀키'
-- );
--
-- 또는 이미 키가 있다면:
-- UPDATE app_settings SET value = '<YOUR_SECRET_KEY_HERE>' WHERE key = 'virtual_code_secret_key';

-- 플레이스홀더 삽입 (마이그레이션 실행 가능하도록)
-- 실제 키는 배포 시 반드시 변경해야 함
INSERT INTO app_settings (key, value, description)
VALUES (
  'virtual_code_secret_key',
  'CHANGE_ME_BEFORE_PRODUCTION',
  'HMAC 서명 생성용 비밀키. 배포 전 반드시 강력한 랜덤 키로 변경하세요. SELECT encode(gen_random_bytes(32), ''base64'');'
)
ON CONFLICT (key) DO NOTHING;

-- RLS 비활성화 (내부 설정 테이블)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 서비스 롤만 접근 가능
CREATE POLICY "app_settings_service_only" ON app_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Step 3: 비밀키 조회 헬퍼 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION get_virtual_code_secret()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT value FROM app_settings WHERE key = 'virtual_code_secret_key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 4: HMAC 서명 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_hmac_signature(payload TEXT)
RETURNS VARCHAR AS $$
DECLARE
  secret_key TEXT;
  full_hash TEXT;
BEGIN
  secret_key := get_virtual_code_secret();

  -- HMAC-SHA256 계산 후 앞 4자리 추출 (대문자)
  -- extensions 스키마에서 hmac 함수 호출
  full_hash := UPPER(encode(extensions.hmac(payload::bytea, secret_key::bytea, 'sha256'), 'hex'));

  RETURN SUBSTRING(full_hash FROM 1 FOR 4);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 5: 새 가상코드 생성 함수 (HMAC 서명 포함)
-- 형식: NC-{PAYLOAD}-{SIGNATURE} (예: NC-A3F8B2C1-X7K2)
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_virtual_code_v2()
RETURNS VARCHAR AS $$
DECLARE
  payload VARCHAR(8);
  signature VARCHAR(4);
  new_code VARCHAR(20);
  code_exists BOOLEAN;
  max_attempts INT := 100;
  attempts INT := 0;
BEGIN
  LOOP
    -- 8자리 암호학적 난수 페이로드 생성 (대문자 HEX)
    -- gen_random_bytes()는 pgcrypto의 암호학적으로 안전한 난수 생성기 사용
    payload := UPPER(SUBSTRING(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 8));

    -- HMAC 서명 생성 (4자리)
    signature := generate_hmac_signature(payload);

    -- 최종 코드: NC-{PAYLOAD}-{SIGNATURE}
    new_code := 'NC-' || payload || '-' || signature;

    -- 중복 체크
    SELECT EXISTS(SELECT 1 FROM virtual_codes WHERE code = new_code) INTO code_exists;

    EXIT WHEN NOT code_exists;

    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique virtual code after % attempts', max_attempts;
    END IF;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 6: 가상코드 검증 함수
-- 반환: TRUE (유효), FALSE (무효 또는 구형식)
-- ============================================================================
CREATE OR REPLACE FUNCTION verify_virtual_code(code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  payload VARCHAR;
  provided_sig VARCHAR;
  expected_sig VARCHAR;
BEGIN
  -- 형식 검증: NC-XXXXXXXX-XXXX (16자)
  IF LENGTH(code) != 16 OR NOT code ~ '^NC-[A-Z0-9]{8}-[A-Z0-9]{4}$' THEN
    -- 구형식(NC-XXXXXXXX, 11자)이거나 잘못된 형식
    RETURN FALSE;
  END IF;

  -- 페이로드 추출 (4~11자: A3F8B2C1)
  payload := SUBSTRING(code FROM 4 FOR 8);

  -- 제공된 서명 추출 (13~16자: X7K2)
  provided_sig := SUBSTRING(code FROM 13 FOR 4);

  -- 예상 서명 계산
  expected_sig := generate_hmac_signature(payload);

  -- 서명 비교
  RETURN provided_sig = expected_sig;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 7: 검증 실패 로그 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS virtual_code_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL,
  verification_result BOOLEAN NOT NULL,
  context VARCHAR(50),  -- 'TREATMENT', 'SHIPMENT' 등
  context_id UUID,      -- treatment_id, shipment_id 등
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_verification_logs_result
ON virtual_code_verification_logs(verification_result, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_logs_code
ON virtual_code_verification_logs(code);

-- RLS 비활성화 (내부 로그 테이블)
ALTER TABLE virtual_code_verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verification_logs_service_only" ON virtual_code_verification_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Step 8: 기존 코드 마이그레이션 (서명 추가)
-- NC-A3F8B2C1 → NC-A3F8B2C1-X7K2
-- ============================================================================
DO $$
DECLARE
  v_code RECORD;
  v_payload VARCHAR;
  v_signature VARCHAR;
  v_new_code VARCHAR;
  v_updated_count INT := 0;
BEGIN
  -- 구형식 코드만 선택 (11자: NC-XXXXXXXX)
  FOR v_code IN
    SELECT id, code
    FROM virtual_codes
    WHERE LENGTH(code) = 11
      AND code ~ '^NC-[A-Z0-9]{8}$'
  LOOP
    -- 페이로드 추출
    v_payload := SUBSTRING(v_code.code FROM 4 FOR 8);

    -- 서명 생성
    v_signature := generate_hmac_signature(v_payload);

    -- 새 코드 형식
    v_new_code := v_code.code || '-' || v_signature;

    -- 업데이트
    UPDATE virtual_codes
    SET code = v_new_code, updated_at = NOW()
    WHERE id = v_code.id;

    v_updated_count := v_updated_count + 1;
  END LOOP;

  RAISE NOTICE '기존 코드 마이그레이션 완료: %개 업데이트됨', v_updated_count;
END;
$$;

-- ============================================================================
-- Step 9: 트리거 함수 업데이트 (v2 함수 사용)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_virtual_codes_for_lot()
RETURNS TRIGGER AS $$
DECLARE
  v_manufacturer_id UUID;
BEGIN
  -- Get the manufacturer ID from the product
  SELECT p.organization_id INTO v_manufacturer_id
  FROM products p
  WHERE p.id = NEW.product_id;

  -- BULK INSERT: Single query instead of FOR loop
  -- generate_virtual_code_v2() 사용 (HMAC 서명 포함)
  INSERT INTO virtual_codes (code, lot_id, status, owner_type, owner_id)
  SELECT
    generate_virtual_code_v2(),
    NEW.id,
    'IN_STOCK',
    'ORGANIZATION',
    v_manufacturer_id::VARCHAR
  FROM generate_series(1, NEW.quantity);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 재생성 (이미 존재하면 교체)
DROP TRIGGER IF EXISTS trg_lot_create_virtual_codes ON lots;
CREATE TRIGGER trg_lot_create_virtual_codes
  AFTER INSERT ON lots
  FOR EACH ROW
  EXECUTE FUNCTION create_virtual_codes_for_lot();

-- Step 10, 11은 별도 마이그레이션 파일로 분리됨
-- 20251218150001_hmac_treatment_atomic.sql 참조
