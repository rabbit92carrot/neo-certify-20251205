-- Migration: 00009_create_notifications
-- Description: Create notification_messages table
-- Created: 2025-12-09

-- ============================================
-- Notification Messages Table
-- ============================================
-- Stores notification messages for KakaoTalk alerts
-- In Phase 1, messages are stored but not actually sent (Mock)

CREATE TABLE notification_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Notification type
  type notification_type NOT NULL,

  -- Recipient patient
  patient_phone VARCHAR(15) NOT NULL REFERENCES patients(phone_number) ON DELETE RESTRICT,

  -- Message content
  content TEXT NOT NULL,

  -- Send status (always false in Phase 1)
  is_sent BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE notification_messages IS '알림 메시지 - 카카오 알림톡 Mock (1차에서는 DB 기록만)';
COMMENT ON COLUMN notification_messages.type IS '알림 유형: CERTIFICATION(정품인증), RECALL(회수알림)';
COMMENT ON COLUMN notification_messages.patient_phone IS '수신자 환자 전화번호';
COMMENT ON COLUMN notification_messages.content IS '메시지 내용';
COMMENT ON COLUMN notification_messages.is_sent IS '실제 발송 여부 (1차에서는 항상 false, 2차에서 실제 API 연동)';
