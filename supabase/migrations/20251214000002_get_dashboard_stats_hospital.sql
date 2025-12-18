-- 병원 대시보드 통계 통합 함수
-- 4개의 개별 쿼리를 1개의 RPC 호출로 통합하여 DB 왕복 75% 감소
CREATE OR REPLACE FUNCTION get_dashboard_stats_hospital(p_organization_id UUID)
RETURNS TABLE (
  total_inventory BIGINT,
  today_received BIGINT,
  today_treatments BIGINT,
  unique_patients BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_today_end TIMESTAMPTZ;
BEGIN
  -- 한국 시간대 기준 오늘 날짜 (UTC+9)
  v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul';
  v_today_end := v_today_start + INTERVAL '1 day';

  RETURN QUERY
  SELECT
    -- 1. 총 재고량: 현재 보유 중인 가상 코드 수
    (
      SELECT COALESCE(COUNT(vc.id), 0)::BIGINT
      FROM virtual_codes vc
      WHERE vc.owner_id = p_organization_id::TEXT
        AND vc.owner_type = 'ORGANIZATION'
        AND vc.status = 'IN_STOCK'
    ) AS total_inventory,

    -- 2. 오늘 입고량: 오늘 수신한 출고의 가상 코드 수
    (
      SELECT COALESCE(COUNT(sd.id), 0)::BIGINT
      FROM shipment_details sd
      INNER JOIN shipment_batches sb ON sb.id = sd.shipment_batch_id
      WHERE sb.to_organization_id = p_organization_id
        AND sb.shipment_date >= v_today_start
        AND sb.shipment_date < v_today_end
        AND sb.is_recalled = FALSE
    ) AS today_received,

    -- 3. 오늘 시술량: 오늘 시술된 가상 코드 수
    (
      SELECT COALESCE(COUNT(td.id), 0)::BIGINT
      FROM treatment_details td
      INNER JOIN treatment_records tr ON tr.id = td.treatment_id
      WHERE tr.hospital_id = p_organization_id
        AND tr.treatment_date >= v_today_start
        AND tr.treatment_date < v_today_end
        AND tr.is_recalled = FALSE
    ) AS today_treatments,

    -- 4. 누적 환자 수: 고유 환자 수
    (
      SELECT COALESCE(COUNT(DISTINCT tr.patient_id), 0)::BIGINT
      FROM treatment_records tr
      WHERE tr.hospital_id = p_organization_id
        AND tr.is_recalled = FALSE
    ) AS unique_patients;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION get_dashboard_stats_hospital(UUID) TO authenticated;

COMMENT ON FUNCTION get_dashboard_stats_hospital(UUID) IS
  '병원 대시보드 통계 통합 조회. 4개 쿼리를 1개 RPC로 통합하여 DB 왕복 감소';
