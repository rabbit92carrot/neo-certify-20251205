-- Migration: 20251209080800_create_notifications
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

