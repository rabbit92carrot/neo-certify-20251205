-- =====================================================
-- Migration: 20251218200002_create_inactive_product_usage_logs
-- Description: 비활성 제품 사용 이력 테이블 생성
--
-- 목적: 비활성(단종/리콜) 제품이 출고 또는 시술에 사용될 때 기록
--       관리자가 이를 모니터링하고 확인 처리할 수 있음
-- =====================================================

-- 비활성 제품 사용 이력 테이블 생성
CREATE TABLE inactive_product_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용 정보
  usage_type VARCHAR(20) NOT NULL CHECK (usage_type IN ('SHIPMENT', 'TREATMENT')),
  usage_id UUID NOT NULL,  -- shipment_batch_id or treatment_id

  -- 제품 정보
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(100) NOT NULL,
  deactivation_reason product_deactivation_reason NOT NULL,

  -- 사용 조직 정보
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  organization_name VARCHAR(100) NOT NULL,

  -- 제조사 정보 (알림 발송용)
  manufacturer_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,

  -- 수량
  quantity INTEGER NOT NULL CHECK (quantity > 0),

  -- 메타
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,  -- 관리자 확인 일시
  acknowledged_by UUID REFERENCES organizations(id)  -- 확인한 관리자 조직
);

-- 인덱스
CREATE INDEX idx_inactive_usage_logs_created_at ON inactive_product_usage_logs(created_at DESC);
CREATE INDEX idx_inactive_usage_logs_unacknowledged ON inactive_product_usage_logs(acknowledged_at)
WHERE acknowledged_at IS NULL;
CREATE INDEX idx_inactive_usage_logs_manufacturer ON inactive_product_usage_logs(manufacturer_org_id, created_at DESC);
CREATE INDEX idx_inactive_usage_logs_product ON inactive_product_usage_logs(product_id);

-- RLS 활성화
ALTER TABLE inactive_product_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 관리자만 전체 조회 가능
CREATE POLICY "inactive_usage_logs_admin_select"
  ON inactive_product_usage_logs FOR SELECT
  USING (is_admin());

-- RLS 정책: 제조사는 자사 제품 관련 로그만 조회 가능
CREATE POLICY "inactive_usage_logs_manufacturer_select"
  ON inactive_product_usage_logs FOR SELECT
  USING (
    manufacturer_org_id = get_user_organization_id()
    AND get_user_organization_type() = 'MANUFACTURER'
  );

-- RLS 정책: 관리자만 업데이트 가능 (확인 처리)
CREATE POLICY "inactive_usage_logs_admin_update"
  ON inactive_product_usage_logs FOR UPDATE
  USING (is_admin());

-- RLS 정책: INSERT는 시스템에서만 (SECURITY DEFINER 함수 통해)
CREATE POLICY "inactive_usage_logs_insert"
  ON inactive_product_usage_logs FOR INSERT
  WITH CHECK (TRUE);  -- DB 함수에서 제어

COMMENT ON TABLE inactive_product_usage_logs IS '비활성 제품 사용 이력 (출고/시술 시 비활성 제품 사용 기록)';
COMMENT ON COLUMN inactive_product_usage_logs.usage_type IS '사용 유형: SHIPMENT(출고) or TREATMENT(시술)';
COMMENT ON COLUMN inactive_product_usage_logs.usage_id IS '출고 배치 ID 또는 시술 기록 ID';
COMMENT ON COLUMN inactive_product_usage_logs.acknowledged_at IS '관리자 확인 일시';
COMMENT ON COLUMN inactive_product_usage_logs.acknowledged_by IS '확인 처리한 관리자 조직 ID';
