-- ============================================================================
-- 병원 제품 관리 RPC 함수들
--
-- 함수 목록:
-- 1. get_hospital_known_products - 병원의 known products 목록 조회
-- 2. check_hospital_alias_duplicate - 별칭 중복 체크
-- 3. update_hospital_product_settings - 제품 설정 업데이트 (별칭, 활성화)
-- ============================================================================

-- ============================================================================
-- 1. get_hospital_known_products: 병원의 known products 목록 조회
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."get_hospital_known_products"(
    p_hospital_id UUID,
    p_search TEXT DEFAULT NULL,
    p_alias_filter TEXT DEFAULT NULL,  -- 'with_alias', 'without_alias', NULL (전체)
    p_active_filter BOOLEAN DEFAULT NULL  -- true (활성만), false (비활성만), NULL (전체)
)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    product_name VARCHAR,
    model_name VARCHAR,
    udi_di VARCHAR,
    alias VARCHAR,
    is_active BOOLEAN,
    first_received_at TIMESTAMPTZ,
    current_inventory BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        hkp.id,
        hkp.product_id,
        p.name AS product_name,
        p.model_name,
        p.udi_di,
        hkp.alias,
        hkp.is_active,
        hkp.first_received_at,
        COALESCE((
            SELECT COUNT(*)
            FROM virtual_codes vc
            JOIN lots l ON vc.lot_id = l.id
            WHERE l.product_id = hkp.product_id
              AND vc.owner_id = p_hospital_id::VARCHAR
              AND vc.status = 'IN_STOCK'
        ), 0)::BIGINT AS current_inventory
    FROM hospital_known_products hkp
    JOIN products p ON hkp.product_id = p.id
    WHERE hkp.hospital_id = p_hospital_id
      -- 검색 필터 (별칭, 제품명, 모델명)
      AND (
          p_search IS NULL
          OR p_search = ''
          OR p.name ILIKE '%' || p_search || '%'
          OR p.model_name ILIKE '%' || p_search || '%'
          OR hkp.alias ILIKE '%' || p_search || '%'
      )
      -- 별칭 필터
      AND (
          p_alias_filter IS NULL
          OR (p_alias_filter = 'with_alias' AND hkp.alias IS NOT NULL)
          OR (p_alias_filter = 'without_alias' AND hkp.alias IS NULL)
      )
      -- 활성화 필터
      AND (
          p_active_filter IS NULL
          OR hkp.is_active = p_active_filter
      )
    ORDER BY
        hkp.is_active DESC,  -- 활성 제품 먼저
        CASE WHEN hkp.alias IS NOT NULL THEN 0 ELSE 1 END,  -- 별칭 있는 제품 먼저
        p.name ASC;
END;
$$;

COMMENT ON FUNCTION "public"."get_hospital_known_products"(UUID, TEXT, TEXT, BOOLEAN)
    IS '병원의 known products 목록 조회 (검색, 필터링 지원)';


-- ============================================================================
-- 2. check_hospital_alias_duplicate: 별칭 중복 체크
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."check_hospital_alias_duplicate"(
    p_hospital_id UUID,
    p_alias TEXT,
    p_exclude_product_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- NULL 또는 빈 문자열은 중복 체크 불필요
    IF p_alias IS NULL OR trim(p_alias) = '' THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM hospital_known_products
        WHERE hospital_id = p_hospital_id
          AND alias = trim(p_alias)
          AND (p_exclude_product_id IS NULL OR product_id != p_exclude_product_id)
    );
END;
$$;

COMMENT ON FUNCTION "public"."check_hospital_alias_duplicate"(UUID, TEXT, UUID)
    IS '병원 내 별칭 중복 여부 확인 (true = 중복)';


-- ============================================================================
-- 3. update_hospital_product_settings: 제품 설정 업데이트
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."update_hospital_product_settings"(
    p_hospital_id UUID,
    p_product_id UUID,
    p_alias TEXT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    error_code VARCHAR,
    error_message VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_id UUID;
    v_trimmed_alias TEXT;
BEGIN
    -- 별칭 정리 (빈 문자열 → NULL)
    v_trimmed_alias := NULLIF(trim(COALESCE(p_alias, '')), '');

    -- 존재 여부 확인
    SELECT hkp.id INTO v_existing_id
    FROM hospital_known_products hkp
    WHERE hkp.hospital_id = p_hospital_id
      AND hkp.product_id = p_product_id;

    IF v_existing_id IS NULL THEN
        RETURN QUERY SELECT false, 'NOT_FOUND'::VARCHAR, '제품을 찾을 수 없습니다.'::VARCHAR;
        RETURN;
    END IF;

    -- 별칭 중복 체크 (별칭이 실제로 변경되는 경우만)
    IF v_trimmed_alias IS NOT NULL THEN
        IF check_hospital_alias_duplicate(p_hospital_id, v_trimmed_alias, p_product_id) THEN
            RETURN QUERY SELECT false, 'DUPLICATE_ALIAS'::VARCHAR, '이미 사용 중인 별칭입니다.'::VARCHAR;
            RETURN;
        END IF;
    END IF;

    -- 업데이트 (NULL 파라미터는 기존 값 유지)
    UPDATE hospital_known_products
    SET
        alias = CASE
            WHEN p_alias IS NOT NULL THEN v_trimmed_alias
            ELSE alias
        END,
        is_active = COALESCE(p_is_active, is_active),
        updated_at = now()
    WHERE id = v_existing_id;

    RETURN QUERY SELECT true, NULL::VARCHAR, NULL::VARCHAR;
END;
$$;

COMMENT ON FUNCTION "public"."update_hospital_product_settings"(UUID, UUID, TEXT, BOOLEAN)
    IS '병원 제품 설정 업데이트 (별칭, 활성화 상태)';


-- ============================================================================
-- 4. get_active_products_for_treatment: 시술 등록용 활성 제품 목록
--    (재고가 있고 활성화된 제품만)
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."get_active_products_for_treatment"(
    p_hospital_id UUID
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    model_name VARCHAR,
    udi_di VARCHAR,
    alias VARCHAR,
    available_quantity BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.model_name,
        p.udi_di,
        hkp.alias,
        COUNT(vc.id)::BIGINT AS available_quantity
    FROM products p
    JOIN lots l ON l.product_id = p.id
    JOIN virtual_codes vc ON vc.lot_id = l.id
    LEFT JOIN hospital_known_products hkp
        ON hkp.product_id = p.id
        AND hkp.hospital_id = p_hospital_id
    WHERE vc.owner_id = p_hospital_id::VARCHAR
      AND vc.status = 'IN_STOCK'
      AND p.is_active = true
      -- 활성화 체크: known_products에 없거나 is_active = true
      AND (hkp.id IS NULL OR hkp.is_active = true)
    GROUP BY p.id, p.name, p.model_name, p.udi_di, hkp.alias
    HAVING COUNT(vc.id) > 0
    ORDER BY
        CASE WHEN hkp.alias IS NOT NULL THEN 0 ELSE 1 END,  -- 별칭 있는 제품 먼저
        hkp.alias NULLS LAST,
        p.name ASC;
END;
$$;

COMMENT ON FUNCTION "public"."get_active_products_for_treatment"(UUID)
    IS '시술 등록용 활성 제품 목록 (재고 있고 활성화된 제품만)';
