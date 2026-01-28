-- Fix: treatment_summaries CTE의 제품별 집계 버그 수정
--
-- 문제: GROUP BY td.treatment_id만 사용하여 제품별 그룹핑 없이
--       CROSS JOIN LATERAL 결과가 중복 포함됨
--       (예: 제품 A 5개 + 제품 B 10개 → 한 제품 15개로 표시)
--
-- 수정: 2단계 집계 (제품별 COUNT → 치료별 JSONB_AGG)

CREATE OR REPLACE FUNCTION public.get_treatment_history_consolidated(
  p_hospital_id UUID,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 20,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_patient_phone VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  hospital_id UUID,
  patient_phone VARCHAR,
  treatment_date DATE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  hospital_name VARCHAR,
  hospital_type public.organization_type,
  item_summary JSONB,
  total_quantity BIGINT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  RETURN QUERY
  WITH
  -- 1단계: 시술 기록 조회 (필터링 + 페이지네이션)
  filtered_treatments AS (
    SELECT
      tr.id,
      tr.hospital_id,
      tr.patient_phone,
      tr.treatment_date,
      tr.created_at,
      tr.updated_at,
      o.name AS hospital_name,
      o.type AS hospital_type
    FROM treatment_records tr
    JOIN organizations o ON o.id = tr.hospital_id
    WHERE tr.hospital_id = p_hospital_id
      AND (p_start_date IS NULL OR tr.treatment_date >= p_start_date)
      AND (p_end_date IS NULL OR tr.treatment_date <= p_end_date)
      AND (p_patient_phone IS NULL OR tr.patient_phone = p_patient_phone)
    ORDER BY tr.treatment_date DESC, tr.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset
  ),
  -- 2단계: 전체 카운트 (페이지네이션용)
  total AS (
    SELECT COUNT(*)::BIGINT AS cnt
    FROM treatment_records tr
    WHERE tr.hospital_id = p_hospital_id
      AND (p_start_date IS NULL OR tr.treatment_date >= p_start_date)
      AND (p_end_date IS NULL OR tr.treatment_date <= p_end_date)
      AND (p_patient_phone IS NULL OR tr.patient_phone = p_patient_phone)
  ),
  -- 3단계: 제품별 수량 집계 (2단계 집계)
  treatment_summaries AS (
    SELECT
      per_product.treatment_id,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'productId', per_product.product_id,
          'productName', per_product.product_name,
          'quantity', per_product.quantity
        )
      ) AS item_summary,
      SUM(per_product.quantity)::BIGINT AS total_quantity
    FROM (
      SELECT
        td.treatment_id,
        p.id AS product_id,
        p.name AS product_name,
        COUNT(td.id)::BIGINT AS quantity
      FROM filtered_treatments ft
      JOIN treatment_details td ON td.treatment_id = ft.id
      JOIN virtual_codes vc ON vc.id = td.virtual_code_id
      JOIN lots l ON l.id = vc.lot_id
      JOIN products p ON p.id = l.product_id
      GROUP BY td.treatment_id, p.id, p.name
    ) per_product
    GROUP BY per_product.treatment_id
  )
  -- 최종 결과: 시술 기록 + 요약 정보 조합
  SELECT
    ft.id,
    ft.hospital_id,
    ft.patient_phone,
    ft.treatment_date,
    ft.created_at,
    ft.updated_at,
    ft.hospital_name,
    ft.hospital_type,
    COALESCE(ts.item_summary, '[]'::JSONB) AS item_summary,
    COALESCE(ts.total_quantity, 0) AS total_quantity,
    t.cnt AS total_count
  FROM filtered_treatments ft
  LEFT JOIN treatment_summaries ts ON ts.treatment_id = ft.id
  CROSS JOIN total t
  ORDER BY ft.treatment_date DESC, ft.created_at DESC;
END;
$$;
