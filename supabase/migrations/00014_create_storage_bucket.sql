-- ============================================================================
-- 00014: Storage 버킷 생성
-- 사업자등록증 파일 업로드를 위한 private 버킷
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

-- ============================================================================
-- Storage RLS 정책
-- ============================================================================

-- 기존 정책 삭제 (재실행 가능하도록)
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access all files" ON storage.objects;

-- 사용자 본인 파일 업로드 정책
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 사용자 본인 파일 조회 정책
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'business-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 사용자 본인 파일 수정 정책
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 사용자 본인 파일 삭제 정책
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin은 모든 파일 접근 가능
CREATE POLICY "Admins can access all files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'business-licenses' AND
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE auth_user_id = auth.uid() AND type = 'ADMIN'
  )
);
