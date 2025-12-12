-- =====================================================
-- Migration: 20251212100002_idx_histories_created_action
-- Description: 이력 조회 성능 최적화 인덱스
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_histories_created_action
ON histories(created_at DESC, action_type);
