-- =====================================================
-- Migration: 20251218200003_add_inactive_product_logging_helper
-- Description: 비활성 제품 사용 로깅 헬퍼 함수
-- =====================================================

-- ============================================
-- 헬퍼 함수: 비활성 제품 사용 로그 및 알림 생성
-- ============================================
CREATE OR REPLACE FUNCTION log_inactive_product_usage(
  p_usage_type VARCHAR,      -- 'SHIPMENT' or 'TREATMENT'
  p_usage_id UUID,           -- shipment_batch_id or treatment_id
  p_product_id UUID,
  p_organization_id UUID,    -- 사용 조직
  p_quantity INT
)
RETURNS VOID AS $$
DECLARE
  v_product RECORD;
  v_org RECORD;
  v_manufacturer_org RECORD;
  v_admin_orgs UUID[];
  v_admin_org_id UUID;
  v_alert_title VARCHAR;
  v_alert_content TEXT;
BEGIN
  -- 제품 정보 조회
  SELECT p.*, o.name AS manufacturer_name, o.id AS manufacturer_org_id
  INTO v_product
  FROM products p
  JOIN organizations o ON p.organization_id = o.id
  WHERE p.id = p_product_id;

  -- 제품이 활성 상태면 종료
  IF v_product.is_active = TRUE THEN
    RETURN;
  END IF;

  -- 사용 조직 정보 조회
  SELECT * INTO v_org
  FROM organizations
  WHERE id = p_organization_id;

  -- 사용 로그 기록
  INSERT INTO inactive_product_usage_logs (
    usage_type,
    usage_id,
    product_id,
    product_name,
    deactivation_reason,
    organization_id,
    organization_name,
    manufacturer_org_id,
    quantity
  ) VALUES (
    p_usage_type,
    p_usage_id,
    p_product_id,
    v_product.name,
    COALESCE(v_product.deactivation_reason, 'DISCONTINUED'),
    p_organization_id,
    v_org.name,
    v_product.manufacturer_org_id,
    p_quantity
  );

  -- 알림 제목/내용 생성
  v_alert_title := CASE
    WHEN v_product.deactivation_reason = 'SAFETY_ISSUE' THEN '[긴급] 안전 문제 제품 사용 감지'
    WHEN v_product.deactivation_reason = 'QUALITY_ISSUE' THEN '[주의] 품질 문제 제품 사용 감지'
    ELSE '비활성 제품 사용 감지'
  END;

  v_alert_content := format(
    '%s이(가) 비활성 제품 "%s"을(를) %s에 사용했습니다. (수량: %s개, 사유: %s)',
    v_org.name,
    v_product.name,
    CASE WHEN p_usage_type = 'SHIPMENT' THEN '출고' ELSE '시술' END,
    p_quantity,
    CASE v_product.deactivation_reason
      WHEN 'DISCONTINUED' THEN '단종'
      WHEN 'SAFETY_ISSUE' THEN '안전 문제'
      WHEN 'QUALITY_ISSUE' THEN '품질 문제'
      ELSE '기타'
    END
  );

  -- 관리자 조직들에게 알림 생성
  SELECT ARRAY_AGG(id) INTO v_admin_orgs
  FROM organizations
  WHERE type = 'ADMIN' AND status = 'ACTIVE';

  IF v_admin_orgs IS NOT NULL THEN
    FOREACH v_admin_org_id IN ARRAY v_admin_orgs
    LOOP
      INSERT INTO organization_alerts (
        alert_type,
        recipient_org_id,
        title,
        content,
        metadata
      ) VALUES (
        'INACTIVE_PRODUCT_USAGE',
        v_admin_org_id,
        v_alert_title,
        v_alert_content,
        jsonb_build_object(
          'productId', p_product_id,
          'productName', v_product.name,
          'usageType', p_usage_type,
          'usageId', p_usage_id,
          'quantity', p_quantity,
          'organizationId', p_organization_id,
          'organizationName', v_org.name,
          'deactivationReason', v_product.deactivation_reason
        )
      );
    END LOOP;
  END IF;

  -- 제조사에게 알림 생성
  INSERT INTO organization_alerts (
    alert_type,
    recipient_org_id,
    title,
    content,
    metadata
  ) VALUES (
    'INACTIVE_PRODUCT_USAGE',
    v_product.manufacturer_org_id,
    v_alert_title,
    v_alert_content,
    jsonb_build_object(
      'productId', p_product_id,
      'productName', v_product.name,
      'usageType', p_usage_type,
      'usageId', p_usage_id,
      'quantity', p_quantity,
      'organizationId', p_organization_id,
      'organizationName', v_org.name,
      'deactivationReason', v_product.deactivation_reason
    )
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
