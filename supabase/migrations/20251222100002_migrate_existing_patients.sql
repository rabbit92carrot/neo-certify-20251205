-- ============================================================================
-- 기존 환자 데이터 마이그레이션
--
-- treatment_records에서 병원별 환자 정보를 hospital_known_patients로 이관
-- - 시술 횟수, 최초/마지막 시술일 계산
-- - 회수된 시술(is_recalled가 있다면)은 제외하지 않음 (treatment_records는 회수 시 삭제됨)
-- - 전화번호에서 010 제거하여 저장
-- ============================================================================

-- 기존 데이터 마이그레이션 (010 제거하여 저장)
INSERT INTO hospital_known_patients (
    hospital_id,
    patient_phone,
    treatment_count,
    first_treatment_at,
    last_treatment_at,
    created_at,
    updated_at
)
SELECT
    tr.hospital_id,
    -- 010 제거: 010으로 시작하면 4번째 문자부터, 아니면 그대로
    CASE
        WHEN tr.patient_phone LIKE '010%' THEN SUBSTRING(tr.patient_phone FROM 4)
        ELSE tr.patient_phone
    END AS patient_phone,
    COUNT(*)::INTEGER AS treatment_count,
    MIN(tr.created_at) AS first_treatment_at,
    MAX(tr.created_at) AS last_treatment_at,
    MIN(tr.created_at) AS created_at,
    now() AS updated_at
FROM treatment_records tr
GROUP BY tr.hospital_id,
    CASE
        WHEN tr.patient_phone LIKE '010%' THEN SUBSTRING(tr.patient_phone FROM 4)
        ELSE tr.patient_phone
    END
ON CONFLICT (hospital_id, patient_phone)
DO UPDATE SET
    treatment_count = EXCLUDED.treatment_count,
    first_treatment_at = LEAST(hospital_known_patients.first_treatment_at, EXCLUDED.first_treatment_at),
    last_treatment_at = GREATEST(hospital_known_patients.last_treatment_at, EXCLUDED.last_treatment_at),
    updated_at = now();

-- 마이그레이션 결과 확인용 코멘트
-- 실행 후 다음 쿼리로 확인 가능:
-- SELECT hospital_id, COUNT(*) as patient_count, SUM(treatment_count) as total_treatments
-- FROM hospital_known_patients GROUP BY hospital_id;
--
-- 저장된 전화번호 형식 확인:
-- SELECT patient_phone FROM hospital_known_patients LIMIT 10;
-- 예상 결과: 12345678 (010 제외된 형태)
