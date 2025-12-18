-- =====================================================
-- Migration: 20251218200001_create_organization_alerts
-- Description: 조직 간 알림 테이블 생성
--
-- notification_messages: 환자 알림용 (KakaoTalk)
-- organization_alerts: 조직 간 알림용 (시스템 내 알림)
--
-- 알림 유형:
--   - INACTIVE_PRODUCT_USAGE: 비활성 제품 사용 알림
--   - SYSTEM_NOTICE: 시스템 공지 (향후)
--   - CUSTOM_MESSAGE: 관리자 발송 메시지 (향후)
-- =====================================================

-- 조직 알림 유형 ENUM 생성
CREATE TYPE organization_alert_type AS ENUM (
  'INACTIVE_PRODUCT_USAGE',
  'SYSTEM_NOTICE',
  'CUSTOM_MESSAGE'
);

-- 조직 알림 테이블 생성
CREATE TABLE organization_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 알림 유형
  alert_type organization_alert_type NOT NULL,

  -- 수신 조직
  recipient_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- 제목 및 내용
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,

  -- 관련 데이터 (JSON)
  -- 예: {productId, productName, usageType, usageId, quantity, organizationName}
  metadata JSONB,

  -- 상태
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- 메타
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_org_alerts_recipient_unread ON organization_alerts(recipient_org_id, is_read, created_at DESC);
CREATE INDEX idx_org_alerts_type ON organization_alerts(alert_type);
CREATE INDEX idx_org_alerts_created_at ON organization_alerts(created_at DESC);

-- RLS 활성화
ALTER TABLE organization_alerts ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 수신 조직만 조회 가능
CREATE POLICY "organization_alerts_select"
  ON organization_alerts FOR SELECT
  USING (
    recipient_org_id = get_user_organization_id()
    OR is_admin()
  );

-- RLS 정책: 수신 조직만 업데이트 가능 (읽음 처리)
CREATE POLICY "organization_alerts_update"
  ON organization_alerts FOR UPDATE
  USING (recipient_org_id = get_user_organization_id())
  WITH CHECK (recipient_org_id = get_user_organization_id());

-- RLS 정책: 시스템에서만 INSERT 가능 (SECURITY DEFINER 함수 통해)
CREATE POLICY "organization_alerts_insert"
  ON organization_alerts FOR INSERT
  WITH CHECK (TRUE);  -- DB 함수에서 제어

COMMENT ON TABLE organization_alerts IS '조직 간 알림 테이블 (비활성 제품 사용 알림, 시스템 공지 등)';
COMMENT ON COLUMN organization_alerts.alert_type IS '알림 유형';
COMMENT ON COLUMN organization_alerts.recipient_org_id IS '수신 조직 ID';
COMMENT ON COLUMN organization_alerts.metadata IS '관련 데이터 (JSON)';
COMMENT ON COLUMN organization_alerts.is_read IS '읽음 여부';
