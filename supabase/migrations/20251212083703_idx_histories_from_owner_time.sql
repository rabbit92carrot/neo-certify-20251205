-- Migration: 20251212083703_idx_histories_from_owner_time
-- Description: Index for history queries by from_owner

CREATE INDEX IF NOT EXISTS idx_histories_from_owner_time
ON histories(from_owner_id, created_at DESC)
WHERE from_owner_type = 'ORGANIZATION';
