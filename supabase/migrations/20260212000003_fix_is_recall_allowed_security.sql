-- ============================================================================
-- Issue #46: is_recall_allowed SECURITY DEFINER 미설정 수정
--
-- 기존: SECURITY INVOKER (기본값) — RLS에 의해 접근 제한 가능
-- 변경: SECURITY DEFINER + SET search_path = public
--       (다른 atomic 함수들과 일관성 확보)
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."is_recall_allowed"("p_shipment_batch_id" "uuid")
RETURNS boolean
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shipment_date TIMESTAMPTZ;
  v_is_recalled BOOLEAN;
BEGIN
  SELECT shipment_date, is_recalled
  INTO v_shipment_date, v_is_recalled
  FROM shipment_batches
  WHERE id = p_shipment_batch_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_is_recalled THEN
    RETURN FALSE;
  END IF;

  RETURN (NOW() - v_shipment_date) <= INTERVAL '24 hours';
END;
$$;

COMMENT ON FUNCTION "public"."is_recall_allowed"(UUID)
    IS '시술 회수 가능 여부 확인 (24시간 이내, SECURITY DEFINER)';
