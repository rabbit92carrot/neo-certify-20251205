-- ============================================================================
-- Storage bucket 생성 (squash에서 제외된 DML 복구)
-- ============================================================================

-- 사업자등록증 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-licenses',
  'business-licenses',
  false, -- private bucket
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;
