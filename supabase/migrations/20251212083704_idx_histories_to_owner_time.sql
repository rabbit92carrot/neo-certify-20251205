-- Migration: 20251212083704_idx_histories_to_owner_time
-- Description: Index for history queries by to_owner

CREATE INDEX IF NOT EXISTS idx_histories_to_owner_time
ON histories(to_owner_id, created_at DESC)
WHERE to_owner_type = 'ORGANIZATION';
